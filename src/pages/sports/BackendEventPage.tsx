import type { Market } from '@/api/types';
import { Link, useSearchParams } from 'react-router-dom';
import { loadMarkets } from '@/lib/backendMarkets';
import { useAsync } from '@/lib/useAsync';
import { getBackendEvents } from '@/lib/backendEvents';
import { SportsFrame } from './SportsFrame';
import { OddsButton } from '@/components/OddsButton';

function marketHeading(market: Market) {
  const parameters = [...new Set(market.selections.map(s => s.parameter)
    .filter((p): p is number => typeof p === 'number' && Number.isFinite(p) && p !== 0))];
  return parameters.length ? `${market.name} ${parameters[0]}` : market.name;
}
export function BackendEventPage({ eventId }: { eventId: string }) {
  const [params] = useSearchParams();
  const sportId = params.get('sportId') ?? '';
  const info = useAsync(async () => sportId ? (await getBackendEvents({ sportId })).find(e => e.id === eventId) : undefined, [sportId, eventId]);
  const result = useAsync(() => loadMarkets(eventId), [eventId]);
  const event = info.data;
  const name = event ? `${event.home} – ${event.away}` : `Event ${eventId.replace('backend:event:', '')}`;
  return <SportsFrame>
    <Link to={sportId ? `/sport/${sportId}/coupon` : '/backend-sports'}>Back to matches</Link>
    <h1 className="page-title">{name}</h1>
    {event && <p>{event.competitionName} · {new Date(event.startTime).toLocaleString()}</p>}
    <p className="hint">Temporary local betslip only. Prices are a snapshot; real betting is not connected.</p>
    <button className="btn btn-ghost" disabled={result.loading} onClick={result.reload}>Refresh markets</button>
    {info.error && <p role="alert">Could not verify match availability. <button onClick={info.reload}>Retry</button></p>}
    {!event && !info.loading && !info.error && <p className="hint">Match is not in the active event list. Adding selections is unavailable.</p>}
    <div className="tabs" role="tablist"><button role="tab" aria-selected="true">All markets</button></div>
    {result.error ? <p role="alert">Could not load markets. <button onClick={result.reload}>Retry</button></p> : result.loading ? <div className="skeleton" style={{ height: 240 }} /> : <>
      {result.data?.markets.map(m => <section className="market backend-market" key={m.id}>
        <h2 className="market-head">{marketHeading(m)}</h2>
        <div className={`market-body ${m.selections.length === 2 ? 'cols-2' : m.selections.length === 3 ? 'cols-3' : ''}`}>
          {m.selections.map(s => s.odds <= 0 ? <span key={s.id} className="odd"><span className="lbl">{s.label}</span></span> :
            <div key={s.id} style={s.suspended ? { color: 'var(--danger, #d33)' } : undefined}><OddsButton selection={{ ...s, suspended: s.suspended || !event || !!info.error }} eventId={eventId} eventName={name} marketName={m.name} wide /></div>)}
        </div>
      </section>)}
      {!result.data?.markets.length && <p className="empty">No markets available.</p>}
    </>}
  </SportsFrame>;
}
