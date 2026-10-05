import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/api';
import type { Game } from '@/api/types';
import { GameArt } from '@/components/Art';
import { GameTile } from '@/components/GameTile';
import { FilterPanel, applyFilter, emptyFilter, filterCount, toggle, type Band, type GameFilter } from '@/components/CasinoFilters';
import { Icon } from '@/components/Icon';
import { AppFrame } from '@/components/Layout';
import { money } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/state/AuthContext';
import { useLiveJackpot } from '@/state/LiveContext';
import { StoriesStrip } from '@/components/Stories';
import { RewardsCard } from './Rewards';
import { ScrollRail } from '@/components/ScrollRail';
import { refreshRewards, useRewards } from '@/state/useRewards';
import { toast } from '@/components/Toast';

// Quick chips under the stories: each one switches a value in the full filter panel.
const QUICK: { label: string; on: (f: GameFilter) => boolean; flip: (f: GameFilter) => GameFilter }[] = [
  { label: 'High RTP', on: (f) => f.rtp.includes('high'), flip: (f) => ({ ...f, rtp: toggle(f.rtp, 'high' as Band) }) },
  { label: 'High volatility', on: (f) => f.volatility.includes('high'), flip: (f) => ({ ...f, volatility: toggle(f.volatility, 'high' as Band) }) },
  ...['Fruits', 'Greco-Roman', 'Egyptian'].map((t) => ({ label: t === 'Greco-Roman' ? 'Greek myths' : t, on: (f: GameFilter) => f.themes.includes(t), flip: (f: GameFilter) => ({ ...f, themes: toggle(f.themes, t) }) })),
  ...['Bonus Buy', 'Megaways', 'Jackpots', 'Wilds', 'Fixed paylines', 'Scatter'].map((x) => ({ label: x, on: (f: GameFilter) => f.features.includes(x), flip: (f: GameFilter) => ({ ...f, features: toggle(f.features, x) }) })),
];

/** Every slot game, most popular first (the "All slots" category). */
const allSlots = (games: Game[]) => games.filter((g) => g.category === 'slots').sort((a, b) => b.popularity - a.popularity);

function useCasinoData() {
  const games = useAsync(() => api.casino.getGames(), []);
  const collections = useAsync(() => api.casino.getCollections('casino'), []);
  const byId = useMemo(() => new Map((games.data ?? []).map((g) => [g.id, g])), [games.data]);
  return { games: games.data ?? [], collections: collections.data ?? [], byId, loading: games.loading || collections.loading };
}

export function Rail({ title, games, to, count, max = 16 }: { title: string; games: Game[]; to?: string; count?: number; max?: number }) {
  if (!games.length) return null;
  return (
    <section className="section">
      <div className="section-head"><h2>{title}</h2>{count !== undefined && <span className="meta num">{count}</span>}{to && <Link className="more" to={to}>See all</Link>}</div>
      <ScrollRail label={title}>{games.slice(0, max).map((g) => <GameTile key={g.id} game={g} />)}</ScrollRail>
    </section>
  );
}

