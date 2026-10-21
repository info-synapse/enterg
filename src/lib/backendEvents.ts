import type { SportEvent } from '@/api/types';
import type { EventQuery } from '@/api/services';

const cache = new Map<string, { items: SportEvent[]; expires: number }>();
const pending = new Map<string, Promise<SportEvent[]>>();
export function clearBackendEventCache() { cache.clear(); }
export function filterBackendEvents(items: SportEvent[], query: EventQuery) {
  if (query.live) return [];
  return items.filter(e => (!query.competitionId || e.competitionId === query.competitionId)
    && (!query.competitionIds?.length || query.competitionIds.includes(e.competitionId))
    && (!query.from || Date.parse(e.startTime) >= Date.parse(query.from))
    && (!query.to || Date.parse(e.startTime) < Date.parse(query.to)));
}
export async function getBackendEvents(query: EventQuery): Promise<SportEvent[]> {
  if (query.live) return []; // This contract supplies active pregame events only.
  const sport = query.sportId?.match(/^backend-(\d+)$/)?.[1];
  if (!sport) throw new Error('A backend sport is required.');
  const timezone = -new Date().getTimezoneOffset() / 60;
  const key = `${sport}:CY:${timezone}`;
  let items = cache.get(key);
  if (!items || items.expires <= performance.now()) {
    let request = pending.get(key);
    if (!request) {
      request = (async () => {
        const controller = new AbortController(), timer = window.setTimeout(() => controller.abort(), 35000);
        try {
          const base = import.meta.env.VITE_API_BASE_URL ?? '/api';
          const res = await fetch(`${base}/sports/events?sportId=${sport}&timezone=${timezone}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
          if (!res.ok) throw new Error('Could not load matches.');
          const data = await res.json();
          if (!Array.isArray(data.items)) throw new Error('Invalid match list.');
          cache.set(key, { items: data.items, expires: performance.now() + 1800000 });
          // Bound retained browser memory when switching between many sports.
          if (cache.size > 4) cache.delete(cache.keys().next().value!);
          return data.items as SportEvent[];
        } finally { window.clearTimeout(timer); }
      })().finally(() => pending.delete(key));
      pending.set(key, request);
    }
    return filterBackendEvents(await request, query);
  }
  return filterBackendEvents(items.items, query);
}
