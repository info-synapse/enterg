// Live updates (odds, match clock, live tables, jackpots).
// In production this is a WebSocket to the gateway; here a timer fakes the same push messages.
import { events, liveTables, jackpots } from './mock/data';

export type RealtimeMessage =
  | { topic: 'odds'; selectionId: string; odds: number; trend: -1 | 1; suspended?: boolean }
  | { topic: 'clock'; eventId: string; minute: number; score: [number, number]; lastAction?: string }
  | { topic: 'table'; tableId: string; result?: number; players: number }
  | { topic: 'jackpot'; jackpotId: string; tier: string; amount: number };

type Listener = (msg: RealtimeMessage) => void;
const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  const live = events.filter((e) => e.live);
  // a few odds moves per tick
  for (let i = 0; i < 3; i++) {
    const e = live[Math.floor(Math.random() * live.length)];
    if (!e) break;
    const m = e.markets[Math.floor(Math.random() * Math.min(3, e.markets.length))];
    const s = m.selections[Math.floor(Math.random() * m.selections.length)];
    const dir = Math.random() < 0.5 ? -1 : 1;
    s.odds = Math.max(1.01, Math.round((s.odds * (1 + dir * (0.02 + Math.random() * 0.05))) * 100) / 100);
    emit({ topic: 'odds', selectionId: s.id, odds: s.odds, trend: dir as -1 | 1 });
  }
  // clocks move every few ticks
  if (Math.random() < 0.35) {
    for (const e of live) {
      if (!e.live) continue;
      e.live.minute = Math.min(90, e.live.minute + 1);
      if (Math.random() < 0.04) {
        const side = Math.random() < 0.55 ? 0 : 1;
        e.live.score[side] += 1;
        e.live.lastAction = `Goal · ${side === 0 ? e.home : e.away}`;
      }
      emit({ topic: 'clock', eventId: e.id, minute: e.live.minute, score: [...e.live.score] as [number, number], lastAction: e.live.lastAction });
    }
  }
  // live tables
  const t = liveTables[Math.floor(Math.random() * liveTables.length)];
  if (t.results && Math.random() < 0.5) {
    const n = Math.floor(Math.random() * 37);
    t.results = [n, ...t.results].slice(0, 5);
    emit({ topic: 'table', tableId: t.id, result: n, players: t.players });
  }
  // jackpots creep up
  for (const j of jackpots) {
    const tier = j.tiers[0];
    tier.amount = Math.round((tier.amount + Math.random() * 3) * 100) / 100;
    emit({ topic: 'jackpot', jackpotId: j.id, tier: tier.name, amount: tier.amount });
  }
}

function emit(msg: RealtimeMessage) {
  listeners.forEach((l) => l(msg));
}

export const realtime = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    if (!timer) timer = setInterval(tick, 1600);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  },
};
