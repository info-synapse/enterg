// In-memory mock of the API gateway. Adds a small delay to every call so loading states are visible.
import type { Api } from '../services';
import type { Bet, EventDetail, Limit, MicroMarket, PaymentResult, Rewards, Selection, SlipSelection, Transaction } from '../types';
import { cashOutValue } from '@/lib/cashout';
import { decodeSlip, encodeSlip, type CodeEntry } from '@/lib/bookingCode';
import {
  collections, competitions, demoBalance, demoBets, demoLimits, demoPlayer, demoTransactions, events, games,
  jackpots, liveTables, THEMES, FEATURES, stories, makeVirtualEvents, virtualSelections, paymentMethods, promos, providers, sports, virtualLeagues, withdrawalMethods,
} from './data';

const delay = <T,>(value: T, ms = 220 + Math.random() * 250) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const state = {
  balance: { ...demoBalance },
  bets: [...demoBets],
  transactions: [...demoTransactions],
  limits: [...demoLimits],
  player: { ...demoPlayer },
};

let betSeq = 55200;

/* ---------- Selection lookup (markets, player tables, Bet Builder lines, fast markets) ---------- */

function findSelection(id: string): { e: EventDetail; marketName: string; s: Selection } | undefined {
  for (const e of events) {
    for (const m of e.markets) {
      const s = m.selections.find((x) => x.id === id);
      if (s) return { e, marketName: m.name, s };
    }
    for (const t of e.players ?? []) {
      for (const r of t.rows) {
        const i = r.cells.findIndex((c) => c?.id === id);
        if (i >= 0) return { e, marketName: t.columns[i], s: r.cells[i]! };
      }
    }
  }
  return undefined;
}

/** "1" / "X" / "2" read better as team names once they leave the market grid. */
const readable = (f: NonNullable<ReturnType<typeof findSelection>>) =>
  /result$/.test(f.marketName) ? ({ '1': f.e.home, X: 'Draw', '2': f.e.away } as Record<string, string>)[f.s.label] ?? f.s.label : f.s.label;

const toSlip = (f: NonNullable<ReturnType<typeof findSelection>>): SlipSelection => ({
  selectionId: f.s.id, eventId: f.e.id, eventName: `${f.e.home} – ${f.e.away}`, marketName: f.marketName, label: f.s.label, odds: f.s.odds, live: !!f.e.live,
});
const currentOdds = (id: string, fallback: number) => findSelection(id)?.s.odds ?? microSelections.get(id)?.odds ?? fallback;

const builderLines = new Map<string, SlipSelection>();
const microSelections = new Map<string, SlipSelection>();

function priceBuilder(eventId: string, ids: string[]): SlipSelection {
  if (ids.length < 2) throw new ApiError('BB_TOO_FEW', 'Pick at least 2 selections for a Bet Builder.');
  if (ids.length > 7) throw new ApiError('BB_TOO_MANY', 'A Bet Builder can have up to 7 selections.');
  const legs = ids.map((id) => findSelection(id));
  if (legs.some((l) => !l || l.e.id !== eventId)) throw new ApiError('BB_UNAVAILABLE', 'One of these selections is no longer available.');
  const list = legs as NonNullable<ReturnType<typeof findSelection>>[];
  // Related selections are priced lower than their plain product (correlation); the trading platform does this in production.
  const odds = Math.round(list.reduce((p, l) => p * l.s.odds, 1) * Math.pow(0.93, ids.length - 1) * 100) / 100;
  const e = list[0].e;
  const line: SlipSelection = {
    selectionId: `bb-${eventId}-${[...ids].sort().join('.')}`, eventId, eventName: `${e.home} – ${e.away}`, marketName: 'Bet Builder',
    label: `${ids.length} selections`, odds, live: !!e.live, builder: list.map((l) => ({ selectionId: l.s.id, label: readable(l), marketName: l.marketName })),
  };
  builderLines.set(line.selectionId, line);
  return line;
}

/* ---------- Fast (micro) markets ---------- */

