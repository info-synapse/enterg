// Casino rewards: missions, levels, tournaments with leaderboards.
// Guardrails (see the design brief): missions are about variety, never "wager €X"; XP comes only from
// missions, so spend never drives level; tournaments are opt-in and ranked by best win multiplier.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api';
import type { Mission, Rewards, Tournament } from '@/api/types';
import { GameTile } from '@/components/GameTile';
import { Icon } from '@/components/Icon';
import { AppFrame } from '@/components/Layout';
import { toast } from '@/components/Toast';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/state/AuthContext';
import { setRewards, timeLeft, useRewards } from '@/state/useRewards';

function LevelRing({ r, size = 56 }: { r: Rewards; size?: number }) {
  const pct = (r.xp - r.levelFrom) / (r.levelTo - r.levelFrom);
  const rad = size / 2 - 5;
  const c = 2 * Math.PI * rad;
  return (
    <span className="level-ring" style={{ width: size, height: size }} aria-label={`Level ${r.level}, ${Math.round(pct * 100)}% to level ${r.level + 1}`}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={rad} stroke="var(--surface-3)" strokeWidth="5" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={rad} stroke="var(--accent)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <strong className="num">{r.level}</strong>
    </span>
  );
}

const Bar = ({ value, max }: { value: number; max: number }) => (
  <span className="pbar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><i style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></span>
);

/** Progress card in the casino lobby, under Stories. */
export function RewardsCard() {
  const { player, openAuth } = useAuth();
  const r = useRewards();
  if (!player)
    return (
      <div className="rw-card">
        <span className="rw-icon"><Icon name="trophy" size={22} /></span>
        <span className="rw-main"><strong>Missions and tournaments</strong><small>Log in to see today’s missions and join tournaments.</small></span>
        <button className="btn btn-quiet btn-sm" onClick={() => openAuth('login')}>Log in</button>
      </div>
    );
  if (!r) return <div className="rw-card skeleton" style={{ height: 84 }} />;
  const ready = r.missions.filter((m) => m.status === 'done').length;
  const left = r.missions.filter((m) => m.status === 'active').length;
  const joined = r.tournaments.find((t) => t.joined && t.me);
  return (
    <Link to="/casino/rewards" className="rw-card" aria-label="Rewards: missions, level and tournaments">
      <LevelRing r={r} />
      <span className="rw-main">
        <strong>Level {r.level} <span className="hint num">· {r.levelTo - r.xp} XP to level {r.level + 1}</span></strong>
        <span className="rw-minis">{r.missions.map((m) => <Bar key={m.id} value={m.status === 'active' ? m.progress : m.target} max={m.target} />)}</span>
        <small>{ready ? <b className="rw-ready">{ready} mission{ready > 1 ? 's' : ''} ready to claim</b> : left ? `${left} of ${r.missions.length} missions left today` : 'All missions done for today'}</small>
      </span>
      {joined?.me && (
        <span className="rw-tour hide-mobile"><Icon name="trophy" size={16} /><span><strong>#{joined.me.rank}</strong> {joined.title}<small>ends in {timeLeft(joined.endsAt)}</small></span></span>
      )}
      <Icon name="chevronRight" size={18} />
    </Link>
  );
}

export function RewardsPage() {
  const { player, openAuth } = useAuth();
  const r = useRewards();
  const [tab, setTab] = useState<'missions' | 'tournaments'>('missions');
  if (!player)
    return (
      <AppFrame slipRail={false}>
        <h1 className="page-title">Rewards</h1>
        <div className="card"><div className="empty"><Icon name="trophy" size={28} />Log in to see your missions, level and tournaments.<button className="btn btn-primary" onClick={() => openAuth('login')}>Log in</button></div></div>
      </AppFrame>
    );
  return (
    <AppFrame slipRail={false}>
      <nav className="crumbs"><Link to="/casino" className="icon-btn" aria-label="Back to casino"><Icon name="chevronLeft" /></Link><h1 className="page-title">Rewards</h1></nav>
      {!r ? <div className="skeleton" style={{ height: 160 }} /> : (
        <>
          <section className="card rw-level">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <LevelRing r={r} size={72} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2>Level {r.level}</h2>
                <Bar value={r.xp - r.levelFrom} max={r.levelTo - r.levelFrom} />
                <span className="hint num">{r.xp} / {r.levelTo} XP</span>
              </div>
            </div>
            <div className="kv"><span>At level {r.level + 1}</span><strong>{r.nextReward}</strong></div>
            <p className="hint">XP comes only from missions. How much you bet never changes your level.</p>
          </section>
          <div className="seg" role="tablist" style={{ alignSelf: 'flex-start' }}>
            <button role="tab" aria-selected={tab === 'missions'} className={tab === 'missions' ? 'active' : ''} onClick={() => setTab('missions')}>Missions</button>
            <button role="tab" aria-selected={tab === 'tournaments'} className={tab === 'tournaments' ? 'active' : ''} onClick={() => setTab('tournaments')}>Tournaments</button>
          </div>
          {tab === 'missions' ? (
            <section className="section">
              <span className="hint">New missions in {timeLeft(r.missionsResetAt)}</span>
              {r.missions.map((m) => <MissionCard key={m.id} m={m} />)}
            </section>
          ) : (
            <section className="section">{r.tournaments.map((t) => <TournamentCard key={t.id} t={t} />)}</section>
          )}
        </>
      )}
    </AppFrame>
  );
}

