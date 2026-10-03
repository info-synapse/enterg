import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api';
import type { EventDetail, Market, MarketGroup } from '@/api/types';
import { Crest } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { OddsButton } from '@/components/OddsButton';
import { kickoff } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { useLiveClock } from '@/state/LiveContext';
import { SportsFrame } from './SportsFrame';

const GROUPS: { id: MarketGroup | 'all'; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'goals', label: 'Goals' },
  { id: 'players', label: 'Players' },
  { id: 'combos', label: 'Combos' },
  { id: 'asian', label: 'Asian' },
  { id: 'specials', label: 'Specials' },
  { id: 'all', label: 'All' },
];

export function EventPage() {
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
  const [view, setView] = useState<'pitch' | 'stats'>('pitch');
  const [group, setGroup] = useState<MarketGroup | 'all'>('popular');
  const [betBuilder, setBetBuilder] = useState(false);
  const [pinned, setPinned] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const name = `${ev.home} – ${ev.away}`;

  const markets = useMemo(() => {
    let list = ev.markets.filter((m) => group === 'all' || m.group === group);
    if (betBuilder) list = list.filter((m) => m.betBuilder);
    return [...list].sort((a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)));
  }, [ev.markets, group, betBuilder, pinned]);

  const togglePin = (id: string) => setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleCollapse = (id: string) => setCollapsed((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }} aria-label="Breadcrumb">
        <Link to={live ? '/live' : `/sport/${ev.sportId}`} className="icon-btn" aria-label="Back"><Icon name="chevronLeft" /></Link>
        <Link to={`/sport/${ev.sportId}?c=${ev.competitionId}`}>{ev.competitionName}</Link>
      </nav>

      <section className="scoreboard" aria-label="Match">
        <div className="sb-top">
          {live ? <span className="live-badge">Live · {live.period}</span> : <span>{kickoff(ev.startTime)}</span>}
          {ev.badges?.includes('stream') && <span className="tag live" style={{ marginLeft: 'auto' }}>Live stream</span>}
        </div>
        <div className="sb-teams">
          <div className="sb-team"><Crest name={ev.home} />{ev.home}</div>
          <div className="sb-score num">
            {live ? `${live.score[0]} – ${live.score[1]}` : 'vs'}
            {live && <small>{live.minute}′</small>}
          </div>
          <div className="sb-team"><Crest name={ev.away} />{ev.away}</div>
        </div>
        {live && (
          <>
            <div className="sb-facts num">
              <span>Cards {live.cards?.[0]}–{live.cards?.[1]}</span>
              <span>Corners {live.corners?.[0]}–{live.corners?.[1]}</span>
            </div>
            {live.lastAction && <div className="sb-ticker"><Icon name="info" size={16} />{live.minute}′ {live.lastAction}</div>}
          </>
        )}
        <div className="seg" style={{ alignSelf: 'center' }}>
          <button className={view === 'pitch' ? 'active' : ''} onClick={() => setView('pitch')}><Icon name="pitch" size={16} /> {live ? 'Pitch' : 'Preview'}</button>
          <button className={view === 'stats' ? 'active' : ''} onClick={() => setView('stats')}><Icon name="stats" size={16} /> Stats</button>
        </div>
        {view === 'pitch' ? (
          live && ev.sportId === 'football' ? (
            <div className="pitch" aria-label="Match tracker">
              <svg viewBox="0 0 300 150" preserveAspectRatio="none" aria-hidden="true">
                <g fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2">
                  <rect x="4" y="4" width="292" height="142" />
                  <line x1="150" y1="4" x2="150" y2="146" />
                  <circle cx="150" cy="75" r="18" />
                  <rect x="4" y="40" width="34" height="70" />
                  <rect x="262" y="40" width="34" height="70" />
                </g>
                <circle cx={150 + ((live.minute * 37) % 120) - 60} cy={45 + ((live.minute * 13) % 60)} r="4" fill="#fff" />
              </svg>
              <span className="ball-label">{live.lastAction ?? 'Ball in play'}</span>
            </div>
          ) : (
            <WinProbability ev={ev} />
          )
        ) : (
          <Stats ev={ev} />
        )}
      </section>

      <section className="section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="tabs" role="tablist" aria-label="Market groups" style={{ flex: 1, minWidth: 0 }}>
            {GROUPS.filter((g) => g.id === 'all' || ev.markets.some((m) => m.group === g.id)).map((g) => (
              <button key={g.id} role="tab" aria-selected={group === g.id} className={group === g.id ? 'active' : ''} onClick={() => setGroup(g.id)}>{g.label}</button>
            ))}
          </div>
          <button className="switch" role="switch" aria-checked={betBuilder} onClick={() => setBetBuilder((b) => !b)}>
            <span className="track" />Bet Builder
          </button>
        </div>
        {betBuilder && <div className="alert info">Bet Builder: combine selections from this match into one bet. Only markets marked BB are shown.</div>}
        {markets.map((m) => (
          <MarketCard key={m.id} m={m} eventId={ev.id} eventName={name} live={!!live} pinned={pinned.includes(m.id)} collapsed={collapsed.includes(m.id)} onPin={() => togglePin(m.id)} onToggle={() => toggleCollapse(m.id)} />
        ))}
        {!markets.length && <div className="empty">No markets in this group right now.</div>}
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
          {m.name}{m.betBuilder && <span className="tag accent">BB</span>}
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

function WinProbability({ ev }: { ev: EventDetail }) {
  const p = ev.winProbability ?? [33, 34, 33];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="kv"><span>Win probability</span><span className="hint">from current odds</span></div>
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden' }}>
        <i style={{ width: `${p[0]}%`, background: 'var(--accent)' }} />
        {p[1] > 0 && <i style={{ width: `${p[1]}%`, background: 'var(--ink-3)' }} />}
        <i style={{ width: `${p[2]}%`, background: 'var(--surface-3)' }} />
      </div>
      <div className="kv num"><span>{ev.home} {p[0]}%</span>{p[1] > 0 && <span>Draw {p[1]}%</span>}<span>{ev.away} {p[2]}%</span></div>
      {ev.form && (
        <div className="kv"><span>Last 5: <strong>{ev.form.home.split('').join(' ')}</strong></span><span>Last 5: <strong>{ev.form.away.split('').join(' ')}</strong></span></div>
      )}
    </div>
  );
}

function Stats({ ev }: { ev: EventDetail }) {
  if (!ev.live?.stats) return <WinProbability ev={ev} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {ev.live.stats.map((s) => {
        const total = s.home + s.away || 1;
        return (
          <div key={s.label} className="stat-row num">
            <span className="stat-label">{s.label}</span>
            <span>{s.home}</span>
            <span className="bar"><i style={{ width: `${(s.home / total) * 100}%` }} /><i style={{ width: `${(s.away / total) * 100}%` }} /></span>
            <span style={{ textAlign: 'right' }}>{s.away}</span>
          </div>
        );
      })}
    </div>
  );
}