export function CasinoLobby() {
  const { games, collections, byId, loading } = useCasinoData();
  const providers = useAsync(() => api.casino.getProviders(), []);
  const options = useAsync(() => api.casino.getFilterOptions(), []);
  const [filter, setFilter] = useState<GameFilter>(emptyFilter);
  const [panel, setPanel] = useState(false);
  const [sort, setSort] = useState<'popular' | 'az' | 'rtp'>('popular');
  const n = filterCount(filter);
  const filtered = useMemo(() => {
    const list = applyFilter(games, filter);
    return list.sort((a, b) => (sort === 'az' ? a.name.localeCompare(b.name) : sort === 'rtp' ? b.rtp - a.rtp : b.popularity - a.popularity));
  }, [games, filter, sort]);
  // Every selected value as a removable chip.
  const chips: { label: string; remove: () => void }[] = [
    ...filter.themes.map((t) => ({ label: t, remove: () => setFilter((f) => ({ ...f, themes: toggle(f.themes, t) })) })),
    ...filter.providers.map((t) => ({ label: t, remove: () => setFilter((f) => ({ ...f, providers: toggle(f.providers, t) })) })),
    ...filter.rtp.map((t) => ({ label: `RTP ${t}`, remove: () => setFilter((f) => ({ ...f, rtp: toggle(f.rtp, t) })) })),
    ...filter.volatility.map((t) => ({ label: `Volatility ${t}`, remove: () => setFilter((f) => ({ ...f, volatility: toggle(f.volatility, t) })) })),
    ...filter.features.map((t) => ({ label: t, remove: () => setFilter((f) => ({ ...f, features: toggle(f.features, t) })) })),
  ];

  return (
    <AppFrame slipRail={false}>
      <StoriesStrip vertical="casino" />
      <RewardsCard />
      <div className="chips" aria-label="Filter games">
        <button className={`chip filter-chip ${n ? 'active' : ''}`} onClick={() => setPanel(true)} aria-label={`All filters${n ? `, ${n} selected` : ''}`}>
          <Icon name="filter" size={16} />Filters{n > 0 && <span className="f-badge">{n}</span>}
        </button>
        {QUICK.map((q) => (
          <button key={q.label} className={`chip ${q.on(filter) ? 'active' : ''}`} aria-pressed={q.on(filter)} onClick={() => setFilter(q.flip)}>{q.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="rail-row">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />)}</div>
      ) : n ? (
        <section className="section">
          <div className="toolbar">
            {chips.map((c) => <button key={c.label} className="removable" onClick={c.remove} aria-label={`Remove ${c.label}`}>{c.label}<Icon name="close" size={14} /></button>)}
            <button className="link" onClick={() => setFilter(emptyFilter)}>Clear all</button>
          </div>
          <div className="section-head">
            <h2>{filtered.length} {filtered.length === 1 ? 'game' : 'games'}</h2>
            <label htmlFor="lobby-sort" className="sr-only">Sort games</label>
            <select id="lobby-sort" className="select" style={{ width: 'auto', height: 36, marginLeft: 'auto', fontSize: 'var(--fs-sm)' }} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="popular">Most popular</option>
              <option value="az">A–Z</option>
              <option value="rtp">Highest RTP</option>
            </select>
          </div>
          {filtered.length ? <div className="game-grid">{filtered.map((g) => <GameTile key={g.id} game={g} />)}</div> : <div className="empty">No games match all these filters. Remove one to see more.</div>}
        </section>
      ) : (
        <>
          {collections.map((c) => (
            <Rail key={c.id} title={c.title} count={c.gameIds.length} to={c.id === 'jackpots' ? '/casino/jackpots' : `/casino/c/${c.id}`} games={c.gameIds.map((id) => byId.get(id)).filter(Boolean) as Game[]} />
          ))}
          <Rail title="All slots" count={allSlots(games).length} to="/casino/c/all-slots" games={allSlots(games)} max={24} />
          <JackpotSection />
          <section className="section">
            <div className="section-head"><h2>Providers</h2><span className="meta num">{providers.data?.length}</span></div>
            <div className="providers">
              {providers.data?.map((p) => <Link key={p.id} to={`/casino/provider/${p.id}`} className="provider">{p.name}<span className="num">{p.gameCount}</span></Link>)}
            </div>
          </section>
        </>
      )}
      {panel && options.data && <FilterPanel games={games} options={options.data} value={filter} onChange={setFilter} onClose={() => setPanel(false)} />}
    </AppFrame>
  );
}

function JackpotTier({ id, name, amount }: { id: string; name: string; amount: number }) {
  const v = useLiveJackpot(`${id}:${name}`, amount);
  return <span className="jp-top">{money(v)}</span>;
}

