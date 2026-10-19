import { api } from '@/api';
import type { MainGameForecastDataset } from '@/api/types';

const fields = ['EVT_TYPE', 'MGAME_ID', 'FC_IDX', 'CD_1', 'CD_X', 'CD_2', 'CD_1X', 'CD_12', 'CD_X2', 'CD_U', 'CD_O'] as const;
let cache: MainGameForecastDataset | undefined, expires = 0;
let pending: Promise<MainGameForecastDataset> | undefined;

/** Loads the complete dataset. No sport/selection lookup or betting logic here. */
export function loadMainGameForecasts(): Promise<MainGameForecastDataset> {
  if (cache && performance.now() < expires) {
    console.info('[main-game-forecasts]', { source: 'browser-cache', recordCount: cache.items.length });
    return Promise.resolve(cache);
  }
  if (pending) return pending;
  const started = performance.now();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 45000);
  pending = api.referenceData.getMainGameForecasts(controller.signal).then(data => {
    if (!data || !/^[a-f0-9]{64}$/.test(data.version) || !Number.isFinite(Date.parse(data.loadedAt)) ||
      !Number.isFinite(data.cacheForMs) || data.cacheForMs < 0 || data.cacheForMs > 86400000 ||
      !Array.isArray(data.items) || !data.items.length || data.items.length > 10000) throw new Error('Invalid main forecast dataset');
    const seen = new Set<string>();
    const items = data.items.map(row => {
      if (!row || fields.some(key => !Number.isSafeInteger(row[key]) || row[key] < 0)) throw new Error('Invalid main forecast record');
      const key = `${row.EVT_TYPE}:${row.MGAME_ID}:${row.FC_IDX}`;
      if (seen.has(key)) throw new Error('Duplicate main forecast record');
      seen.add(key);
      return Object.freeze(Object.fromEntries(fields.map(field => [field, row[field]]))) as typeof row;
    });
    cache = Object.freeze({ version: data.version, loadedAt: data.loadedAt, cacheForMs: data.cacheForMs, items: Object.freeze(items) });
    // Subtract request time conservatively; do not extend the server's freshness window.
    expires = started + data.cacheForMs;
    console.info('[main-game-forecasts]', { source: 'gateway-http', status: 'ok', durationMs: Math.round(performance.now() - started), recordCount: items.length });
    return cache;
  }).catch(error => {
    console.warn('[main-game-forecasts]', { status: 'error', durationMs: Math.round(performance.now() - started) });
    throw error;
  }).finally(() => { window.clearTimeout(timer); pending = undefined; });
  return pending;
}
