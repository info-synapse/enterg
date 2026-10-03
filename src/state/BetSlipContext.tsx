import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/api';
import type { Bet, SlipSelection } from '@/api/types';
import { useAuth } from './AuthContext';
import { useOddsLookup } from './LiveContext';

export const MAX_SELECTIONS = 20;

interface SlipValue {
  selections: SlipSelection[];
  has: (selectionId: string) => boolean;
  toggle: (s: SlipSelection) => void;
  remove: (selectionId: string) => void;
  clear: () => void;
  mode: 'single' | 'combo';
  setMode: (m: 'single' | 'combo') => void;
  stakes: Record<string, number>; // per selection (singles) or "combo"
  setStake: (key: string, v: number) => void;
  liveOdds: (s: SlipSelection) => number;
  totalStake: number;
  totalOdds: number;
  potentialReturn: number;
  conflict: boolean; // two selections from the same event in a combo
  place: () => Promise<void>;
  placing: boolean;
  error?: string;
  receipt: Bet[] | null;
  dismissReceipt: () => void;
  sheetOpen: boolean;
  setSheetOpen: (o: boolean) => void;
  notice?: string;
}

const Ctx = createContext<SlipValue | null>(null);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const { player, openAuth, refreshBalance } = useAuth();
  const lookup = useOddsLookup();
  const [selections, setSelections] = useState<SlipSelection[]>([]);
  const [modeState, setMode] = useState<'single' | 'combo'>('combo');
  const [stakes, setStakes] = useState<Record<string, number>>({ combo: 5 });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string>();
  const [receipt, setReceipt] = useState<Bet[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState<string>();

  const mode = selections.length < 2 ? 'single' : modeState;
  const has = useCallback((id: string) => selections.some((s) => s.selectionId === id), [selections]);

  const toggle = useCallback((s: SlipSelection) => {
    setReceipt(null);
    setError(undefined);
    setSelections((prev) => {
      if (prev.some((p) => p.selectionId === s.selectionId)) return prev.filter((p) => p.selectionId !== s.selectionId);
      if (prev.length >= MAX_SELECTIONS) {
        setNotice(`You can add up to ${MAX_SELECTIONS} selections.`);
        return prev;
      }
      setStakes((st) => (st[s.selectionId] ? st : { ...st, [s.selectionId]: 5 }));
      return [...prev, s];
    });
  }, []);

  const liveOdds = useCallback((s: SlipSelection) => lookup(s.selectionId, s.odds), [lookup]);
  const conflict = useMemo(() => new Set(selections.map((s) => s.eventId)).size !== selections.length, [selections]);
  const totalOdds = useMemo(() => Math.round(selections.reduce((p, s) => p * liveOdds(s), 1) * 100) / 100, [selections, liveOdds]);
  const totalStake = mode === 'combo' ? stakes.combo || 0 : selections.reduce((sum, s) => sum + (stakes[s.selectionId] || 0), 0);
  const potentialReturn =
    mode === 'combo'
      ? (stakes.combo || 0) * totalOdds
      : selections.reduce((sum, s) => sum + (stakes[s.selectionId] || 0) * liveOdds(s), 0);

  const place = useCallback(async () => {
    if (!player) {
      openAuth('login');
      return;
    }
    if (mode === 'combo' && conflict) {
      setError('Two selections come from the same match. Remove one or switch to singles.');
      return;
    }
    setPlacing(true);
    setError(undefined);
    try {
      const req =
        mode === 'combo'
          ? [{ selectionIds: selections.map((s) => s.selectionId), stake: stakes.combo || 0 }]
          : selections.map((s) => ({ selectionIds: [s.selectionId], stake: stakes[s.selectionId] || 0 }));
      if (req.some((r) => r.stake <= 0)) throw new Error('Enter a stake for every bet.');
      const { bets } = await api.sportsbook.placeBet({ kind: mode, stakes: req, acceptOddsChanges: true });
      setReceipt(bets);
      setSelections([]);
      await refreshBalance();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPlacing(false);
    }
  }, [player, openAuth, mode, conflict, selections, stakes, refreshBalance]);

  const value: SlipValue = {
    selections,
    has,
    toggle,
    remove: (id) => setSelections((p) => p.filter((s) => s.selectionId !== id)),
    clear: () => setSelections([]),
    mode,
    setMode,
    stakes,
    setStake: (k, v) => setStakes((s) => ({ ...s, [k]: Math.max(0, Math.round(v * 100) / 100) })),
    liveOdds,
    totalStake,
    totalOdds,
    potentialReturn: Math.round(potentialReturn * 100) / 100,
    conflict,
    place,
    placing,
    error,
    receipt,
    dismissReceipt: () => setReceipt(null),
    sheetOpen,
    setSheetOpen,
    notice,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBetSlip() {
  const c = useContext(Ctx);
  if (!c) throw new Error('BetSlipProvider missing');
  return c;
}
