// Keeps the latest pushed odds, clocks and table results so every component shows the same live values.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { realtime, type RealtimeMessage } from '@/api/realtime';
import type { LiveState, Selection } from '@/api/types';
import { toast } from '@/components/Toast';

interface LiveStore {
  odds: Map<string, { odds: number; trend: -1 | 1; at: number }>;
  clocks: Map<string, { minute: number; score: [number, number]; lastAction?: string }>;
  tables: Map<string, { results: number[] }>;
  jackpots: Map<string, number>;
  cashouts: { betId: string; amount: number }[];
}

const Ctx = createContext<{ store: LiveStore; version: number } | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const [store] = useState<LiveStore>(() => ({ odds: new Map(), clocks: new Map(), tables: new Map(), jackpots: new Map(), cashouts: [] }));
  const [version, setVersion] = useState(0);
  useEffect(
    () =>
      realtime.subscribe((m: RealtimeMessage) => {
        if (m.topic === 'odds') store.odds.set(m.selectionId, { odds: m.odds, trend: m.trend, at: Date.now() });
        if (m.topic === 'clock') store.clocks.set(m.eventId, { minute: m.minute, score: m.score, lastAction: m.lastAction });
        if (m.topic === 'table' && m.result !== undefined) {
          const prev = store.tables.get(m.tableId)?.results ?? [];
          store.tables.set(m.tableId, { results: [m.result, ...prev].slice(0, 5) });
        }
        if (m.topic === 'jackpot') store.jackpots.set(`${m.jackpotId}:${m.tier}`, m.amount);
        if (m.topic === 'cashout') {
          store.cashouts.push({ betId: m.betId, amount: m.amount });
          toast(`Auto cash-out: €${m.amount.toFixed(2)} from ${m.betId} is in your balance.`);
        }
        setVersion((v) => v + 1);
      }),
    [store],
  );
  return <Ctx.Provider value={{ store, version }}>{children}</Ctx.Provider>;
}

function useLive() {
  const c = useContext(Ctx);
  if (!c) throw new Error('LiveProvider missing');
  return c;
}

/** Current odds for a selection, with a trend flag for ~2.5s after a change. */
export function useLiveSelection(s: Selection) {
  const { store } = useLive();
  const u = store.odds.get(s.id);
  const recent = u && Date.now() - u.at < 2500;
  return { odds: u?.odds ?? s.odds, trend: recent ? u!.trend : 0 };
}

export function useLiveClock(eventId: string, base?: LiveState) {
  const { store } = useLive();
  const u = store.clocks.get(eventId);
  if (!base) return undefined;
  return { ...base, ...(u ?? {}) } as LiveState;
}

export function useLiveTable(tableId: string, base?: number[]) {
  const { store } = useLive();
  return store.tables.get(tableId)?.results ?? base;
}

export function useLiveJackpot(key: string, base: number) {
  const { store } = useLive();
  return store.jackpots.get(key) ?? base;
}

/** Bets the gateway cashed out automatically during this visit (My bets refreshes on change). */
export function useAutoCashOuts() {
  const { store } = useLive();
  return store.cashouts;
}

/** Latest odds for any selection id (used by the bet slip). */
export function useOddsLookup() {
  const { store } = useLive();
  return (id: string, fallback: number) => store.odds.get(id)?.odds ?? fallback;
}
