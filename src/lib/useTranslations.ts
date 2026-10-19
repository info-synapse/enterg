import { useEffect, useState } from 'react';
import { api } from '@/api';
import { HTTP_AUTH_MODE } from '@/api/mode';

type Labels = Record<string, string>;
const language = 'CY'; // Backend code for English; not a browser locale.
let cache: Labels | undefined;
let expires = 0;
let pending: Promise<Labels> | undefined;
function load(): Promise<Labels> {
  const started = performance.now();
  const timing = (source: string, status: string, labels?: Labels) => console.info('[translations]', {
    language, source, status, durationMs: Number((performance.now() - started).toFixed(2)),
    ...(labels ? { labelCount: Object.keys(labels).length } : {}),
  });
  if (cache && Date.now() < expires) { timing('browser-cache', 'ok', cache); return Promise.resolve(cache); }
  if (pending) return pending.then(labels => { timing('shared-request', 'ok', labels); return labels; }, error => { timing('shared-request', 'error'); throw error; });
  const source = HTTP_AUTH_MODE ? 'gateway-http' : 'demo';
  pending = api.translations.getLabels(language).then(result => {
    if (result.language !== language || !result.labels || typeof result.labels !== 'object' || Array.isArray(result.labels) || Object.values(result.labels).some(value => typeof value !== 'string')) throw new Error('Invalid translation dictionary');
    cache = result.labels; expires = Date.now() + 300000;
    timing(source, 'ok', cache);
    return cache;
  }).catch(error => { timing(source, 'error'); throw error; }).finally(() => { pending = undefined; });
  return pending;
}
export function useTranslations() {
  const [labels, setLabels] = useState<Labels>(cache ?? {});
  useEffect(() => {
    let active = true;
    // All mounted consumers share the same request, including StrictMode replay.
    load().then(result => { if (active) setLabels(result); }).catch(() => { /* Keep readable fallback labels. */ });
    return () => { active = false; };
  }, []);
  return { t: (key: string, fallback: string) => Object.prototype.hasOwnProperty.call(labels, key) && labels[key]?.trim() ? labels[key] : fallback };
}