const MICRO_TEMPLATES: Record<string, { title: string; span: number; options: string[]; weights: number[] }[]> = {
  football: [
    { title: 'Corner in the next 5 minutes', span: 5, options: ['Yes', 'No'], weights: [0.45, 0.55] },
    { title: 'Goal in the next 10 minutes', span: 10, options: ['Yes', 'No'], weights: [0.22, 0.78] },
    { title: 'Card in the next 10 minutes', span: 10, options: ['Yes', 'No'], weights: [0.3, 0.7] },
  ],
  basketball: [
    { title: 'Team to score next', span: 1, options: ['HOME', 'AWAY'], weights: [0.5, 0.5] },
    { title: '3-pointer in the next 2 minutes', span: 2, options: ['Yes', 'No'], weights: [0.7, 0.3] },
  ],
  tennis: [
    { title: 'Next point winner', span: 0, options: ['HOME', 'AWAY'], weights: [0.55, 0.45] },
    { title: 'Current game goes to deuce', span: 0, options: ['Yes', 'No'], weights: [0.3, 0.7] },
  ],
};
const OPEN_MS = [40_000, 70_000];
const SETTLE_MS = 4_000;
const SHOW_MS = 7_000;
const micro = new Map<string, { markets: MicroMarket[]; next: number }>();
let microSeq = 1;

function makeMicro(e: EventDetail, slot: number, templateIndex: number, startIn = 0): MicroMarket {
  const list = MICRO_TEMPLATES[e.sportId];
  const t = list[templateIndex % list.length];
  const m = e.live?.minute ?? 0;
  const opensAt = Date.now() + startIn;
  const label = (o: string) => (o === 'HOME' ? e.home : o === 'AWAY' ? e.away : o);
  const selections = t.options.map((o, i) => ({ id: `mk${microSeq++}`, label: label(o), odds: Math.round((1 / t.weights[i]) * 0.92 * 100) / 100 }));
  const market: MicroMarket = {
    id: `mm${microSeq++}`, eventId: e.id, title: t.title, window: t.span ? `${m + 1}′–${m + 1 + t.span}′` : 'Now',
    opensAt: new Date(opensAt).toISOString(), closesAt: new Date(opensAt + OPEN_MS[slot]).toISOString(), status: 'open', selections,
  };
  selections.forEach((s) => microSelections.set(s.id, { selectionId: s.id, eventId: e.id, eventName: `${e.home} – ${e.away}`, marketName: `${t.title} (${market.window})`, label: s.label, odds: s.odds, live: true, fast: true }));
  (market as MicroMarket & { weights: number[] }).weights = t.weights;
  return market;
}

function microFor(e: EventDetail): MicroMarket[] {
  if (!e.live || !MICRO_TEMPLATES[e.sportId]) return [];
  let st = micro.get(e.id);
  if (!st) {
    st = { markets: [makeMicro(e, 0, 0), makeMicro(e, 1, 1)], next: 2 };
    micro.set(e.id, st);
  }
  const now = Date.now();
  st.markets = st.markets.map((m, slot) => {
    const closes = Date.parse(m.closesAt);
    if (now < closes) return m;
    if (now < closes + SETTLE_MS) return { ...m, status: 'settling', selections: m.selections.map((s) => ({ ...s, suspended: true })) };
    if (now < closes + SETTLE_MS + SHOW_MS) {
      if (m.status !== 'settled') {
        const w = (m as MicroMarket & { weights: number[] }).weights;
        const r = Math.random() < w[0] ? 0 : 1;
        return { ...m, status: 'settled', result: m.selections[r].label, selections: m.selections.map((s) => ({ ...s, suspended: true })) };
      }
      return m;
    }
    return makeMicro(e, slot, st!.next++);
  });
  return st.markets.map(({ ...m }) => { delete (m as Partial<MicroMarket & { weights: number[] }>).weights; return m; });
}

/* ---------- Casino rewards ---------- */

