import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/api';
import type { Bets2Row, BetDetailRow } from '@/api/types';
import { HTTP_AUTH_MODE } from '@/api/mode';
import { useAuth } from '@/state/AuthContext';
import { AccountFrame } from './AccountFrame';

const amount = (n: number | null) => n === null ? '—' : n.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function initial() {
  const today = new Date(), from = new Date(today);
  from.setDate(1); from.setFullYear(from.getFullYear() - 10);
  from.setDate(Math.min(today.getDate(), new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate()));
  return { from: day(from), to: day(today) };
}
function outcome(row: Bets2Row) {
  return row.final === 0 ? 'Open' : row.final === 1 && ((row.payout ?? 0) > 0 || (row.refund ?? 0) > 0) ? 'Settled with return' : row.final === 1 && row.payout === 0 && row.refund === 0 ? 'Lost' : 'Unknown';
}
function Selection({ row }: { row: BetDetailRow }) {
  const won = row.final === 1 && row.hit === 1, lost = row.final === 1 && row.hit === 0, pending = row.final === 0 && row.hit === 0;
  const label = won ? 'Won' : lost ? 'Lost' : pending ? 'Pending' : 'Unknown';
  const suffix = row.parameter ? ` (${row.parameter})` : '';
  const selection = row.selection || ((row.forecastCode ?? 0) < 0 ? 'Selection name pending' : '—');
  return <div className="leg" style={{ alignItems: 'start', gap: 12 }}>
    <span role="img" aria-label={label} title={label} style={{ color: won ? 'var(--good)' : lost ? 'var(--bad)' : 'var(--ink-3)', fontWeight: 700 }}>{won ? '✓' : lost ? '✗' : '?'}</span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 16px' }}>
        <span>{row.home || '—'} – {row.away || '—'}</span>
        <span>{row.market || '—'}</span>
        <strong>{selection}{suffix && !selection.endsWith(suffix.trim()) ? suffix : ''}</strong>
      </span>
      <span className="hint">{row.sport} · {row.tournament} · {row.startsAt.replace('T', ' ')}{row.betType === 2 ? ' · Live' : ''}</span>
      {row.result && <div className="hint">Result: {row.result}</div>}
    </span><span className="o" title="Decimal odds">{amount(row.odds)}</span>
  </div>;
}
export function Bets2() {
  const { player, restoring } = useAuth();
  const [draft, setDraft] = useState(initial), [query, setQuery] = useState(initial);
  const [rows, setRows] = useState<Bets2Row[]>([]), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0), [tab, setTab] = useState('all'), [search, setSearch] = useState(''), [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setRows([]); setError(''); setPage(0);
    if (!player || restoring) { setLoading(false); return; }
    setLoading(true);
    const timeout = window.setTimeout(() => controller.abort(), 35000);
    const start = window.setTimeout(() => {
      api.account.getBets2(query, controller.signal).then(data => { if (active) setRows(data); })
        .catch(() => { if (active) setError('Could not load bets. Retry or narrow the date range.'); })
        .finally(() => { window.clearTimeout(timeout); if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(start); window.clearTimeout(timeout); controller.abort(); };
  }, [player, restoring, query, attempt]);
  const filtered = rows.filter(row => (tab === 'all' || (tab === 'open' ? row.final === 0 : row.final === 1)) && (!search || row.id.includes(search.trim())));
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  function apply(e: FormEvent) { e.preventDefault(); if (draft.from > draft.to) return; setQuery({ ...draft }); }
  return <AccountFrame>
    <h1 className="page-title">Bets2</h1>
    <form className="filters" onSubmit={apply}>
      <label>From <input className="input" type="date" required value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
      <label>To <input className="input" type="date" required min={draft.from} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
      <button className="btn btn-primary" disabled={loading}>Apply filters</button>
    </form>
    <div className="filters"><div className="seg">{['all', 'open', 'settled'].map(value => <button key={value} className={tab === value ? 'active' : ''} onClick={() => { setTab(value); setPage(0); }}>{value === 'all' ? 'All' : value === 'open' ? 'Open' : 'Settled'}</button>)}</div>
      <input className="input" aria-label="Search by bet ID" placeholder="Search by bet ID" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></div>
    {!HTTP_AUTH_MODE && <p className="hint">This report requires a backend login. No sample bets are substituted.</p>}
    {loading ? <p role="status">Loading bets and selections…</p> : error ? <p role="alert">{error} <button className="btn btn-ghost" onClick={() => setAttempt(n => n + 1)}>Retry</button></p> : filtered.length === 0 ? <div className="empty">No bets match these filters.</div> : <>
      <p className="hint">{filtered.length} placed bets · {query.from} to {query.to}</p>
      {filtered.slice(page * 20, (page + 1) * 20).map(row => <article className="bet-card" key={row.id} style={{ border: '1px solid var(--ink-3)', background: 'var(--surface)', boxShadow: 'var(--shadow)', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span className={`tag ${outcome(row) === 'Lost' ? 'bad' : outcome(row) === 'Settled with return' ? 'good' : 'accent'}`}>{outcome(row)}</span><strong>{row.system || (row.selections.length === 1 ? 'Single' : 'Multiple')} · {row.selections.length} selections</strong><span className="hint num">#{row.id} · {row.placedAt.replace('T', ' ')}</span></div>
        <div className="legs">{row.selections.map((selection, index) => <Selection key={index} row={selection} />)}</div>
        <div className="kv"><span>Stake {amount(row.stake)}</span><strong>{row.final === 1 ? `Payout ${amount(row.payout)}` : `Max. payout ${amount(row.maxPayout)}`}</strong></div>
        {(row.refund ?? 0) > 0 && <div className="kv"><span>Refund</span><strong>{amount(row.refund)}</strong></div>}
        {(row.bonus ?? 0) > 0 && <div className="kv"><span>Bonus</span><strong>{amount(row.bonus)}</strong></div>}
      </article>)}
      <nav aria-label="Bets2 pages" className="row-actions"><button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(n => n - 1)}>Previous</button><span>Page {page + 1} of {pages}</span><button className="btn btn-ghost" disabled={page + 1 >= pages} onClick={() => setPage(n => n + 1)}>Next</button></nav>
    </>}
  </AccountFrame>;
}
