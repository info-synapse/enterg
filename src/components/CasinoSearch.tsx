// Full-screen casino search: games and live tables, with sort and provider filter (like the reference).
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/api';
import type { Game, LiveTable } from '@/api/types';
import { useAsync } from '@/lib/useAsync';
import { useLiveTable } from '@/state/LiveContext';
import { GameTile, TableTile } from './GameTile';
import { Icon } from './Icon';

type Sort = 'popular' | 'az';
type Item = { kind: 'game'; game: Game } | { kind: 'table'; table: LiveTable };

const nameOf = (i: Item) => (i.kind === 'game' ? i.game.name : i.table.name);
const providerOf = (i: Item) => (i.kind === 'game' ? i.game.provider : i.table.provider);

function LiveResultTile({ table }: { table: LiveTable }) {
  const results = useLiveTable(table.id, table.results);
  return <TableTile table={table} results={results} />;
}

export function CasinoSearch({ onClose }: { onClose: () => void }) {
  const games = useAsync(() => api.casino.getGames(), []);
  const tables = useAsync(() => api.casino.getLiveTables(), []);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('popular');
  const [providers, setProviders] = useState<string[]>([]);
  const [filters, setFilters] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && (filters ? setFilters(false) : onClose());
    window.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
    };
  }, [onClose, filters]);

  const all: Item[] = useMemo(
    () => [...(games.data ?? []).map((game) => ({ kind: 'game' as const, game })), ...(tables.data ?? []).map((table) => ({ kind: 'table' as const, table }))],
    [games.data, tables.data],
  );
  const term = q.trim().toLowerCase();
  const matches = useMemo(
    () => (term.length < 2 ? [] : all.filter((i) => `${nameOf(i)} ${providerOf(i)} ${i.kind === 'table' ? `${i.table.dealer} ${i.table.kind} live` : i.game.themes.join(' ')}`.toLowerCase().includes(term))),
    [all, term],
  );
  const popularity = (i: Item) => (i.kind === 'game' ? i.game.popularity : i.table.players / 10);
  const results = useMemo(() => {
    const list = matches.filter((i) => !providers.length || providers.includes(providerOf(i)));
    return list.sort((a, b) => (sort === 'az' ? nameOf(a).localeCompare(nameOf(b)) : popularity(b) - popularity(a)));
  }, [matches, providers, sort]);
  const suggestions = useMemo(() => [...(games.data ?? [])].sort((a, b) => b.popularity - a.popularity).slice(0, 18), [games.data]);
  const providerCounts = useMemo(() => {
    const m = new Map<string, number>();
    matches.forEach((i) => m.set(providerOf(i), (m.get(providerOf(i)) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [matches]);
  const active = providers.length + (sort === 'az' ? 1 : 0);

  return (
    <div className="search-screen" role="dialog" aria-modal="true" aria-label="Search the casino">
      <div className="search-bar">
        <button className="icon-btn" onClick={onClose} aria-label="Close search"><Icon name="chevronLeft" /></button>
        <div className="search-field">
          <Icon name="search" size={18} />
          <label htmlFor="casino-q" className="sr-only">Search games and live dealers</label>
          <input id="casino-q" ref={input} placeholder="Search games and live dealers" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          {q && <button className="search-clear" onClick={() => { setQ(''); input.current?.focus(); }} aria-label="Clear search"><Icon name="close" size={14} strokeWidth={2.5} /></button>}
          <span className="search-sep" aria-hidden="true" />
          <button className="search-filter" onClick={() => setFilters(true)} aria-label="Sort and filter results">
            <Icon name="filter" size={18} />{active > 0 && <span className="f-badge">{active}</span>}
          </button>
        </div>
      </div>

      <div className="search-body">
        {term.length < 2 ? (
          <section className="section">
            <div className="section-head"><h2>Popular right now</h2></div>
            <div className="game-grid">{suggestions.map((g) => <GameTile key={g.id} game={g} />)}</div>
          </section>
        ) : (
          <section className="section">
            <div><h2 style={{ fontSize: 'var(--fs-lg)' }}>Results</h2><span className="hint num">{results.length} {results.length === 1 ? 'game' : 'games'}{providers.length ? ` · ${providers.length} provider${providers.length > 1 ? 's' : ''}` : ''}</span></div>
            {results.length ? (
              <div className="game-grid">
                {results.map((i) => (i.kind === 'game' ? <GameTile key={i.game.id} game={i.game} /> : <LiveResultTile key={i.table.id} table={i.table} />))}
              </div>
            ) : (
              <div className="empty"><Icon name="search" size={28} />Nothing matches “{q}”{providers.length ? ' with these providers' : ''}. Check the spelling or try a provider or dealer name.</div>
            )}
          </section>
        )}
      </div>

      {filters && (
        <div className="backdrop center" onClick={() => setFilters(false)}>
          <div className="sheet filter-sheet" role="dialog" aria-label="Sort and filter" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head"><h2>Filters</h2><button className="icon-btn" onClick={() => setFilters(false)} aria-label="Close filters"><Icon name="close" /></button></div>
            <div className="modal-body">
              <fieldset className="f-section">
                <legend>Sort</legend>
                <div className="seg" style={{ alignSelf: 'flex-start' }}>
                  <button className={sort === 'popular' ? 'active' : ''} onClick={() => setSort('popular')}>Most popular</button>
                  <button className={sort === 'az' ? 'active' : ''} onClick={() => setSort('az')}>A–Z</button>
                </div>
              </fieldset>
              <fieldset className="f-section">
                <legend>Filter by provider</legend>
                {providerCounts.length === 0 && <p className="hint">Type at least two letters to see providers for your search.</p>}
                <div className="f-list">
                  {providerCounts.map(([p, n]) => (
                    <label key={p} className="f-check" htmlFor={`sp-${p}`}>
                      <input id={`sp-${p}`} type="checkbox" checked={providers.includes(p)} onChange={() => setProviders((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]))} />
                      <span className="f-box" aria-hidden="true"><Icon name="check" size={13} strokeWidth={3} /></span>
                      <span className="f-name">{p}</span>
                      <span className="f-pill num">{n} {n === 1 ? 'game' : 'games'}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="sheet-foot">
              <button className="btn btn-quiet" onClick={() => { setProviders([]); setSort('popular'); }} disabled={!active}>Clear</button>
              <button className="btn btn-primary" onClick={() => setFilters(false)}>{term.length >= 2 ? `Show ${results.length} ${results.length === 1 ? 'game' : 'games'}` : 'Close'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
