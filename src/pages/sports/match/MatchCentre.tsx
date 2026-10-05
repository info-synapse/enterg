// Match centre: a compact score bar that sticks under the header while you scroll the markets,
// and a panel with Tracker · Stats · Timeline (live) or Preview · Form · Head-to-head (before kick-off).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EventDetail, LiveState } from '@/api/types';
import { Crest } from '@/components/Art';
import { Icon } from '@/components/Icon';
import { kickoff } from '@/lib/format';

type Tab = 'tracker' | 'stats' | 'timeline' | 'preview' | 'form' | 'h2h';

export function MatchCentre({ ev, live }: { ev: EventDetail; live?: LiveState }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const h = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 60;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: `-${h + 1}px 0px 0px 0px` });
    if (sentinel.current) io.observe(sentinel.current);
    return () => io.disconnect();
  }, []);

  const tabs: { id: Tab; label: string }[] = live
    ? [...(ev.sportId === 'football' ? [{ id: 'tracker' as Tab, label: 'Tracker' }] : []), { id: 'stats', label: 'Stats' }, ...(live.timeline ? [{ id: 'timeline' as Tab, label: 'Timeline' }] : [])]
    : [{ id: 'preview', label: 'Preview' }, { id: 'form', label: 'Form' }, ...(ev.h2h ? [{ id: 'h2h' as Tab, label: 'H2H' }] : [])];
  const [tab, setTab] = useState<Tab>(tabs[0].id);
  const [open, setOpen] = useState(true);

  return (
    <>
      <div ref={sentinel} className="mc-sentinel" aria-hidden="true" />
      <div
        className={`mc-head ${stuck ? 'stuck' : ''}`}
        onClick={stuck ? () => window.scrollTo({ top: 0, behavior: 'smooth' }) : undefined}
        role={stuck ? 'button' : undefined}
        aria-label={stuck ? 'Back to match centre' : undefined}
      >
        <div className="mc-team"><Crest name={ev.home} size={stuck ? 26 : 36} /><span>{ev.home}</span></div>
        <div className="mc-score">
          {live ? <strong className="num">{live.score[0]}–{live.score[1]}</strong> : <strong className="mc-vs">vs</strong>}
          {live ? <span className="live-badge">{live.minute}′ · {live.period}</span> : <span className="hint">{kickoff(ev.startTime)}</span>}
        </div>
        <div className="mc-team"><Crest name={ev.away} size={stuck ? 26 : 36} /><span>{ev.away}</span></div>
        {stuck && live?.lastAction && <div className="mc-last">{live.lastAction}</div>}
      </div>
      <section className="mc-body" aria-label="Match centre">
        <div className="mc-tabs">
          {tabs.length > 1 ? (
            <div className="seg" role="tablist" aria-label="Match centre views">
              {tabs.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id && open ? 'active' : ''} onClick={() => { setTab(t.id); setOpen(true); }}>{t.label}</button>
              ))}
            </div>
          ) : (
            <strong className="mc-single">{tabs[0].label}</strong>
          )}
          <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Hide match centre' : 'Show match centre'} style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
            <Icon name="chevronDown" size={18} />
          </button>
        </div>
        {open && (
          <div className="mc-panel">
            {tab === 'tracker' && live && <Tracker ev={ev} live={live} />}
            {tab === 'stats' && live && <Stats ev={ev} live={live} />}
            {tab === 'timeline' && live && <Timeline live={live} home={ev.home} away={ev.away} />}
            {tab === 'preview' && <Preview ev={ev} />}
            {tab === 'form' && <Form ev={ev} />}
            {tab === 'h2h' && <HeadToHead ev={ev} />}
          </div>
        )}
      </section>
    </>
  );
}

/* ---------- Tracker ---------- */

type Phase = { team: 0 | 1; zone: 0 | 1 | 2; text: string; x: number; y: number };
const ZONE_TEXT = ['Ball safe', 'Attack', 'Dangerous attack'];

