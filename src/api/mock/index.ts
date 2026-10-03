// In-memory mock of the API gateway. Adds a small delay to every call so loading states are visible.
import type { Api } from '../services';
import type { Bet, Limit, PaymentResult, Transaction } from '../types';
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
        const legs = s.selectionIds.map((id) => {
          for (const e of events) for (const m of e.markets) {
            const found = m.selections.find((x) => x.id === id);
            if (found) return { selectionId: id, eventId: e.id, eventName: `${e.home} – ${e.away}`, marketName: m.name, label: found.label, odds: found.odds, live: !!e.live };
          }
          const v = virtualSelections.get(id);
          if (v) return { selectionId: id, ...v };
          throw new ApiError('SELECTION_UNAVAILABLE', 'One of your selections is no longer available.');
        });
        const totalOdds = Math.round(legs.reduce((p, l) => p * l.odds, 1) * 100) / 100;
        return {
          id: `BT-${betSeq++}`, placedAt: new Date().toISOString(), kind: legs.length > 1 ? 'combo' : 'single',
          stake: s.stake, totalOdds, potentialReturn: Math.round(s.stake * totalOdds * 100) / 100, status: 'open', legs,
          cashOutValue: Math.round(s.stake * 0.9 * 100) / 100,
        };
      });
      state.bets.unshift(...placed);
      state.balance.bettingAvailable = Math.round((state.balance.bettingAvailable - total) * 100) / 100;
      state.balance.total = state.balance.bettingAvailable;
      state.balance.withdrawable = Math.max(0, Math.round((state.balance.withdrawable - total) * 100) / 100);
      placed.forEach((b) => addTx({ type: 'bet', amount: -b.stake, status: 'completed', reference: b.id }));
      return delay({ bets: placed, newBalance: state.balance.bettingAvailable }, 700);
    },
    getBets: (status) => delay(state.bets.filter((b) => (status === 'open' ? b.status === 'open' : b.status !== 'open'))),
    cashOut: async (betId) => {
      const bet = state.bets.find((b) => b.id === betId);
      if (!bet || bet.status !== 'open' || !bet.cashOutValue) throw new ApiError('CASHOUT_UNAVAILABLE', 'Cash out is not available for this bet right now.');
      bet.status = 'cashed_out';
      state.balance.bettingAvailable += bet.cashOutValue;
      state.balance.total = state.balance.bettingAvailable;
      state.balance.withdrawable += bet.cashOutValue;
      addTx({ type: 'win', amount: bet.cashOutValue, status: 'completed', reference: `${bet.id} cash out` });
      return delay({ amount: bet.cashOutValue }, 500);
    },
  },

  casino: {
    getGames: () => delay(games),
    getCollections: () => delay(collections),
    getProviders: () => delay(providers),
    getJackpots: () => delay(jackpots),
    getLiveTables: () => delay(liveTables),
    getFilterOptions: () => delay({ themes: THEMES, features: FEATURES, providers }),
    launchGame: (gameId, mode) => delay({ url: `https://games.example-aggregator.com/launch?game=${gameId}&mode=${mode}` }, 600),
  },

  virtuals: {
    getLeagues: () => delay(virtualLeagues),
    getUpcoming: () => delay(makeVirtualEvents()),
  },

  auth: {
    login: async (username, password) => {
      if (!username || password.length < 4) throw new ApiError('INVALID_CREDENTIALS', 'Check your username and password and try again.');
      return delay({ token: 'demo-token', player: { ...state.player, username: username.includes('@') ? state.player.username : username } }, 600);
    },
    register: async (data) => {
      const age = (Date.now() - Date.parse(data.dateOfBirth)) / (365.25 * 86_400_000);
      if (age < 21) throw new ApiError('UNDERAGE', 'You must be 21 or older to open an account.');
      state.player = { ...state.player, email: data.email, firstName: data.firstName, lastName: data.lastName, dateOfBirth: data.dateOfBirth, phone: data.phone, kycStatus: 'required', username: data.email.split('@')[0] };
      return delay({ token: 'demo-token', player: state.player }, 800);
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