const hours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const MASKED = ['nik***', 'ele***', 'gio***', 'kat***', 'dim***', 'mar***', 'ath***', 'sot***', 'vas***', 'chr***'];
const rewards: Rewards = {
  level: 4, xp: 340, levelFrom: 250, levelTo: 500, nextReward: '20 free spins on a slot of your choice',
  missionsResetAt: hours(9),
  missions: [
    { id: 'ms-live', title: 'Play a Greek-dealer table', detail: 'Any live table with a Greek-speaking dealer.', progress: 1, target: 1, xp: 40, status: 'done' },
    { id: 'ms-new', title: 'Try 3 games you haven\u2019t played', detail: 'Any slots or table games new to you.', progress: 1, target: 3, xp: 60, status: 'active' },
    { id: 'ms-release', title: 'Explore a new release', detail: 'Open any game marked New.', progress: 0, target: 1, xp: 50, status: 'active' },
  ],
  tournaments: [
    {
      id: 'tr-race', title: 'Weekend Multiplier Race', rule: 'Ranked by your best single win as a multiple of your bet. A bigger bet doesn\u2019t give a better rank.',
      prize: '€2,000 in free spins · top 50 win', endsAt: hours(30), joined: false, gameIds: games.slice(0, 10).map((g) => g.id),
      leaderboard: [1240, 980, 860, 742, 655, 600, 512, 488, 430, 402].map((score, i) => ({ rank: i + 1, name: MASKED[i], score })),
    },
    {
      id: 'tr-sprint', title: 'Evening Sprint', rule: 'Ranked by your best single win as a multiple of your bet.',
      prize: '€500 in free spins · top 20 win', endsAt: hours(5), joined: true, gameIds: games.slice(10, 18).map((g) => g.id),
      leaderboard: [880, 702, 640, 515, 470, 433, 390, 344, 310, 296].map((score, i) => ({ rank: i + 1, name: MASKED[(i + 4) % 10], score })),
      me: { rank: 87, score: 64 },
    },
  ],
};
const playedGames = new Set<string>();

function recordPlay(gameId: string) {
  const g = games.find((x) => x.id === gameId);
  if (!g) return;
  const first = !playedGames.has(gameId);
  playedGames.add(gameId);
  const bump = (id: string) => {
    const m = rewards.missions.find((x) => x.id === id);
    if (m && m.status === 'active') { m.progress = Math.min(m.target, m.progress + 1); if (m.progress >= m.target) m.status = 'done'; }
  };
  if (first) bump('ms-new');
  if (g.isNew) bump('ms-release');
  for (const t of rewards.tournaments) {
    if (t.joined && t.gameIds.includes(gameId)) {
      const score = Math.round(20 + Math.random() * 120);
      if (!t.me || score > t.me.score) t.me = { rank: Math.max(11, (t.me?.rank ?? 160) - Math.round(score / 6)), score: Math.max(score, t.me?.score ?? 0) };
    }
  }
}

/** Auto cash-out rules run on the gateway. The mock checks them on every price push (see realtime.ts). */
export function runAutoCashOuts(): { betId: string; amount: number }[] {
  const done: { betId: string; amount: number }[] = [];
  for (const b of state.bets) {
    if (b.status !== 'open' || !b.autoCashOut) continue;
    const value = cashOutValue(b, currentOdds);
    if (value >= b.autoCashOut) {
      settleCashOut(b, value);
      done.push({ betId: b.id, amount: value });
    }
  }
  return done;
}

function settleCashOut(bet: Bet, amount: number) {
  bet.status = 'cashed_out';
  bet.cashedOut = Math.round(((bet.cashedOut ?? 0) + amount) * 100) / 100;
  state.balance.bettingAvailable = Math.round((state.balance.bettingAvailable + amount) * 100) / 100;
  state.balance.total = state.balance.bettingAvailable;
  state.balance.withdrawable = Math.round((state.balance.withdrawable + amount) * 100) / 100;
  addTx({ type: 'win', amount, status: 'completed', reference: `${bet.id} cash out` });
}
let txSeq = 10000;