function MissionCard({ m }: { m: Mission }) {
  const [busy, setBusy] = useState(false);
  const claim = async () => {
    setBusy(true);
    try {
      const before = (await api.casino.getRewards()).level;
      const r = await api.casino.claimMission(m.id);
      setRewards(r);
      toast(r.level > before ? `+${m.xp} XP · you reached level ${r.level}` : `+${m.xp} XP`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className={`card mission ${m.status}`}>
      <div className="mission-top">
        <span className="mission-icon"><Icon name={m.status === 'claimed' ? 'check' : 'star'} size={18} /></span>
        <span className="main-col"><strong>{m.title}</strong><br /><span className="hint">{m.detail}</span></span>
        <span className="tag accent num">+{m.xp} XP</span>
      </div>
      <div className="mission-progress"><Bar value={m.progress} max={m.target} /><span className="num hint">{m.progress}/{m.target}</span></div>
      {m.status === 'done' && <button className="btn btn-primary" disabled={busy} onClick={claim}>Claim {m.xp} XP</button>}
      {m.status === 'active' && <Link className="btn btn-quiet" to={m.id === 'ms-live' ? '/live-casino' : '/casino'}>Find a game</Link>}
      {m.status === 'claimed' && <span className="hint">Claimed</span>}
    </article>
  );
}

function TournamentCard({ t }: { t: Tournament }) {
  const [board, setBoard] = useState(false);
  const [busy, setBusy] = useState(false);
  const games = useAsync(() => api.casino.getGames(), []);
  const eligible = (games.data ?? []).filter((g) => t.gameIds.includes(g.id));
  const join = async () => {
    setBusy(true);
    try {
      setRewards(await api.casino.joinTournament(t.id));
      toast(`You joined ${t.title}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="card tournament">
      <div className="mission-top">
        <span className="mission-icon"><Icon name="trophy" size={18} /></span>
        <span className="main-col"><strong>{t.title}</strong><br /><span className="hint">{t.prize}</span></span>
        <span className="tag num"><Icon name="clock" size={12} />&nbsp;{timeLeft(t.endsAt)}</span>
      </div>
      <p className="hint">{t.rule}</p>
      {t.joined ? (
        <div className="kv"><span>{t.me ? 'Your position' : 'You’re in'}</span><strong className="num">{t.me ? `#${t.me.rank} · best ${t.me.score}×` : 'Play an eligible game to get ranked'}</strong></div>
      ) : (
        <button className="btn btn-primary" disabled={busy} onClick={join}>Join tournament</button>
      )}
      <button className="link" onClick={() => setBoard((b) => !b)} aria-expanded={board} style={{ alignSelf: 'flex-start' }}>{board ? 'Hide leaderboard' : 'Show leaderboard'}</button>
      {board && (
        <ol className="board">
          {t.leaderboard.map((row) => <li key={row.rank}><span className="num">{row.rank}</span><span>{row.name}</span><strong className="num">{row.score}×</strong></li>)}
          {t.me && <li className="me"><span className="num">{t.me.rank}</span><span>You</span><strong className="num">{t.me.score}×</strong></li>}
        </ol>
      )}
      {eligible.length > 0 && (
        <>
          <span className="hint">Eligible games</span>
          <div className="rail-row">{eligible.map((g) => <GameTile key={g.id} game={g} />)}</div>
        </>
      )}
    </article>
  );
}
