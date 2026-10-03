// Lobby filter panel: Themes, Providers, RTP, Volatility, Features (same sections as the reference).
import { useState } from 'react';
import type { CasinoFilterOptions, Game } from '@/api/types';
import { Icon } from './Icon';

export type Band = 'high' | 'medium' | 'low';
export interface GameFilter {
  themes: string[];
  providers: string[];
  rtp: Band[];
  volatility: Band[];
  features: string[];
}
export const emptyFilter: GameFilter = { themes: [], providers: [], rtp: [], volatility: [], features: [] };

/** RTP bands used by the filter. */
export const rtpBand = (rtp: number): Band => (rtp >= 96.5 ? 'high' : rtp >= 95 ? 'medium' : 'low');

export const filterCount = (f: GameFilter) => f.themes.length + f.providers.length + f.rtp.length + f.volatility.length + f.features.length;

/** Any-of within a section, all sections combined. */
export function applyFilter(games: Game[], f: GameFilter) {
  return games.filter(
    (g) =>
      (!f.themes.length || f.themes.some((t) => g.themes.includes(t))) &&
      (!f.providers.length || f.providers.includes(g.provider)) &&
      (!f.rtp.length || f.rtp.includes(rtpBand(g.rtp))) &&
      (!f.volatility.length || f.volatility.includes(g.volatility)) &&
      (!f.features.length || f.features.some((x) => g.features.includes(x))),
  );
}

export const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function CheckGrid({ title, items, selected, counts, onToggle, id }: { title: string; items: string[]; selected: string[]; counts: Map<string, number>; onToggle: (v: string) => void; id: string }) {
  const [more, setMore] = useState(false);
  const shown = more ? items : items.slice(0, 6);
  return (
    <fieldset className="f-section">
      <legend>{title}{selected.length > 0 && <span className="f-badge">{selected.length}</span>}</legend>
      <div className="f-grid">
        {shown.map((v) => (
          <label key={v} className="f-check" htmlFor={`${id}-${v}`}>
            <input id={`${id}-${v}`} type="checkbox" checked={selected.includes(v)} onChange={() => onToggle(v)} />
            <span className="f-box" aria-hidden="true"><Icon name="check" size={13} strokeWidth={3} /></span>
            <span className="f-name">{v}</span>
            <span className="f-n num">{counts.get(v) ?? 0}</span>
          </label>
        ))}
      </div>
      {items.length > 6 && <button type="button" className="btn btn-quiet f-more" onClick={() => setMore((m) => !m)}>{more ? 'Show less' : `Show all ${items.length}`}</button>}
    </fieldset>
  );
}

function Bands({ title, info, selected, onToggle }: { title: string; info: string; selected: Band[]; onToggle: (b: Band) => void }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <fieldset className="f-section">
      <legend>
        <button type="button" className="f-info" onClick={() => setShowInfo((s) => !s)} aria-expanded={showInfo} aria-label={`What is ${title}?`}><Icon name="info" size={15} /></button>
        {title}
      </legend>
      {showInfo && <p className="hint">{info}</p>}
      <div className="f-bands">
        {(['high', 'medium', 'low'] as Band[]).map((b) => (
          <button key={b} type="button" className={selected.includes(b) ? 'active' : ''} aria-pressed={selected.includes(b)} onClick={() => onToggle(b)}>{b[0].toUpperCase() + b.slice(1)}</button>
        ))}
      </div>
    </fieldset>
  );
}

export function FilterPanel({ games, options, value, onChange, onClose }: { games: Game[]; options: CasinoFilterOptions; value: GameFilter; onChange: (f: GameFilter) => void; onClose: () => void }) {
  const count = (key: 'themes' | 'features') => {
    const m = new Map<string, number>();
    games.forEach((g) => g[key].forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return m;
  };
  const providerCounts = new Map<string, number>();
  games.forEach((g) => providerCounts.set(g.provider, (providerCounts.get(g.provider) ?? 0) + 1));
  const results = applyFilter(games, value).length;
  const set = (patch: Partial<GameFilter>) => onChange({ ...value, ...patch });

  return (
    <div className="backdrop center" onClick={onClose}>
      <div className="sheet filter-sheet" role="dialog" aria-modal="true" aria-label="Filters" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Filters</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close filters"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <CheckGrid id="th" title="Themes" items={options.themes} selected={value.themes} counts={count('themes')} onToggle={(v) => set({ themes: toggle(value.themes, v) })} />
          <CheckGrid id="pr" title="Providers" items={options.providers.map((p) => p.name)} selected={value.providers} counts={providerCounts} onToggle={(v) => set({ providers: toggle(value.providers, v) })} />
          <Bands title="RTP" info="Return to player: the share of all money staked that a game pays back over time. High is 96.5% or more, medium 95–96.5%, low under 95%." selected={value.rtp} onToggle={(b) => set({ rtp: toggle(value.rtp, b) })} />
          <Bands title="Volatility" info="How a game pays out. High volatility pays bigger wins less often; low volatility pays smaller wins more often." selected={value.volatility} onToggle={(b) => set({ volatility: toggle(value.volatility, b) as Band[] })} />
          <CheckGrid id="fe" title="Features" items={options.features} selected={value.features} counts={count('features')} onToggle={(v) => set({ features: toggle(value.features, v) })} />
        </div>
        <div className="sheet-foot">
          <button className="btn btn-quiet" onClick={() => onChange(emptyFilter)} disabled={!filterCount(value)}>Clear</button>
          <button className="btn btn-primary" onClick={onClose}>{filterCount(value) ? `Show ${results} ${results === 1 ? 'game' : 'games'}` : 'Close'}</button>
        </div>
      </div>
    </div>
  );
}
