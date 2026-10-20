import type { Market } from '@/api/types';
const pending = new Map<string, Promise<{ markets: Market[] }>>();
export function loadMarkets(eventId: string) {
  let request = pending.get(eventId);
  if (!request) {
    request = (async () => {
      const controller = new AbortController(), timer = window.setTimeout(() => controller.abort(), 35000);
      try {
        const id = eventId.replace('backend:event:', '');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? '/api'}/sports/event-markets?eventId=${encodeURIComponent(id)}`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Could not load markets.');
        return await response.json() as { markets: Market[] };
      } finally { window.clearTimeout(timer); }
    })().finally(() => pending.delete(eventId));
    pending.set(eventId, request);
  }
  return request;
}
