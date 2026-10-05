// Pre-match sport page: Highlights · Competitions · Coupon, plus the single-competition page.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '@/api';
import type { Competition } from '@/api/types';
import { EventList, ListSkeleton } from '@/components/EventRow';
import { Icon } from '@/components/Icon';
import { Flag } from '@/components/Flag';
import { useAsync } from '@/lib/useAsync';
import { AREA_REGIONS, GROUP_LABEL, GROUP_ORDER, couponWindows, marketTabLabel, marketsFor } from '@/lib/markets';
import { useFavourites } from '@/state/FavouritesContext';
import { SportsFrame, useSportsNav } from './SportsFrame';

type Tab = 'highlights' | 'competitions' | 'coupon';

/* ---------- Shared pieces ---------- */

/** Sport switcher. On mobile it starts with "Sports A–Z" (the full list); desktop has that list in the left rail. */
function SportStrip({ active }: { active: string }) {
  const { sports } = useSportsNav();
  return (
    <nav className="sport-strip" aria-label="Choose a sport">
      <NavLink to="/sports" className={`show-mobile ${active === 'az' ? 'active' : ''}`} aria-current={active === 'az' ? 'page' : undefined}>
        <Icon name="az" size={30} />
        Sports A–Z
      </NavLink>
      {sports.map((s) => (
        <NavLink key={s.id} to={`/sport/${s.id}`} className={s.id === active ? 'active' : ''}>
          <Icon name={s.icon} size={30} />
          {s.name}
        </NavLink>
      ))}
    </nav>
  );
}

function SportTabs({ sportId, tab }: { sportId: string; tab: Tab }) {
  return (
    <nav className="sport-tabs" aria-label="Sport views">
      <Link to={`/sport/${sportId}`} className={tab === 'highlights' ? 'active' : ''} aria-current={tab === 'highlights' ? 'page' : undefined}>Highlights</Link>
      <Link to={`/sport/${sportId}/competitions`} className={tab === 'competitions' ? 'active' : ''} aria-current={tab === 'competitions' ? 'page' : undefined}>Competitions</Link>
      <Link to={`/sport/${sportId}/coupon`} className={tab === 'coupon' ? 'active' : ''} aria-current={tab === 'coupon' ? 'page' : undefined}>Coupon</Link>
    </nav>
  );
}

function MarketTabs({ sportId, value, onChange }: { sportId: string; value: string; onChange: (m: string) => void }) {
  return (
    <div className="tabs" role="tablist" aria-label="Market shown in the odds columns">
      {marketsFor(sportId).map((m) => (
        <button key={m} role="tab" aria-selected={value === m} className={value === m ? 'active' : ''} onClick={() => onChange(m)}>{marketTabLabel(m)}</button>
      ))}
    </div>
  );
}

