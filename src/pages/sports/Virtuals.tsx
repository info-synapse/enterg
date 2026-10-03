import { useEffect, useState } from 'react';
import { api } from '@/api';
import type { VirtualEvent } from '@/api/types';
import { OddsButton } from '@/components/OddsButton';
import { StoriesStrip } from '@/components/Stories';
import { countdown } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { SportsFrame } from './SportsFrame';

const SPORTS = ['Football', 'Basketball', 'Horses', 'Greyhounds', 'Tennis'] as const;

function VirtualCard({ ev, now }: { ev: VirtualEvent; now: number }) {
  const left = Date.parse(ev.startsAt) - now;
  const name = ev.home ? `${ev.home} – ${ev.away}` : `${ev.leagueName} race`;
  const isRace = ev.sport === 'Horses' || ev.sport === 'Greyhounds';
  return (
    <div className="v-card">
      <div className="top"><span className="tag">{ev.sport}</span><span>{ev.leagueName}</span>
        <span className="cd" aria-label="Starts in">{left > 0 ? countdown(ev.startsAt, now) : 'Running'}</span></div>
      <div className="match">{name}</div>
      <div className={`v-odds ${isRace || ev.market.selections.length !== 3 ? 'list' : ''}`}>
        {(isRace ? ev.market.selections.slice(0, 6) : ev.market.selections).map((s) => (
          <OddsButton key={s.id} selection={{ ...s, suspended: left <= 0 }} eventId={ev.id} eventName={name} marketName={ev.market.name} wide={isRace} />
        ))}
      </div>
    </div>
  );
}

export function Virtuals() {
  const leagues = useAsync(() => api.virtuals.getLeagues(), []);
  const [events, setEvents] = useState<VirtualEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    api.virtuals.getUpcoming().then(setEvents);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  // Refresh the schedule once every event in view has started.
  useEffect(() => {
    if (events.length && events.every((e) => Date.parse(e.startsAt) < now - 15000)) api.virtuals.getUpcoming().then(setEvents);
  }, [now, events]);

  const shown = events.filter((e) => filter === 'all' || e.sport === filter || e.leagueId === filter);
  return (
    <SportsFrame>
      <StoriesStrip vertical="virtuals" />
      <div className="section-head"><h1 className="page-title">Virtual sports</h1><span className="meta">New events every few minutes, 24/7</span></div>
      <div className="v-layout">
        <nav className="v-tree" aria-label="Virtual leagues">
          <div><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Starting soon</button></div>
          {SPORTS.map((s) => (
            <div key={s}>
              <h3>{s}</h3>
              {leagues.data?.filter((l) => l.sport === s).map((l) => (
                <button key={l.id} className={filter === l.id ? 'active' : ''} onClick={() => setFilter(l.id)}>{l.name}</button>
              ))}
            </div>
          ))}
        </nav>
        <div className="section">
          {!events.length ? <div className="skeleton" style={{ height: 240 }} /> : (
            <div className="v-cards">{shown.map((e) => <VirtualCard key={e.id} ev={e} now={now} />)}</div>
          )}
          <p className="hint">Results are decided by a certified random number generator. Virtual sports count towards your daily time limit.</p>
        </div>
      </div>
    </SportsFrame>
  );
}