function addTx(t: Omit<Transaction, 'id' | 'createdAt'>) {
  const tx: Transaction = { ...t, id: `tx-${txSeq++}`, createdAt: new Date().toISOString() };
  state.transactions.unshift(tx);
  return tx;
}

function depositedInPeriod(period: Limit['period']) {
  const span = { daily: 1, weekly: 7, monthly: 30 }[period] * 86_400_000;
  return state.transactions
    .filter((t) => t.type === 'deposit' && t.status === 'completed' && Date.now() - Date.parse(t.createdAt) < span)
    .reduce((s, t) => s + t.amount, 0);
}

export const mockApi: Api = {
  sportsbook: {
    getSports: () => delay(sports),
    getCompetitions: (sportId) =>
      delay(
        competitions
          .filter((c) => !sportId || c.sportId === sportId)
          .map((c) => ({ ...c, eventCount: events.filter((e) => e.competitionId === c.id && !e.live).length })),
      ),
    getEvents: ({ sportId, live, competitionId, competitionIds, marketName, from, to }) =>
      delay(
        events
          .filter((e) =>
            (!sportId || e.sportId === sportId) &&
            (live === undefined || !!e.live === live) &&
            (!competitionId || e.competitionId === competitionId) &&
            (!competitionIds?.length || competitionIds.includes(e.competitionId)) &&
            (!from || Date.parse(e.startTime) >= Date.parse(from)) &&
            (!to || Date.parse(e.startTime) <= Date.parse(to)),
          )
          .map(({ markets, form: _f, winProbability: _w, ...rest }) => {
            const m = marketName ? markets.find((x) => x.name === marketName) : undefined;
            return m ? { ...rest, mainMarket: m } : rest;
          })
          .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime)),
      ),
    getEvent: (id) => delay(events.find((e) => e.id === id)),
    placeBet: async (req) => {
      const total = req.stakes.reduce((s, x) => s + x.stake, 0);
      if (total > state.balance.bettingAvailable) throw new ApiError('INSUFFICIENT_FUNDS', 'Your balance is too low for this stake. Deposit or lower the stake.');
      const placed: Bet[] = req.stakes.map((s) => {
        const legs = s.selectionIds.map((id): SlipSelection => {
          const bb = builderLines.get(id);
          if (bb) return bb;
          const mk = microSelections.get(id);
          if (mk) {
            const open = [...micro.values()].some((st) => st.markets.some((m) => m.status === 'open' && m.selections.some((x) => x.id === id)));
            if (!open) throw new ApiError('MARKET_CLOSED', 'That fast market has closed. Remove it to place the rest.');
            return mk;
          }
          const f = findSelection(id);
          if (f) return toSlip(f);
          const v = virtualSelections.get(id);
          if (v) return { selectionId: id, ...v };
          throw new ApiError('SELECTION_UNAVAILABLE', 'One of your selections is no longer available.');
        });
        const totalOdds = Math.round(legs.reduce((p, l) => p * l.odds, 1) * 100) / 100;
        return {
          id: `BT-${betSeq++}`, placedAt: new Date().toISOString(), kind: legs.length > 1 ? 'combo' : 'single',
          stake: s.stake, totalOdds, potentialReturn: Math.round(s.stake * totalOdds * 100) / 100, status: 'open', legs,
        };
      });
      state.bets.unshift(...placed);
      state.balance.bettingAvailable = Math.round((state.balance.bettingAvailable - total) * 100) / 100;
      state.balance.total = state.balance.bettingAvailable;
      state.balance.withdrawable = Math.max(0, Math.round((state.balance.withdrawable - total) * 100) / 100);
      placed.forEach((b) => addTx({ type: 'bet', amount: -b.stake, status: 'completed', reference: b.id }));
      return delay({ bets: placed, newBalance: state.balance.bettingAvailable }, 700);
    },
    getBets: (status) =>
      delay(
        state.bets
          .filter((b) => (status === 'open' ? b.status === 'open' : b.status !== 'open'))
          .map((b) => (b.status === 'open' ? { ...b, legs: b.legs.map((l) => ({ ...l, oddsNow: currentOdds(l.selectionId, l.odds) })) } : b)),
      ),
    cashOut: async (betId, amount) => {
      const bet = state.bets.find((b) => b.id === betId);
      if (!bet || bet.status !== 'open') throw new ApiError('CASHOUT_UNAVAILABLE', 'Cash out is not available for this bet right now.');
      if (bet.legs.some((l) => l.fast)) throw new ApiError('CASHOUT_UNAVAILABLE', 'Fast-market bets can\u2019t be cashed out.');
      const value = cashOutValue(bet, currentOdds);
      if (amount === undefined || amount >= value - 0.01) {
        settleCashOut(bet, value);
        return delay({ amount: value }, 500);
      }
      if (amount < 0.5) throw new ApiError('CASHOUT_TOO_SMALL', 'The smallest partial cash-out is €0.50.');
      // Partial: the cashed-out share of the stake is closed, the rest keeps running at the same odds.
      const keep = 1 - amount / value;
      const remaining: Bet = { ...bet, stake: Math.round(bet.stake * keep * 100) / 100, potentialReturn: Math.round(bet.potentialReturn * keep * 100) / 100, cashedOut: Math.round(((bet.cashedOut ?? 0) + amount) * 100) / 100 };
      Object.assign(bet, remaining);
      if (bet.autoCashOut && bet.autoCashOut > bet.potentialReturn) bet.autoCashOut = undefined;
      state.balance.bettingAvailable = Math.round((state.balance.bettingAvailable + amount) * 100) / 100;
      state.balance.total = state.balance.bettingAvailable;
      state.balance.withdrawable = Math.round((state.balance.withdrawable + amount) * 100) / 100;
      addTx({ type: 'win', amount, status: 'completed', reference: `${bet.id} partial cash out` });
      return delay({ amount, remaining: { ...bet, legs: bet.legs.map((l) => ({ ...l, oddsNow: currentOdds(l.selectionId, l.odds) })) } }, 500);
    },
    setAutoCashOut: async (betId, target) => {
      const bet = state.bets.find((b) => b.id === betId);
      if (!bet || bet.status !== 'open') throw new ApiError('CASHOUT_UNAVAILABLE', 'This bet is no longer open.');
      if (target !== null && (target <= 0 || target >= bet.potentialReturn)) throw new ApiError('AUTO_TARGET', `Choose an amount below the full return of €${bet.potentialReturn.toFixed(2)}.`);
      bet.autoCashOut = target ?? undefined;
      return delay({ ...bet, legs: bet.legs.map((l) => ({ ...l, oddsNow: currentOdds(l.selectionId, l.odds) })) }, 300);
    },
    priceBetBuilder: async (eventId, ids) => delay(priceBuilder(eventId, ids), 250),
    getMicroMarkets: async (eventId) => {
      const e = events.find((x) => x.id === eventId);
      return delay(e ? microFor(e) : [], 120);
    },
    shareSlip: async (selections) => {
      const entries: CodeEntry[] = [];
      for (const s of selections) {
        if (s.builder) entries.push({ kind: 'builder', ids: s.builder.map((l) => l.selectionId) });
        else if (/^s\d+$/.test(s.selectionId)) entries.push({ kind: 'single', id: s.selectionId });
      }
      if (!entries.length) throw new ApiError('NOT_SHAREABLE', 'Fast-market selections close too quickly to share.');
      const code = encodeSlip(entries);
      return delay({ code, url: `${location.origin}${location.pathname}#/slip/${code}` }, 300);
    },
    loadSharedSlip: async (code) => {
      const entries = decodeSlip(code);
      if (!entries) throw new ApiError('BAD_CODE', 'That code doesn\u2019t look right. Codes start with EG.');
      const out: SlipSelection[] = [];
      let dropped = 0;
      for (const en of entries) {
        if (en.kind === 'single') {
          const f = findSelection(en.id);
          if (!f || f.s.suspended) dropped++;
          else out.push(toSlip(f));
        } else {
          try { out.push(priceBuilder(findSelection(en.ids[0])?.e.id ?? '', en.ids)); } catch { dropped++; }
        }
      }
      return delay({ selections: out, dropped }, 400);
    },
  },

  casino: {
    getGames: () => delay(games),
    getCollections: () => delay(collections),
    getProviders: () => delay(providers),
    getJackpots: () => delay(jackpots),
    getLiveTables: () => delay(liveTables),
    getFilterOptions: () => delay({ themes: THEMES, features: FEATURES, providers }),
    launchGame: (gameId, mode) => {
      if (mode === 'real') recordPlay(gameId);
      return delay({ url: `https://games.example-aggregator.com/launch?game=${gameId}&mode=${mode}` }, 600);
    },
    getRewards: () => delay(rewards),
    claimMission: async (id) => {
      const m = rewards.missions.find((x) => x.id === id);
      if (!m || m.status !== 'done') throw new ApiError('NOT_CLAIMABLE', 'This mission isn\u2019t complete yet.');
      m.status = 'claimed';
      rewards.xp += m.xp;
      while (rewards.xp >= rewards.levelTo) {
        rewards.level += 1;
        rewards.levelFrom = rewards.levelTo;
        rewards.levelTo += 300;
        rewards.nextReward = '10 free spins and a €5 casino bonus';
      }
      return delay(rewards, 400);
    },
    joinTournament: async (id) => {
      const t = rewards.tournaments.find((x) => x.id === id);
      if (!t) throw new ApiError('NOT_FOUND', 'This tournament has ended.');
      t.joined = true;
      return delay(rewards, 400);
    },
  },

  virtuals: {
    getLeagues: () => delay(virtualLeagues),
    getUpcoming: () => delay(makeVirtualEvents()),
  },

  auth: {
    activity: async () => { throw Object.assign(new Error('No demo session'), { status: 401 }); },
    getSession: async () => { throw Object.assign(new Error('No demo session'), { status: 401 }); },
    login: async (username, password) => {
      if (!username || password.length < 4) throw new ApiError('INVALID_CREDENTIALS', 'Check your username and password and try again.');
      return delay({ player: { ...state.player, username: username.includes('@') ? state.player.username : username } }, 600);
    },
    register: async (data) => {
      const age = (Date.now() - Date.parse(data.dateOfBirth)) / (365.25 * 86_400_000);
      if (age < 21) throw new ApiError('UNDERAGE', 'You must be 21 or older to open an account.');
      state.player = { ...state.player, email: data.email, firstName: data.firstName, lastName: data.lastName, dateOfBirth: data.dateOfBirth, phone: data.phone, kycStatus: 'required', username: data.email.split('@')[0] };
      return delay({ player: state.player }, 800);
    },
    logout: () => delay(undefined, 150),
  },

  account: {
    getPlayer: () => delay(state.player),
    updateContact: async (field, value) => {
      if (!value.trim()) throw new ApiError('VALIDATION', 'This field cannot be empty.');
      state.player = { ...state.player, [field]: value };
      return delay(state.player, 500);
    },
    getBalance: () => delay(state.balance, 150),
    getTransactions: ({ type }) => delay(state.transactions.filter((t) => !type || t.type === type)),
    getLimits: () => delay(state.limits),
    setLimit: async (kind, period, value) => {
      const current = state.limits.find((l) => l.kind === kind);
      const now = new Date();
      let next: Limit;
      if (current && value > current.value) {
        // Increases are delayed by a cooling-off period, decreases apply immediately.
        next = { ...current, pending: { value, effectiveAt: new Date(now.getTime() + 24 * 3_600_000).toISOString() } };
      } else {
        next = { kind, period, value, setAt: now.toISOString() };
      }
      state.limits = state.limits.filter((l) => l.kind !== kind).concat(next);
      return delay(next, 500);
    },
    takeBreak: (days) => delay({ until: new Date(Date.now() + days * 86_400_000).toISOString() }, 500),
    selfExclude: (months) => delay({ until: new Date(Date.now() + months * 30 * 86_400_000).toISOString() }, 500),
  },

  payments: {
    getDepositMethods: () => delay(paymentMethods),
    getWithdrawalMethods: () => delay(withdrawalMethods),
    deposit: async (methodId, amount): Promise<PaymentResult> => {
      const method = paymentMethods.find((m) => m.id === methodId);
      if (!method) throw new ApiError('METHOD_UNAVAILABLE', 'This payment method is not available.');
      if (amount < method.min || amount > method.max) throw new ApiError('AMOUNT_OUT_OF_RANGE', `Enter an amount between €${method.min} and €${method.max.toLocaleString('en-GB')}.`);
      const limit = state.limits.find((l) => l.kind === 'deposit');
      if (limit) {
        const used = depositedInPeriod(limit.period);
        if (used + amount > limit.value) {
          const left = Math.max(0, limit.value - used);
          throw new ApiError('DEPOSIT_LIMIT', `This deposit would go over your ${limit.period} deposit limit of €${limit.value}. You can deposit up to €${left.toFixed(2)} until it resets.`);
        }
      }
      state.balance.bettingAvailable += amount;
      state.balance.total = state.balance.bettingAvailable;
      state.balance.withdrawable += amount;
      const tx = addTx({ type: 'deposit', amount, method: method.savedInstrument ?? method.name, status: 'completed', reference: `DP-${Date.now()}` });
      return delay({ status: 'success', transactionId: tx.id, message: `€${amount.toFixed(2)} added to your balance.` }, 900);
    },
    withdraw: async (methodId, amount): Promise<PaymentResult> => {
      const method = withdrawalMethods.find((m) => m.id === methodId);
      if (!method) throw new ApiError('METHOD_UNAVAILABLE', 'This withdrawal method is not available.');
      if (state.player.kycStatus !== 'verified') throw new ApiError('KYC_REQUIRED', 'Verify your identity before your first withdrawal.');
      if (amount > state.balance.withdrawable) throw new ApiError('INSUFFICIENT_WITHDRAWABLE', `You can withdraw up to €${state.balance.withdrawable.toFixed(2)}. Bonus money can't be withdrawn.`);
      if (amount < method.min) throw new ApiError('AMOUNT_OUT_OF_RANGE', `The minimum withdrawal for this method is €${method.min}.`);
      state.balance.withdrawable -= amount;
      state.balance.bettingAvailable -= amount;
      state.balance.total = state.balance.bettingAvailable;
      const tx = addTx({ type: 'withdrawal', amount: -amount, method: method.savedInstrument ?? method.name, status: 'pending', reference: `WD-${Date.now()}` });
      return delay({ status: 'pending', transactionId: tx.id, message: `Withdrawal of €${amount.toFixed(2)} requested. ${method.speed}.` }, 900);
    },
    cancelWithdrawal: async (transactionId) => {
      const tx = state.transactions.find((t) => t.id === transactionId);
      if (!tx || tx.type !== 'withdrawal' || tx.status !== 'pending') throw new ApiError('NOT_CANCELLABLE', 'This withdrawal can no longer be cancelled.');
      tx.status = 'cancelled';
      state.balance.withdrawable += -tx.amount;
      state.balance.bettingAvailable += -tx.amount;
      state.balance.total = state.balance.bettingAvailable;
      return delay({ status: 'success' as const, transactionId, message: 'Withdrawal cancelled. The money is back in your balance.' }, 500);
    },
  },

  cms: {
    getStories: (vertical) => delay(stories.filter((g) => g.vertical === vertical || g.vertical === 'all'), 150),
    getPromos: (vertical) => delay(promos.filter((p) => !vertical || p.vertical === vertical || p.vertical === 'all')),
  },
};

export { ApiError };