function StarButton({ id, name }: { id: string; name: string }) {
  const fav = useFavourites();
  const on = fav.isFav(id);
  return (
    <button className={`star-btn ${on ? 'on' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); fav.toggle(id); }} aria-pressed={on} aria-label={on ? `Remove ${name} from My competitions` : `Add ${name} to My competitions`}>
      <Icon name="star" size={18} />
    </button>
  );
}

function CompChip({ c }: { c: Competition }) {
  return (
    <Link to={`/sport/${c.sportId}/competition/${c.id}`} className="comp-chip">
      <Flag region={c.region} />{c.name}
    </Link>
  );
}

/** Competition tabs: flag + name (+ match count), scrolls the active one into view. */
function CompTabs({ children, activeKey }: { children: ReactNode; activeKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [activeKey]);
  return <div ref={ref} className="comp-tabs" role="tablist" aria-label="Competitions">{children}</div>;
}

/* ---------- Page shell ---------- */

export function SportPage() {
  const { sportId = 'football', tab = 'highlights' } = useParams();
  const [params] = useSearchParams();
  const { sports } = useSportsNav();
  // Old links like /sport/football?c=gr-sl go to the competition page.
  const legacy = params.get('c');
  if (legacy && tab === 'highlights') return <Navigate replace to={`/sport/${sportId}/competition/${legacy}`} />;
  const t = (['highlights', 'competitions', 'coupon'].includes(tab) ? tab : 'highlights') as Tab;
  const sport = sports.find((s) => s.id === sportId);
  return (
    <SportsFrame>
      <SportStrip active={sportId} />
      <h1 className="page-title">{sport?.name ?? ''}</h1>
      <SportTabs sportId={sportId} tab={t} />
      {t === 'highlights' && <Highlights sportId={sportId} />}
      {t === 'competitions' && <Competitions sportId={sportId} />}
      {t === 'coupon' && <Coupon sportId={sportId} />}
    </SportsFrame>
  );
}

/* ---------- Highlights ---------- */

function Highlights({ sportId }: { sportId: string }) {
  const [market, setMarket] = useState(marketsFor(sportId)[0]);
  const [limit, setLimit] = useState(14);
  useEffect(() => { setMarket(marketsFor(sportId)[0]); setLimit(14); }, [sportId]);
  const comps = useAsync(() => api.sportsbook.getCompetitions(sportId), [sportId]);
  const { data, loading } = useAsync(() => api.sportsbook.getEvents({ sportId, live: false, marketName: market }), [sportId, market]);
  const fav = useFavourites();
  const popular = (comps.data ?? []).filter((c) => c.featured || fav.isFav(c.id));
  const windows = couponWindows().slice(0, 3);
  const countIn = (w: (typeof windows)[number]) => (data ?? []).filter((e) => Date.parse(e.startTime) >= w.from!.getTime() && Date.parse(e.startTime) < w.to!.getTime()).length;
  // Highlights favour the leagues people bet on most: featured and starred first, then by kick-off.
  const ranked = useMemo(() => {
    const top = new Set(popular.map((c) => c.id));
    return [...(data ?? [])].sort((a, b) => Number(top.has(b.competitionId)) - Number(top.has(a.competitionId)) || Date.parse(a.startTime) - Date.parse(b.startTime));
  }, [data, popular]);
  const shown = ranked.slice(0, limit).sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));

  return (
    <>
      {popular.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Popular</h2><Link className="more" to={`/sport/${sportId}/competitions`}>All competitions</Link></div>
          <div className="chips">{popular.map((c) => <CompChip key={c.id} c={c} />)}</div>
        </section>
      )}
      <section className="section">
        <MarketTabs sportId={sportId} value={market} onChange={setMarket} />
        {loading ? <ListSkeleton rows={6} /> : <EventList events={shown} groupBy="day" emptyText="No upcoming matches in this sport." />}
        {ranked.length > limit && <button className="btn btn-ghost" style={{ alignSelf: 'center' }} onClick={() => setLimit((l) => l + 14)}>Show more matches</button>}
      </section>
      <section className="section">
        <div className="section-head"><h2>Coupons</h2><Link className="more" to={`/sport/${sportId}/coupon`}>Open coupon</Link></div>
        <div className="shortcuts">
          {windows.map((w) => (
            <Link key={w.id} to={`/sport/${sportId}/coupon?w=${w.id}`} className="shortcut"><Icon name="history" size={18} />{w.id === 'today' ? "Today's matches" : `Next ${w.label}`}<span className="n num">{countIn(w)}</span></Link>
          ))}
        </div>
      </section>
    </>
  );
}

/* ---------- Competitions ---------- */

function Competitions({ sportId }: { sportId: string }) {
  const nav = useNavigate();
  const location = useLocation();
  const preset = (location.state as { select?: string[] } | null)?.select;
  const { data, loading } = useAsync(() => api.sportsbook.getCompetitions(sportId), [sportId]);
  const fav = useFavourites();
  const [multi, setMulti] = useState(!!preset?.length);
  const [selected, setSelected] = useState<string[]>(preset ?? []);
  const [q, setQ] = useState('');
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [openCountries, setOpenCountries] = useState<string[]>([]);

  const all = data ?? [];
  // Like the reference: every group open, countries closed except the first one (Greece for football).
  useEffect(() => {
    if (!all.length) return;
    const groups = GROUP_ORDER.filter((x) => all.some((c) => c.group === x));
    setOpenGroups(groups);
    const g = groups[0];
    if (g) {
      const firstCountry = all.find((c) => c.group === g && !AREA_REGIONS.has(c.region))?.region;
      if (firstCountry) setOpenCountries([`${g}:${firstCountry}`]);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSel = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const open = (c: Competition) => (multi ? toggleSel(c.id) : nav(`/sport/${sportId}/competition/${c.id}`));
  const toggleIn = (setter: typeof setOpenGroups, key: string) => setter((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));

  const term = q.trim().toLowerCase();
  const matches = term ? all.filter((c) => `${c.name} ${c.region}`.toLowerCase().includes(term)) : [];
  const mine = all.filter((c) => fav.isFav(c.id));
  const popular = all.filter((c) => c.featured);

  // Grid tile: badge, league name, country, match count, star. In multi-select mode the tile toggles selection.
  const renderTile = (c: Competition, inCountry?: boolean) => {
    const on = selected.includes(c.id);
    return (
      <div key={c.id} className={`comp-tile ${multi && on ? 'selected' : ''}`}>
        <button className="tile-main" onClick={() => open(c)} aria-pressed={multi ? on : undefined}>
          {multi ? (
            <span className={`check ${on ? 'on' : ''}`} aria-hidden="true">{on && <Icon name="check" size={14} strokeWidth={3} />}</span>
          ) : (
            <Flag region={c.region} size={24} />
          )}
          <span className="tile-text">
            <span className="tile-name">{c.name}</span>
            <span className="tile-sub num">{inCountry ? '' : `${c.region} · `}{c.eventCount ? `${c.eventCount} ${c.eventCount === 1 ? 'match' : 'matches'}` : 'No matches yet'}</span>
          </span>
        </button>
        <StarButton id={c.id} name={c.name} />
      </div>
    );
  };

  return (
    <>
      <div className="toolbar">
        <label htmlFor="comp-q" className="sr-only">Find a competition</label>
        <input id="comp-q" className="input" placeholder="Find a league or country" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="switch" role="switch" aria-checked={multi} onClick={() => { setMulti((m) => !m); if (multi) setSelected([]); }}>
          <span className="track" />Select several leagues
        </button>
      </div>
      {multi && <p className="hint">Tick the leagues you want, then show their matches together on one coupon.</p>}

      {loading ? <div className="skeleton" style={{ height: 320 }} /> : term ? (
        <div>
          {matches.length ? <div className="comp-grid">{matches.map((c) => renderTile(c))}</div> : <div className="empty">No league matches “{q}”.</div>}
        </div>
      ) : (
        <>
          <section className="section">
            <div className="section-head"><h2>My competitions</h2><span className="meta num">{mine.length}</span></div>
            {mine.length ? <div className="comp-grid">{mine.map((c) => renderTile(c))}</div> : <div className="alert info">Tap the star next to any league to keep it here and at the top of Highlights.</div>}
          </section>
          <section className="section">
            <div className="section-head"><h2>Popular competitions</h2></div>
            <div className="comp-grid">{popular.map((c) => renderTile(c))}</div>
          </section>
          <section className="section">
            <div className="section-head"><h2>All competitions</h2><span className="meta num">{all.length}</span></div>
            <div className="browser">
              {GROUP_ORDER.filter((g) => all.some((c) => c.group === g)).map((g) => {
                const inGroup = all.filter((c) => c.group === g);
                const areaComps = inGroup.filter((c) => AREA_REGIONS.has(c.region));
                const countries = [...new Set(inGroup.filter((c) => !AREA_REGIONS.has(c.region)).map((c) => c.region))];
                const gOpen = openGroups.includes(g);
                return (
                  <div key={g} className={`browser-group ${gOpen ? 'open' : ''}`}>
                    <button onClick={() => toggleIn(setOpenGroups, g)} aria-expanded={gOpen}>{GROUP_LABEL[g]}<span className="hint num">{inGroup.length}</span><Icon name="chevronDown" size={18} /></button>
                    {gOpen && areaComps.length > 0 && <div className="comp-grid in-country">{areaComps.map((c) => renderTile(c))}</div>}
                    {gOpen && countries.map((country) => {
                      const key = `${g}:${country}`;
                      const list = inGroup.filter((c) => c.region === country);
                      const cOpen = openCountries.includes(key);
                      const selectedHere = list.filter((c) => selected.includes(c.id)).length;
                      return (
                        <div key={key} className={`country ${cOpen ? 'open' : ''}`}>
                          <button onClick={() => toggleIn(setOpenCountries, key)} aria-expanded={cOpen}>
                            <Flag region={country} size={24} />{country}
                            <span className="n num">{multi && selectedHere ? `${selectedHere} selected · ` : ''}{list.length} {list.length === 1 ? 'league' : 'leagues'}</span>
                            <Icon name="chevronDown" size={16} />
                          </button>
                          {cOpen && <div className="comp-grid in-country">{list.map((c) => renderTile(c, true))}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {multi && selected.length > 0 && (
        <div className="select-bar" role="region" aria-label="Selected leagues">
          <span className="num">{selected.length} {selected.length === 1 ? 'league' : 'leagues'} selected</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setSelected([])}>Clear</button>
          <button className="btn btn-primary btn-sm" onClick={() => nav(`/sport/${sportId}/coupon?w=all&c=${selected.join(',')}`)}>Show matches</button>
        </div>
      )}
    </>
  );
}

/* ---------- Coupon ---------- */

function Coupon({ sportId }: { sportId: string }) {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const leagues = (params.get('c') ?? '').split(',').filter(Boolean);
  const windows = useMemo(() => couponWindows(), []);
  const w = windows.find((x) => x.id === (params.get('w') ?? (leagues.length ? 'all' : 'today'))) ?? windows[2];
  const [sort, setSort] = useState<'top' | 'time'>('top');
  const [market, setMarket] = useState(marketsFor(sportId)[0]);
  useEffect(() => setMarket(marketsFor(sportId)[0]), [sportId]);
  const comps = useAsync(() => api.sportsbook.getCompetitions(sportId), [sportId]);
  const { data, loading } = useAsync(
    () => api.sportsbook.getEvents({ sportId, live: false, marketName: market, competitionIds: leagues, from: w.from?.toISOString(), to: w.to?.toISOString() }),
    [sportId, market, w.id, leagues.join(',')],
  );
  const fav = useFavourites();

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  // "Top competitions" order: starred, then featured, then by region group.
  const rank = useMemo(() => {
    const m = new Map<string, number>();
    (comps.data ?? []).forEach((c, i) => m.set(c.id, (fav.isFav(c.id) ? 0 : c.featured ? 1000 : 2000) + GROUP_ORDER.indexOf(c.group) * 100 + i));
    return m;
  }, [comps.data, fav]);
  const events = useMemo(() => {
    const list = [...(data ?? [])];
    if (sort === 'top') list.sort((a, b) => (rank.get(a.competitionId) ?? 9999) - (rank.get(b.competitionId) ?? 9999) || Date.parse(a.startTime) - Date.parse(b.startTime));
    return list;
  }, [data, sort, rank]);
  // Keep the selected time chip visible on narrow screens.
  useEffect(() => {
    document.querySelector('.coupon-windows [aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [w.id]);
  const compOf = (id: string) => comps.data?.find((c) => c.id === id);

  // Competition tabs: the chosen leagues, or every competition with matches in this window.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => m.set(e.competitionId, (m.get(e.competitionId) ?? 0) + 1));
    return m;
  }, [events]);
  const tabIds = useMemo(() => {
    const ids = leagues.length ? leagues : [...counts.keys()];
    return [...ids].sort((a, b) => (rank.get(a) ?? 9999) - (rank.get(b) ?? 9999));
  }, [leagues, counts, rank]);
  const focus = tabIds.includes(params.get('f') ?? '') ? params.get('f') : null;
  const shown = focus ? events.filter((e) => e.competitionId === focus) : events;

  return (
    <>
      <div className="chips coupon-windows" role="tablist" aria-label="Kick-off window">
        {windows.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === w.id} className={`chip ${x.id === w.id ? 'active' : ''}`} onClick={() => setParam('w', x.id)}>
            {x.id === '3h' || x.id === '12h' ? <Icon name="history" size={14} /> : null}{x.label}
          </button>
        ))}
      </div>
      {tabIds.length > 1 && (
        <CompTabs activeKey={focus ?? 'all'}>
          <button role="tab" aria-selected={!focus} className={`comp-tab ${!focus ? 'active' : ''}`} onClick={() => setParam('f', null)}>
            <Icon name={sportId === 'football' ? 'football' : 'sports'} size={18} />All<span className="n num">{events.length}</span>
          </button>
          {tabIds.map((id) => {
            const c = compOf(id);
            return (
              <button key={id} role="tab" aria-selected={focus === id} className={`comp-tab ${focus === id ? 'active' : ''}`} onClick={() => setParam('f', id)}>
                <Flag region={c?.region ?? ''} size={18} />{c?.name ?? id}<span className="n num">{counts.get(id) ?? 0}</span>
              </button>
            );
          })}
        </CompTabs>
      )}
      {leagues.length > 0 && (
        <div className="toolbar">
          <span className="hint">{leagues.length} {leagues.length === 1 ? 'league' : 'leagues'} chosen</span>
          <button className="link" onClick={() => nav(`/sport/${sportId}/competitions`, { state: { select: leagues } })}>Edit leagues</button>
          <button className="link" onClick={() => { const next = new URLSearchParams(params); next.delete('c'); next.delete('f'); setParams(next, { replace: true }); }}>Show all leagues</button>
        </div>
      )}
      <div className="toolbar">
        <div className="seg" aria-label="Sort matches">
          <button className={sort === 'top' ? 'active' : ''} onClick={() => setSort('top')}>Top competitions</button>
          <button className={sort === 'time' ? 'active' : ''} onClick={() => setSort('time')}>Kick-off time</button>
        </div>
        <span className="hint num" style={{ marginLeft: 'auto' }}>{loading ? '' : `${shown.length} matches`}</span>
      </div>
      <MarketTabs sportId={sportId} value={market} onChange={setMarket} />
      {loading ? <ListSkeleton rows={8} /> : (
        <EventList
          events={shown}
          groupBy={focus ? 'day' : sort === 'top' ? 'competition' : 'time'}
          emptyText={leagues.length ? 'No matches for these leagues in this window. Try All dates.' : 'No matches in this window. Pick a longer one.'}
        />
      )}
    </>
  );
}

/* ---------- Single competition ---------- */

export function CompetitionPage() {
  const { sportId = 'football', compId = '' } = useParams();
  const comps = useAsync(() => api.sportsbook.getCompetitions(sportId), [sportId]);
  const comp = comps.data?.find((c) => c.id === compId);
  const [market, setMarket] = useState(marketsFor(sportId)[0]);
  const { data, loading } = useAsync(() => api.sportsbook.getEvents({ competitionId: compId, live: false, marketName: market }), [compId, market]);
  const live = useAsync(() => api.sportsbook.getEvents({ competitionId: compId, live: true }), [compId]);
  return (
    <SportsFrame>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }} aria-label="Breadcrumb">
        <Link to={`/sport/${sportId}/competitions`} className="icon-btn" aria-label="Back to competitions"><Icon name="chevronLeft" /></Link>
        {comp && <Flag region={comp.region} size={28} />}
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title">{comp?.name ?? ''}</h1>
          <span className="hint">{comp?.region}</span>
        </div>
        {comp && <span style={{ marginLeft: 'auto' }}><StarButton id={comp.id} name={comp.name} /></span>}
      </nav>
      <CompetitionSwitcher sportId={sportId} current={compId} />
      {live.data && live.data.length > 0 && (
        <section className="section">
          <div className="section-head"><h2><span className="live-badge" style={{ fontSize: 'inherit' }}>Live now</span></h2></div>
          <EventList events={live.data} groupBy="day" />
        </section>
      )}
      <section className="section">
        <MarketTabs sportId={sportId} value={market} onChange={setMarket} />
        {loading ? <ListSkeleton /> : <EventList events={data ?? []} groupBy="day" emptyText="No upcoming matches in this competition yet." />}
      </section>
    </SportsFrame>
  );
}

/** Tabs to jump between competitions: yours (starred), the popular ones, and the one you're on. */
function CompetitionSwitcher({ sportId, current }: { sportId: string; current: string }) {
  const comps = useAsync(() => api.sportsbook.getCompetitions(sportId), [sportId]);
  const fav = useFavourites();
  const list = (comps.data ?? []).filter((c) => fav.isFav(c.id) || c.featured || c.id === current);
  list.sort((a, b) => Number(fav.isFav(b.id)) - Number(fav.isFav(a.id)) || GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  if (list.length < 2) return null;
  return (
    <CompTabs activeKey={current}>
      {list.map((c) => (
        <Link key={c.id} role="tab" aria-selected={c.id === current} className={`comp-tab ${c.id === current ? 'active' : ''}`} to={`/sport/${sportId}/competition/${c.id}`} replace>
          <Flag region={c.region} size={18} />{c.name}{fav.isFav(c.id) && <Icon name="star" size={13} />}
        </Link>
      ))}
      <Link className="comp-tab more" to={`/sport/${sportId}/competitions`}>All competitions<Icon name="chevronRight" size={14} /></Link>
    </CompTabs>
  );
}

/** "Sports A–Z" (first item of the sport strip on mobile): the list that lives in the left rail on desktop. */
export function SportsIndex() {
  const { sports, competitions } = useSportsNav();
  const fav = useFavourites();
  const mine = competitions.filter((c) => fav.isFav(c.id));
  return (
    <SportsFrame>
      <SportStrip active="az" />
      <h1 className="page-title">Sports A–Z</h1>
      {mine.length > 0 && (
        <section className="section">
          <h2 style={{ fontSize: 'var(--fs-md)' }}>My competitions</h2>
          <div className="chips">{mine.map((c) => <CompChip key={c.id} c={c} />)}</div>
        </section>
      )}
      <section className="section">
        <h2 style={{ fontSize: 'var(--fs-md)' }}>All sports</h2>
        <div className="card" style={{ padding: '4px 16px' }}>
          <div className="list">
            {sports.map((s) => (
              <Link key={s.id} className="list-row" to={`/sport/${s.id}`}><Icon name={s.icon} /><span className="main-col t">{s.name}</span>{s.liveCount > 0 && <span className="live-badge">{s.liveCount}</span>}<Icon name="chevronRight" size={16} /></Link>
            ))}
          </div>
        </div>
      </section>
    </SportsFrame>
  );
}
