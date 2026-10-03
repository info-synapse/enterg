import { Link } from 'react-router-dom';
import type { SportEvent } from '@/api/types';
import { kickoff } from '@/lib/format';
import { dayLabel } from '@/lib/markets';
import { useLiveClock } from '@/state/LiveContext';
import { OddsButton } from './OddsButton';
import { Icon } from './Icon';
import { Flag, regionOf } from './Flag';

export function EventRow({ event, showCompetition }: { event: SportEvent; showCompetition?: boolean }) {
  const live = useLiveClock(event.id, event.live);
  const name = `${event.home} – ${event.away}`;
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
            {event.badges?.includes('betbuilder') && <span className="tag">Bet Builder</span>}
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
  if (!events.length) return <div className="event-list"><div className="empty"><Icon name="sports" size={28} />{emptyText}</div></div>;
  const groups = new Map<string, SportEvent[]>();
  const key = (e: SportEvent) => (groupBy === 'competition' ? e.competitionName : groupBy === 'day' ? dayLabel(e.startTime) : 'all');
  events.forEach((e) => groups.set(key(e), [...(groups.get(key(e)) ?? []), e]));
  return (
    <div className="event-list labels-in-head">
      {[...groups.entries()].map(([title, list]) => {
        const cols = columnLabels(list);
        return (
          <div key={title}>
            <div className="comp-head">
              {groupBy === 'competition' && <Flag region={regionOf(title)} size={18} />}
              <span>{groupBy === 'time' ? 'By kick-off time' : title}</span>
              <span className="cols" style={{ gridTemplateColumns: `repeat(${cols.length}, 64px)`, marginRight: 46 }}>
                {cols.map((c, i) => <span key={i} title={c}>{c.length > 9 ? c.slice(0, 8) + '…' : c}</span>)}
              </span>
            </div>
            {list.map((e) => <EventRow key={e.id} event={e} showCompetition={groupBy !== 'competition'} />)}
          </div>
        );
      })}
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