export function JackpotSection() {
  const { data } = useAsync(() => api.casino.getJackpots(), []);
  if (!data) return null;
  return (
    <section className="section">
      <div className="section-head"><h2>Jackpots</h2><Link className="more" to="/casino/jackpots">Jackpot games</Link></div>
      <div className="jackpots">
        {data.map((j) => (
          <div key={j.id} className="jp-card">
            <h3>{j.provider} · {j.tiers[0].name}</h3>
            <JackpotTier id={j.id} name={j.tiers[0].name} amount={j.tiers[0].amount} />
            <div className="jp-tiers">
              {j.tiers.slice(1).map((t) => <div key={t.name}>{t.name}<b>{money(t.amount)}</b></div>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CollectionPage({ kind }: { kind: 'collection' | 'provider' | 'jackpots' }) {
  const { id = '' } = useParams();
  const { games, collections, byId, loading } = useCasinoData();
  const providers = useAsync(() => api.casino.getProviders(), []);
  let title = '';
  let list: Game[] = [];
  if (kind === 'collection' && id === 'all-slots') {
    title = 'All slots';
    list = allSlots(games);
  } else if (kind === 'collection') {
    const c = collections.find((x) => x.id === id);
    title = c?.title ?? 'Games';
    list = (c?.gameIds.map((g) => byId.get(g)).filter(Boolean) as Game[]) ?? [];
  } else if (kind === 'provider') {
    const p = providers.data?.find((x) => x.id === id);
    title = p?.name ?? 'Provider';
    list = games.filter((g) => g.provider === p?.name);
  } else {
    title = 'Jackpots';
    list = games.filter((g) => g.jackpot);
  }
  return (
    <AppFrame slipRail={false}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Link to="/casino" className="icon-btn" aria-label="Back to casino"><Icon name="chevronLeft" /></Link><h1 className="page-title">{title}</h1><span className="meta num" style={{ color: 'var(--ink-3)' }}>{list.length} games</span></nav>
      {kind === 'jackpots' && <JackpotSection />}
      {loading ? <div className="skeleton" style={{ height: 300 }} /> : <div className="game-grid">{list.map((g) => <GameTile key={g.id} game={g} />)}</div>}
    </AppFrame>
  );
}

export function GamePlay() {
  const { id = '' } = useParams();
  const { player, openAuth } = useAuth();
  const { byId, games } = useCasinoData();
  const game = byId.get(id);
  const [launch, setLaunch] = useState<{ url: string; mode: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const rewards = useRewards();
  useEffect(() => {
    if (params.get('demo')) start('demo');
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = async (mode: 'real' | 'demo') => {
    if (mode === 'real' && !player) return openAuth('login');
    setBusy(true);
    const before = rewards?.missions.filter((m) => m.status !== 'active').map((m) => m.id) ?? [];
    const r = await api.casino.launchGame(id, mode);
    setLaunch({ url: r.url, mode });
    setBusy(false);
    if (mode === 'real') {
      const after = await refreshRewards();
      const done = after.missions.find((m) => m.status === 'done' && !before.includes(m.id));
      if (done) toast(`Mission complete: ${done.title}. Claim ${done.xp} XP in Rewards.`);
    }
  };
  if (!game) return <AppFrame slipRail={false}><div className="skeleton" style={{ height: 360 }} /></AppFrame>;
  const similar = games.filter((g) => g.id !== game.id && (g.provider === game.provider || g.volatility === game.volatility)).slice(0, 8);
  return (
    <AppFrame slipRail={false}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Link to="/casino" className="icon-btn" aria-label="Back to casino"><Icon name="chevronLeft" /></Link><div><h1 className="page-title">{game.name}</h1><span className="hint">{game.provider}</span></div></nav>
      <div className="launch">
        <GameArt game={game} />
        <div className="msg">
          {launch ? (
            <>
              <strong>{launch.mode === 'demo' ? 'Demo mode' : 'Real money'} session ready</strong>
              <span style={{ fontSize: 'var(--fs-xs)', opacity: 0.8, wordBreak: 'break-all' }}>The provider's game loads here in an iframe: {launch.url}</span>
              <button className="btn btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', alignSelf: 'center' }} onClick={() => setLaunch(null)}>Close game</button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className="btn btn-primary" disabled={busy} onClick={() => start('real')}>{player ? 'Play' : 'Log in to play'}</button>
              <button className="btn btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} disabled={busy} onClick={() => start('demo')}>Try for free</button>
            </div>
          )}
        </div>
      </div>
      {player && rewards && <GameRewardsStrip gameId={game.id} />}
      <div className="card">
        <div className="grid-2">
          <div className="kv"><span>RTP</span><strong>{game.rtp}%</strong></div>
          <div className="kv"><span>Volatility</span><strong style={{ textTransform: 'capitalize' }}>{game.volatility}</strong></div>
          <div className="kv"><span>Minimum bet</span><strong>{money(game.minBet)}</strong></div>
          <div className="kv"><span>Bonus Buy</span><strong>{game.bonusBuy ? 'Yes' : 'No'}</strong></div>
        </div>
        <p className="hint">Time spent in casino games counts towards your daily time limit.</p>
      </div>
      <Rail title="You might also like" games={similar} />
    </AppFrame>
  );
}

/** Under the game: the tournament this game counts for, and the next open mission. Quiet, below the game frame. */
function GameRewardsStrip({ gameId }: { gameId: string }) {
  const r = useRewards();
  if (!r) return null;
  const t = r.tournaments.find((x) => x.gameIds.includes(gameId));
  const m = r.missions.find((x) => x.status === 'active');
  if (!t && !m) return null;
  return (
    <Link to="/casino/rewards" className="rw-strip">
      {t && (
        <span><Icon name="trophy" size={16} />{t.joined ? (t.me ? <>{t.title}: <strong>#{t.me.rank}</strong>, best {t.me.score}×</> : <>Counts for {t.title}</>) : <>Counts for {t.title} · join in Rewards</>}</span>
      )}
      {m && <span><Icon name="star" size={16} />{m.title} <strong className="num">{m.progress}/{m.target}</strong></span>}
    </Link>
  );
}
