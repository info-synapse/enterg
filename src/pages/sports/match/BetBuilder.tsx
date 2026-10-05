// Bet Builder tab: combine selections from one match into a single bet.
// Only combinable markets are shown; clashing odds are greyed out in place with a reason;
// the builder bar takes the bet slip pill's place at the bottom while it holds picks.
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import type { EventDetail, Market, Selection, SlipSelection } from '@/api/types';
import { Icon } from '@/components/Icon';
import { OddsButton } from '@/components/OddsButton';
import { toast } from '@/components/Toast';
import { odds as fmtOdds } from '@/lib/format';
import { useBetSlip } from '@/state/BetSlipContext';
import { clashWith, isMulti, type Pick } from './builderRules';
import { PlayerTables } from './PlayerTables';

const MAX = 7;

export function BetBuilderTab({ ev, live }: { ev: EventDetail; live: boolean }) {
  const slip = useBetSlip();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [priced, setPriced] = useState<SlipSelection | null>(null);
  const [pricing, setPricing] = useState(false);
  const [error, setError] = useState<string>();
  const [expanded, setExpanded] = useState(false);
  const name = `${ev.home} – ${ev.away}`;
  const markets = ev.markets.filter((m) => m.betBuilder);

  // The builder bar replaces the slip pill while it has picks.
  const { setPillHidden } = slip;
  useEffect(() => {
    setPillHidden(picks.length > 0);
    return () => setPillHidden(false);
  }, [picks.length, setPillHidden]);

  useEffect(() => {
    setError(undefined);
    if (picks.length < 2) { setPriced(null); return; }
    let alive = true;
    setPricing(true);
    api.sportsbook.priceBetBuilder(ev.id, picks.map((p) => p.id))
      .then((line) => alive && setPriced(line))
      .catch((e) => alive && setError((e as Error).message))
      .finally(() => alive && setPricing(false));
    return () => { alive = false; };
  }, [picks, ev.id]);

  const pickOf = (s: Selection, marketName: string, player?: string): Pick => ({ id: s.id, label: player ?? s.label, marketName, player });
  const picked = (id: string) => picks.some((p) => p.id === id);
  const blockedBy = (s: Selection, marketName: string, player?: string) => {
    if (picked(s.id)) return undefined;
    if (picks.length >= MAX && (isMulti(marketName) || !picks.some((p) => p.marketName === marketName))) return `A Bet Builder holds up to ${MAX} selections`;
    const c = clashWith(pickOf(s, marketName, player), picks);
    return c ? `Can’t combine with ${c.label} (${c.marketName})` : undefined;
  };
  const onPick = (s: Selection, marketName: string, player?: string) =>
    setPicks((prev) => {
      if (prev.some((p) => p.id === s.id)) return prev.filter((p) => p.id !== s.id);
      const rest = isMulti(marketName) ? prev : prev.filter((p) => p.marketName !== marketName);
      return [...rest, pickOf(s, marketName, player)];
    });

  const addToSlip = (line: SlipSelection) => {
    if (slip.has(line.selectionId)) { toast('This Bet Builder is already in your bet slip.', 'info'); return; }
    slip.addMany([line]);
    toast('Bet Builder added to your bet slip');
  };

  return (
    <div className="bb">
      <p className="hint bb-intro">Combine selections from this match into one bet. Odds that can’t go together are greyed out. If one selection is void, the whole Bet Builder is void.</p>
      {!!ev.builds?.length && <PopularBuilds ev={ev} onAdd={addToSlip} />}
      {markets.map((m) => <BuilderMarket key={m.id} m={m} eventId={ev.id} eventName={name} live={live} picked={picked} blockedBy={blockedBy} onPick={onPick} />)}
      <PlayerTables ev={ev} live={live} builder={{ picked, blockedBy, onPick }} />

      {picks.length > 0 && (
        <div className={`bb-bar ${expanded ? 'open' : ''}`} role="region" aria-label="Your Bet Builder">
          {expanded && (
            <ul className="bb-legs">
              {picks.map((p) => (
                <li key={p.id}>
                  <span><strong>{p.label}</strong><small>{p.marketName}</small></span>
                  <button className="icon-btn" onClick={() => setPicks((prev) => prev.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.label}`}><Icon name="close" size={16} /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="bb-bar-main">
            <button className="bb-summary" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
              <span className="bb-count num">{picks.length}</span>
              <span>
                <strong>Bet Builder</strong>
                <small>{picks.length < 2 ? 'Add 1 more selection' : error ? error : expanded ? 'Hide selections' : 'Show selections'}</small>
              </span>
            </button>
            <span className="bb-odds num" aria-live="polite">{pricing ? '…' : priced ? fmtOdds(priced.odds) : '–'}</span>
            <button className="btn btn-primary" disabled={!priced || pricing} onClick={() => { if (priced) { addToSlip(priced); setPicks([]); setExpanded(false); } }}>Add to slip</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BuilderMarket({ m, eventId, eventName, live, picked, blockedBy, onPick }: {
  m: Market; eventId: string; eventName: string; live: boolean;
  picked: (id: string) => boolean; blockedBy: (s: Selection, marketName: string) => string | undefined; onPick: (s: Selection, marketName: string) => void;
}) {
  const cols = m.selections.length === 3 ? 'cols-3' : m.selections.length === 2 ? 'cols-2' : '';
  return (
    <div className="market">
      <div className="market-head" style={{ cursor: 'default' }}>{m.name}</div>
      <div className={`market-body ${cols}`}>
        {m.selections.map((s) => (
          <OddsButton key={s.id} selection={s} eventId={eventId} eventName={eventName} marketName={m.name} live={live} wide picked={picked(s.id)} onPick={() => onPick(s, m.name)} blockedBy={blockedBy(s, m.name)} />
        ))}
      </div>
    </div>
  );
}

function PopularBuilds({ ev, onAdd }: { ev: EventDetail; onAdd: (l: SlipSelection) => void }) {
  const [lines, setLines] = useState<SlipSelection[]>([]);
  const builds = useMemo(() => ev.builds ?? [], [ev.builds]);
  useEffect(() => {
    Promise.all(builds.map((b) => api.sportsbook.priceBetBuilder(ev.id, b.selectionIds).catch(() => null))).then((r) => setLines(r.filter(Boolean) as SlipSelection[]));
  }, [builds, ev.id]);
  if (!lines.length) return null;
  return (
    <section className="section" aria-label="Popular builds">
      <div className="section-head"><h2 style={{ fontSize: 'var(--fs-md)' }}>Popular builds</h2></div>
      <div className="builds">
        {lines.map((l) => (
          <article key={l.selectionId} className="build">
            <ul>{l.builder?.map((b) => <li key={b.selectionId}><Icon name="check" size={14} strokeWidth={2.5} /><span>{b.label} <small>{b.marketName}</small></span></li>)}</ul>
            <div className="build-foot">
              <span className="num"><small>Odds</small> {fmtOdds(l.odds)}</span>
              <button className="btn btn-quiet btn-sm" onClick={() => onAdd(l)}>Add to slip</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
