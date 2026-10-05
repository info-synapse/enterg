import { useState } from 'react';
import { api } from '@/api';
import { EventList, ListSkeleton } from '@/components/EventRow';
import { Icon } from '@/components/Icon';
import { useAsync } from '@/lib/useAsync';
import { marketTabLabel, marketsFor } from '@/lib/markets';
import { SportsFrame, useSportsNav } from './SportsFrame';

export function Live() {
  const { sports } = useSportsNav();
  const [sport, setSport] = useState('all');
  const [market, setMarket] = useState<string | undefined>(undefined);
  const all = useAsync(() => api.sportsbook.getEvents({ live: true }), []);
  // The market switcher swaps the odds column in place, like the reference.
  const { data, loading } = useAsync(
    () => api.sportsbook.getEvents({ live: true, sportId: sport === 'all' ? undefined : sport, marketName: market }),
    [sport, market],
  );
  const total = all.data?.length ?? 0;
  const pick = (s: string) => {
    setSport(s);
    setMarket(undefined);
  };
  return (
    <SportsFrame>
      <div className="section-head"><h1 className="page-title">Live betting</h1><span className="meta num">{total} matches</span></div>
      <div className="chips" role="tablist" aria-label="Sport">
        <button role="tab" aria-selected={sport === 'all'} className={`chip ${sport === 'all' ? 'active' : ''}`} onClick={() => pick('all')}>All<span className="n">{total}</span></button>
        {sports.filter((s) => s.liveCount > 0).map((s) => (
          <button key={s.id} role="tab" aria-selected={sport === s.id} className={`chip ${sport === s.id ? 'active' : ''}`} onClick={() => pick(s.id)}>
            <Icon name={s.icon} size={20} />{s.name}<span className="n">{s.liveCount}</span>
          </button>
        ))}
      </div>
      {sport !== 'all' && (
        <div className="tabs" role="tablist" aria-label="Market shown">
          {marketsFor(sport).map((m, i) => (
            <button key={m} role="tab" aria-selected={(market ?? marketsFor(sport)[0]) === m} className={(market ?? marketsFor(sport)[0]) === m ? 'active' : ''} onClick={() => setMarket(i === 0 ? undefined : m)}>{marketTabLabel(m)}</button>
          ))}
        </div>
      )}
      {loading ? <ListSkeleton rows={8} /> : <EventList events={data ?? []} emptyText="No live matches in this sport right now." />}
    </SportsFrame>
  );
}
