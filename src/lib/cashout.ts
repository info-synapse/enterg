import type { Bet } from '@/api/types';

/** Cash-out margin kept by the operator. In production the trading platform sends the value; this mirrors it. */
const MARGIN = 0.95;

/**
 * Current cash-out value of an open bet: stake × odds when placed ÷ odds now, less the margin.
 * `current` returns the latest odds for a selection id (live push), or the placed odds if unknown.
 */
export function cashOutValue(bet: Bet, current: (selectionId: string, fallback: number) => number) {
  const now = bet.legs.reduce((p, l) => p * current(l.selectionId, l.oddsNow ?? l.odds), 1);
  const value = (bet.stake * bet.totalOdds) / now * MARGIN;
  return Math.round(Math.min(value, bet.potentialReturn * 0.98) * 100) / 100;
}
