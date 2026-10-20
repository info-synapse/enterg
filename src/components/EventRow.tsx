import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CatalogIcon } from './CatalogIcon';
import { BackendMainOdds } from './BackendMainOdds';
import type { SportEvent } from '@/api/types';
import { kickoff } from '@/lib/format';
import { dayLabel } from '@/lib/markets';
import { useLiveClock } from '@/state/LiveContext';
import { OddsButton } from './OddsButton';
import { Icon } from './Icon';
import { Flag, regionOf } from './Flag';

export function EventRow({ event, showCompetition }: { event: SportEvent; showCompetition?: boolean }) {
  const live = useLiveClock(event.id, event.live);
  const nav = useNavigate();
  const name = `${event.home} – ${event.away}`;
  if (event.readOnly) return (
    <div className="event-row">
      <Link className="event-main" to={`/event/${event.id}?sportId=${event.sportId}`}>
        <div className="event-time num">{kickoff(event.startTime)}</div>
        <div className="teams"><div className="team">{event.home}</div><div className="team">{event.away}</div>
          {showCompetition && <div className="event-meta"><CatalogIcon url={event.competitionIcon} region={event.competitionRegion} imageWidth={42} imageHeight={14} />{event.competitionName}</div>}
        </div>
      </Link>
      <div className="event-odds">
        {event.mainMarket.selections.map(s => <BackendMainOdds key={s.id} event={event} selection={s} />)}
        <Link className="more-markets num" aria-label="Show event markets" to={`/event/${event.id}?sportId=${event.sportId}`}>+{event.marketCount}</Link>
      </div>
    </div>
  );
  return (
    <div className="event-row">
      <Link to={`/event/${event.id}`} className="event-main">
        <div className="event-time num">
          {live ? (
            <>
              <span className="live-badge">{live.minute}′</span>
              <span>{live.period}</span>
            </>
          ) : (
            (() => { const k = kickoff(event.startTime).replace(',', ''); const i = k.lastIndexOf(' '); return <><div>{k.slice(0, i)}</div><div>{k.slice(i + 1)}</div></>; })()
          )}
        </div>
        <div className="teams">
          <div className="team"><span>{event.home}</span>{live && <span className="score num">{live.score[0]}</span>}</div>
          <div className="team"><span>{event.away}</span>{live && <span className="score num">{live.score[1]}</span>}</div>
          <div className="event-meta">
            {showCompetition && <span>{event.competitionName}</span>}
            {event.badges?.includes('boost') && <span className="tag accent">Boost</span>}
            {event.badges?.includes('betbuilder') && (
              // Opens the match straight on its Bet Builder tab.
              <span className="tag bb-tag" onClick={(e) => { e.preventDefault(); nav(`/event/${event.id}?tab=builder`); }}>Bet Builder</span>
            )}
            {event.badges?.includes('stream') && <span className="tag live">Stream</span>}
          </div>
        </div>
      </Link>
      <div className="event-odds" style={{ gridAutoColumns: event.mainMarket.selections.length > 3 ? '56px' : undefined }}>
        {event.mainMarket.selections.slice(0, 3).map((s) => (
          <OddsButton key={s.id} selection={s} eventId={event.id} eventName={name} marketName={event.mainMarket.name} live={!!event.live} />
        ))}
        <Link to={`/event/${event.id}`} className="more-markets num" aria-label={`${event.marketCount} more markets`}>
          +{event.marketCount}
        </Link>
      </div>
    </div>
  );
}

/** Column headings: the market's own labels when every row shares them, otherwise positions (1, X, 2). */
function columnLabels(list: SportEvent[]) {
  const first = list[0].mainMarket.selections.slice(0, 3).map((s) => s.label);
  const same = list.every((e) => e.mainMarket.selections.slice(0, 3).map((s) => s.label).join('|') === first.join('|'));
  if (same) return first;
  return first.length === 3 ? ['1', 'X', '2'] : ['1', '2'];
}

type GroupBy = 'competition' | 'day' | 'time';

/** Event list grouped by competition (default), by day, or flat by kick-off time. */
export function EventList({ events, emptyText = 'No events right now.', groupBy = 'competition' }: { events: SportEvent[]; emptyText?: string; groupBy?: GroupBy }) {
  const [page, setPage] = useState({ events, limit: 100 });
  const limit = page.events === events ? page.limit : 100;
  const visible = events.some(e => e.readOnly) ? events.slice(0, limit) : events;
  if (!events.length) return <div className="event-list"><div className="empty"><Icon name="sports" size={28} />{emptyText}</div></div>;
  const groups = new Map<string, SportEvent[]>();
  const key = (e: SportEvent) => (groupBy === 'competition' ? e.competitionId : groupBy === 'day' ? dayLabel(e.startTime) : 'all');
  visible.forEach((e) => { const k = key(e); const list = groups.get(k); if (list) list.push(e); else groups.set(k, [e]); });
  return (
    <div className="event-list labels-in-head">
      {[...groups.entries()].map(([title, list]) => {
        const cols = columnLabels(list);
        return (
          <div key={title}>
            <div className="comp-head">
              {groupBy === 'competition' && (list[0].readOnly ? <CatalogIcon url={list[0].competitionIcon} region={list[0].competitionRegion} imageWidth={42} imageHeight={14} /> : <Flag region={regionOf(list[0].competitionName)} size={18} />)}
              <span>{groupBy === 'time' ? 'By kick-off time' : groupBy === 'competition' ? list[0].competitionName : title}</span>
              <span className="cols" style={{ gridTemplateColumns: `repeat(${cols.length}, 64px)`, marginRight: 46 }}>
                {cols.map((c, i) => <span key={i} title={c}>{c.length > 9 ? c.slice(0, 8) + '…' : c}</span>)}
              </span>
            </div>
            {list.map((e) => <EventRow key={e.id} event={e} showCompetition={groupBy !== 'competition'} />)}
          </div>
        );
      })}
      {visible.length < events.length && <button className="btn btn-ghost" onClick={() => setPage({ events, limit: limit + 100 })}>Show more matches ({visible.length} of {events.length})</button>}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="event-list" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="event-row"><div className="skeleton" style={{ height: 40 }} /><div className="skeleton" style={{ height: 40, width: '40%', minWidth: 120 }} /></div>
      ))}
    </div>
  );
}
