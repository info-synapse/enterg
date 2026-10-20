import { BackendEventPage } from './BackendEventPage';
// Match page, mobile first: sticky score bar + match centre, fast markets (live), then market tabs
// with Bet Builder and Players as first-class tabs. See the feature design brief for the reasoning.
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/api';
import type { EventDetail, Market, MarketGroup } from '@/api/types';
import { Icon } from '@/components/Icon';
import { OddsButton } from '@/components/OddsButton';
import { useAsync } from '@/lib/useAsync';
import { useLiveClock } from '@/state/LiveContext';
import { SportsFrame } from './SportsFrame';
import { MatchCentre } from './match/MatchCentre';
import { NextUp } from './match/NextUp';
import { BetBuilderTab } from './match/BetBuilder';
import { PlayerTables } from './match/PlayerTables';

type Group = MarketGroup | 'all' | 'builder';

const GROUPS: { id: Group; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'builder', label: 'Bet Builder' },
  { id: 'players', label: 'Players' },
  { id: 'goals', label: 'Goals' },
  { id: 'specials', label: 'Specials' },
  { id: 'combos', label: 'Combos' },
  { id: 'asian', label: 'Asian' },
  { id: 'all', label: 'All' },
];

export function EventPage() {
  const { eventId = '' } = useParams();
  return eventId.startsWith('backend:event:') ? <BackendEventPage key={eventId} eventId={eventId} /> : <MockEventPage />;
}

function MockEventPage() {
  const { eventId = '' } = useParams();
  const { data: ev, loading } = useAsync(() => api.sportsbook.getEvent(eventId), [eventId]);
  return (
    <SportsFrame>
      {loading ? (
        <div className="skeleton" style={{ height: 320 }} />
      ) : !ev ? (
        <div className="empty"><Icon name="sports" size={28} />This match has finished or was removed.<Link className="btn btn-ghost" to="/">Back to sports</Link></div>
      ) : (
        <EventView ev={ev} />
      )}
    </SportsFrame>
  );
}

function EventView({ ev }: { ev: EventDetail }) {
  const live = useLiveClock(ev.id, ev.live);
  const [params, setParams] = useSearchParams();
  const available = GROUPS.filter((g) =>
    g.id === 'all' ||
    (g.id === 'builder' ? !!ev.builds?.length : g.id === 'players' ? !!ev.players?.length : ev.markets.some((m) => m.group === g.id)),
  );
  const asked = params.get('tab') as Group | null;
  const group: Group = asked && available.some((g) => g.id === asked) ? asked : 'popular';
  const setGroup = (g: Group) => setParams(g === 'popular' ? {} : { tab: g }, { replace: true });
  const [pinned, setPinned] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const name = `${ev.home} – ${ev.away}`;

  const markets = useMemo(() => {
    const list = ev.markets.filter((m) => group === 'all' || m.group === group);
    return [...list].sort((a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)));
  }, [ev.markets, group, pinned]);

  const togglePin = (id: string) => setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleCollapse = (id: string) => setCollapsed((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to={live ? '/live' : `/sport/${ev.sportId}`} className="icon-btn" aria-label="Back"><Icon name="chevronLeft" /></Link>
        <Link to={`/sport/${ev.sportId}/competition/${ev.competitionId}`}>{ev.competitionName}</Link>
        {ev.badges?.includes('stream') && <span className="tag live" style={{ marginLeft: 'auto' }}>Live stream</span>}
      </nav>

      <MatchCentre ev={ev} live={live} />
      {live && <NextUp ev={ev} />}

      <section className="section">
        <div className="tabs market-tabs" role="tablist" aria-label="Market groups">
          {available.map((g) => (
            <button key={g.id} role="tab" aria-selected={group === g.id} className={`${group === g.id ? 'active' : ''} ${g.id === 'builder' ? 'bb-tab' : ''}`} onClick={() => setGroup(g.id)}>
              {g.id === 'builder' && <Icon name="builder" size={16} />}{g.label}
            </button>
          ))}
        </div>
        {group === 'builder' ? (
          <BetBuilderTab ev={ev} live={!!live} />
        ) : group === 'players' ? (
          <PlayerTables ev={ev} live={!!live} />
        ) : (
          <>
            {markets.map((m) => (
              <MarketCard key={m.id} m={m} eventId={ev.id} eventName={name} live={!!live} pinned={pinned.includes(m.id)} collapsed={collapsed.includes(m.id)} onPin={() => togglePin(m.id)} onToggle={() => toggleCollapse(m.id)} />
            ))}
            {!markets.length && <div className="empty">No markets in this group right now.</div>}
          </>
        )}
      </section>
    </>
  );
}

function MarketCard({ m, eventId, eventName, live, pinned, collapsed, onPin, onToggle }: { m: Market; eventId: string; eventName: string; live: boolean; pinned: boolean; collapsed: boolean; onPin: () => void; onToggle: () => void }) {
  const cols = m.selections.length === 3 ? 'cols-3' : m.selections.length === 2 ? 'cols-2' : '';
  return (
    <div className="market">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="market-head" onClick={onToggle} aria-expanded={!collapsed}>
          {m.name}
        </button>
        <div className="market-head" style={{ width: 'auto', paddingLeft: 0 }}>
          <span className="actions">
            <button className="icon-btn" onClick={onPin} aria-pressed={pinned} aria-label={pinned ? 'Unpin market' : 'Pin market to top'} style={pinned ? { color: 'var(--accent-text)' } : undefined}><Icon name="pin" size={18} /></button>
            <button className="icon-btn" onClick={onToggle} aria-label={collapsed ? 'Expand' : 'Collapse'} style={{ transform: collapsed ? 'none' : 'rotate(180deg)' }}><Icon name="chevronDown" size={18} /></button>
          </span>
        </div>
      </div>
      {!collapsed && (
        <div className={`market-body ${cols}`}>
          {m.selections.map((s) => <OddsButton key={s.id} selection={s} eventId={eventId} eventName={eventName} marketName={m.name} live={live} wide />)}
        </div>
      )}
    </div>
  );
}

