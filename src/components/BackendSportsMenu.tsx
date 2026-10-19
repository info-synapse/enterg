import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '@/api';
import { HTTP_AUTH_MODE } from '@/api/mode';
import type { LeftMenuSport } from '@/api/types';
import { Icon } from './Icon';

let pending: Promise<LeftMenuSport[]> | undefined;
function loadSports() {
  if (!pending) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 35000);
    pending = api.referenceData.getLeftMenuSports(controller.signal).then(data => {
      if (data.language !== 'CY' || !Array.isArray(data.items) || data.items.some(row => !Number.isSafeInteger(row.ET_ID) || typeof row.ET_NAME !== 'string' || typeof row.ET_FILENAME !== 'string')) throw new Error('Invalid sports menu');
      return data.items;
    }).finally(() => { window.clearTimeout(timer); pending = undefined; });
  }
  return pending;
}
function SportImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  let safe = false;
  try { safe = ['https:', 'http:'].includes(new URL(url).protocol); } catch { /* fallback */ }
  return safe && !failed ? <img src={url} alt="" width={18} height={18} loading="lazy" referrerPolicy="no-referrer" style={{ objectFit: 'contain', flexShrink: 0 }} onError={() => setFailed(true)} /> : <Icon name="sports" size={18} />;
}
export function BackendSportsMenu() {
  const [items, setItems] = useState<LeftMenuSport[]>([]);
  const [loading, setLoading] = useState(HTTP_AUTH_MODE), [error, setError] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!HTTP_AUTH_MODE) return;
    let active = true;
    setLoading(true); setError(false);
    loadSports().then(rows => { if (active) setItems(rows); }).catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return <section aria-label="Sports from backend">
    <h3>Sports</h3>
    {!HTTP_AUTH_MODE ? <p className="hint">Available in HTTP or mixed mode.</p> : loading ? <p className="hint" role="status">Loading sports…</p> : error ? <div role="alert"><p className="hint">Could not load sports.</p><button className="btn btn-ghost" onClick={() => setAttempt(n => n + 1)}>Retry</button></div> : items.length === 0 ? <p className="hint">No sports available.</p> :
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{items.map(sport => <li key={sport.ET_ID} data-sport-id={sport.ET_ID} ><NavLink to={`/sport/backend-${sport.ET_ID}`}><SportImage url={sport.ET_FILENAME} /><span>{sport.ET_NAME}</span></NavLink></li>)}</ul>}
  </section>;
}