/** Drawn tracker. In production this frame holds the provider's tracker widget (Betradar LMT / Genius Sports). */
function Tracker({ ev, live }: { ev: EventDetail; live: LiveState }) {
  const homeShare = (live.stats?.[0]?.home ?? 50) / 100;
  const next = (): Phase => {
    const team = (Math.random() < homeShare ? 0 : 1) as 0 | 1;
    const zone = (Math.random() < 0.45 ? 0 : Math.random() < 0.6 ? 1 : 2) as 0 | 1 | 2;
    const depth = [0.38, 0.62, 0.84][zone];
    const x = team === 0 ? 8 + depth * 284 : 292 - depth * 284;
    const extra = zone === 2 && Math.random() < 0.35 ? ['Shot on target', 'Corner', 'Free kick'][Math.floor(Math.random() * 3)] : null;
    return { team, zone, x, y: 22 + Math.random() * 106, text: extra ?? ZONE_TEXT[zone] };
  };
  const [phase, setPhase] = useState<Phase>(next);
  const [momentum, setMomentum] = useState<number[]>(() => Array.from({ length: 18 }, () => Math.round((Math.random() - (1 - homeShare)) * 90)));
  useEffect(() => {
    const t = setInterval(() => setPhase(next()), 2600);
    const m = setInterval(() => setMomentum((prev) => [...prev.slice(1), Math.round((Math.random() - (1 - homeShare)) * 100)]), 5200);
    return () => { clearInterval(t); clearInterval(m); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const goal = live.lastAction?.startsWith('Goal');
  const name = phase.team === 0 ? ev.home : ev.away;
  return (
    <div className="tracker">
      <div className="pitch" aria-label={`Tracker: ${goal ? live.lastAction : `${phase.text}, ${name}`}`}>
        <svg viewBox="0 0 300 150" preserveAspectRatio="none" aria-hidden="true">
          {/* attacking third of the team in possession */}
          {phase.zone > 0 && <rect x={phase.team === 0 ? 200 : 4} y="4" width="96" height="142" fill={phase.team === 0 ? 'var(--accent)' : '#ffffff'} opacity={phase.zone === 2 ? 0.28 : 0.14} style={{ transition: 'opacity .4s' }} />}
          <g fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2">
            <rect x="4" y="4" width="292" height="142" />
            <line x1="150" y1="4" x2="150" y2="146" />
            <circle cx="150" cy="75" r="18" />
            <rect x="4" y="40" width="34" height="70" />
            <rect x="262" y="40" width="34" height="70" />
          </g>
          <g className="ball" style={{ transform: `translate(${phase.x}px, ${phase.y}px)` }}>
            <circle r="9" fill={phase.team === 0 ? 'var(--accent)' : '#ffffff'} opacity="0.3" />
            <circle r="4" fill="#fff" />
          </g>
        </svg>
        <span className={`trk-label ${phase.team === 0 ? 'home' : 'away'}`}>{goal ? live.lastAction : <>{phase.text} · <strong>{name}</strong></>}</span>
      </div>
      <div className="momentum" aria-label="Attack momentum, last 15 minutes">
        <div className="mo-legend"><span><i className="home" />{ev.home}</span><span className="hint">Attack momentum</span><span><i className="away" />{ev.away}</span></div>
        <div className="mo-bars">
          {momentum.map((v, i) => <span key={i} className={v >= 0 ? 'up' : 'down'} style={{ height: `${Math.min(100, Math.abs(v)) / 2}%` }} />)}
        </div>
      </div>
      <p className="hint">The tracker can run a few seconds behind the TV picture.</p>
    </div>
  );
}

/* ---------- Stats, timeline, preview ---------- */

function Stats({ ev, live }: { ev: EventDetail; live: LiveState }) {
  const football = ev.sportId === 'football';
  const rows = [...(live.stats ?? []), ...(football && live.corners ? [{ label: 'Corners', home: live.corners[0], away: live.corners[1] }] : []), ...(football && live.cards ? [{ label: 'Yellow cards', home: live.cards[0], away: live.cards[1] }] : [])];
  return (
    <div className="mc-stats">
      <div className="kv"><strong>{ev.home}</strong><strong>{ev.away}</strong></div>
      {rows.map((s) => {
        const total = s.home + s.away || 1;
        return (
          <div key={s.label} className="mc-stat num">
            <span>{s.home}</span>
            <span className="mc-stat-label">{s.label}</span>
            <span>{s.away}</span>
            <span className="bar"><i style={{ width: `${(s.home / total) * 100}%` }} /><i style={{ width: `${(s.away / total) * 100}%` }} /></span>
          </div>
        );
      })}
    </div>
  );
}

const TL_ICON: Record<string, string> = { goal: 'football', card: 'bets', corner: 'pin', sub: 'transfer' };

function Timeline({ live, home, away }: { live: LiveState; home: string; away: string }) {
  if (!live.timeline?.length) return <p className="hint">No key events yet.</p>;
  return (
    <ol className="timeline">
      {live.timeline.map((t, i) => (
        <li key={i} className={`${t.type} ${t.team === 0 ? 'home' : 'away'}`}>
          <span className="tl-min num">{t.minute}′</span>
          <span className={`tl-dot ${t.type}`}><Icon name={TL_ICON[t.type]} size={14} /></span>
          <span className="tl-text">{t.type === 'goal' ? 'Goal' : t.type === 'card' ? 'Yellow card' : t.type === 'corner' ? 'Corner' : 'Substitution'}<small>{t.team === 0 ? home : away}</small></span>
        </li>
      ))}
    </ol>
  );
}

function Preview({ ev }: { ev: EventDetail }) {
  const p = ev.winProbability ?? [33, 34, 33];
  return (
    <div className="mc-stats">
      <div className="kv"><span>Win probability</span><span className="hint">from current odds</span></div>
      <div className="prob-bar"><i style={{ width: `${p[0]}%` }} />{p[1] > 0 && <i style={{ width: `${p[1]}%` }} />}<i style={{ width: `${p[2]}%` }} /></div>
      <div className="kv num"><span>{ev.home} {p[0]}%</span>{p[1] > 0 && <span>Draw {p[1]}%</span>}<span>{ev.away} {p[2]}%</span></div>
    </div>
  );
}

function FormRow({ team, form }: { team: string; form: string }) {
  return (
    <div className="form-row">
      <Crest name={team} size={24} /><span className="t">{team}</span>
      <span className="form-pills">{form.split('').map((r, i) => <i key={i} className={`f-${r}`}>{r}</i>)}</span>
    </div>
  );
}

function Form({ ev }: { ev: EventDetail }) {
  if (!ev.form) return <p className="hint">No form data.</p>;
  return (
    <div className="mc-stats">
      <span className="hint">Last 5 matches, most recent on the right</span>
      <FormRow team={ev.home} form={ev.form.home} />
      <FormRow team={ev.away} form={ev.form.away} />
    </div>
  );
}

function HeadToHead({ ev }: { ev: EventDetail }) {
  const wins = useMemo(() => {
    const w = { home: 0, draw: 0, away: 0 };
    ev.h2h?.forEach((m) => {
      const [a, b] = m.score.split('–').map(Number);
      if (a === b) w.draw++;
      else if ((a > b) === (m.home === ev.home)) w.home++;
      else w.away++;
    });
    return w;
  }, [ev]);
  return (
    <div className="mc-stats">
      <div className="kv num"><span>{ev.home} <strong>{wins.home}</strong></span><span>Draws <strong>{wins.draw}</strong></span><span><strong>{wins.away}</strong> {ev.away}</span></div>
      <ul className="h2h">
        {ev.h2h?.map((m, i) => <li key={i}><span className="hint num">{m.date.slice(0, 7)}</span><span>{m.home}</span><strong className="num">{m.score}</strong><span>{m.away}</span></li>)}
      </ul>
    </div>
  );
}
