import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api';
import { StoriesStrip } from '@/components/Stories';
import { EventList, ListSkeleton } from '@/components/EventRow';
import { Icon } from '@/components/Icon';
import { useAsync } from '@/lib/useAsync';
import { SportsFrame, useSportsNav } from './SportsFrame';

export function Home() {
  const [tab, setTab] = useState<'live' | 'upcoming'>('live');
  const [sport, setSport] = useState('football');
  const { sports } = useSportsNav();
  const { data, loading } = useAsync(() => api.sportsbook.getEvents({ sportId: sport, live: tab === 'live' }), [sport, tab]);

  return (
    <SportsFrame>
      <StoriesStrip vertical="sports" />

      <section className="section">
        <div className="section-head">
          <h2>{tab === 'live' ? 'Live now' : 'Starting soon'}</h2>
          <div className="seg" style={{ marginLeft: 'auto' }}>
            <button className={tab === 'live' ? 'active' : ''} onClick={() => setTab('live')}><span className="live-badge" style={{ color: 'inherit' }}>Live</span></button>
            <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>Upcoming</button>
          </div>
        </div>
        <div className="chips" role="tablist" aria-label="Sport">
          {sports.map((s) => (
            <button key={s.id} role="tab" aria-selected={sport === s.id} className={`chip ${sport === s.id ? 'active' : ''}`} onClick={() => setSport(s.id)}>
              <Icon name={s.icon} size={16} />{s.name}{tab === 'live' && <span className="n">{s.liveCount}</span>}
            </button>
          ))}
        </div>
        {loading ? <ListSkeleton /> : <EventList events={(data ?? []).slice(0, 10)} emptyText={tab === 'live' ? 'No live matches in this sport right now. Try Upcoming.' : 'No upcoming matches.'} />}
        <Link to={tab === 'live' ? '/live' : `/sport/${sport}`} className="btn btn-ghost" style={{ alignSelf: 'center' }}>
          {tab === 'live' ? 'All live matches' : 'All matches'}
        </Link>
      </section>

      <FeaturedCompetition id="gr-sl" title="Super League" />
      <FeaturedCompetition id="euroleague" title="EuroLeague" />
    </SportsFrame>
  );
}

function FeaturedCompetition({ id, title }: { id: string; title: string }) {
  const { data } = useAsync(() => api.sportsbook.getEvents({ competitionId: id }), [id]);
  if (!data?.length) return null;
  return (
    <section className="section">
      <div className="section-head"><h2>{title}</h2><span className="meta">{data.length} matches</span><Link className="more" to={`/sport/${data[0].sportId}/competition/${id}`}>See all</Link></div>
      <EventList events={data.slice(0, 4)} />
    </section>
  );
}
