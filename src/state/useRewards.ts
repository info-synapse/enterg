// Shared cache of the player's casino rewards (missions, level, tournaments) so the lobby card,
// game tiles, game page and Rewards hub all show the same numbers.
import { useEffect, useState } from 'react';
import { api } from '@/api';
import type { Rewards } from '@/api/types';

let cache: Rewards | null = null;
let inflight: Promise<Rewards> | null = null;
const listeners = new Set<(r: Rewards) => void>();

export function setRewards(r: Rewards) {
  cache = r;
  listeners.forEach((l) => l(r));
}

export function refreshRewards() {
  inflight = api.casino.getRewards().then((r) => { inflight = null; setRewards(r); return r; });
  return inflight;
}

export function useRewards() {
  const [r, setR] = useState<Rewards | null>(cache);
  useEffect(() => {
    listeners.add(setR);
    if (!cache && !inflight) refreshRewards();
    return () => void listeners.delete(setR);
  }, []);
  return r;
}

/** "1d 6h", "4h 59m", "12m" */
export function timeLeft(iso: string) {
  const ms = Math.max(0, Date.parse(iso) - Date.now());
  const m = Math.floor(ms / 60_000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m % 60}m` : `${m}m`;
}
