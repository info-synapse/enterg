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
  const scoped = query.backendTournamentIds ?? (query.competitionId ? [query.competitionId] : undefined);
  if (scoped && !scoped.length) return [];
  const tournamentIds = scoped?.map(id => {
    const value = id.match(/^backend-(\d+)$/)?.[1];
    if (!value || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) throw new Error('Invalid backend competition.');
    return value;
  });
  const tournlist = tournamentIds ? [...new Set(tournamentIds)].sort().join(',') : undefined;
  const timezone = -new Date().getTimezoneOffset() / 60;
  const key = `${sport}:CY:${timezone}:${tournlist ?? 'all'}`;
  const started = performance.now();
  const source = cache.has(key) && cache.get(key)!.expires > started ? 'browser-memory' : pending.has(key) ? 'shared-request' : 'gateway';
  try {
  let items = cache.get(key);
  if (!items || items.expires <= performance.now()) {
    let request = pending.get(key);
    if (!request) {
      request = (async () => {
        const controller = new AbortController(), timer = window.setTimeout(() => controller.abort(), 35000);
        try {
          const base = import.meta.env.VITE_API_BASE_URL ?? '/api';
          const res = await fetch(`${base}/sports/events?sportId=${sport}&timezone=${timezone}${tournlist ? '&tournlist=' + encodeURIComponent(tournlist) : ''}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
          if (!res.ok) throw new Error('Could not load matches.');
          const headersMs = Math.round(performance.now() - started);
          const data = await res.json();
          console.info('[sports timing]', { event: 'events_http', sportId: Number(sport), scope: tournlist ? 'tournaments' : 'all', headersMs, bodyAndParseMs: Math.round(performance.now() - started) - headersMs, recordCount: data.items?.length });
          if (!Array.isArray(data.items)) throw new Error('Invalid match list.');
          if (!tournlist) cache.set(key, { items: data.items, expires: performance.now() + 1800000 });
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
  } catch (error) {
    console.info('[sports timing]', { event: 'events_error', sportId: Number(sport), scope: tournlist ? 'tournaments' : 'all', source });
    throw error;
  } finally {
    console.info('[sports timing]', { event: 'events_load', sportId: Number(sport), scope: tournlist ? 'tournaments' : 'all', source, durationMs: Math.round(performance.now() - started) });
  }
}
