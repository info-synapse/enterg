import { Fragment, useEffect, useState, type FormEvent } from 'react';
import { api } from '@/api';
import type { BetsDesktopQuery, BetsDesktopRow } from '@/api/types';
import { HTTP_AUTH_MODE } from '@/api/mode';
import { useAuth } from '@/state/AuthContext';
import { AccountFrame } from './AccountFrame';
import { BetDetails } from './BetDetails';
import './BetsPro.css';

const dateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function initial(): BetsDesktopQuery {
  const today = new Date(), from = new Date(today);
  from.setDate(1); from.setFullYear(from.getFullYear() - 10);
  const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  from.setDate(Math.min(today.getDate(), lastDay));
  return { from: dateInput(from), to: dateInput(today) };
}
const numeric = new Intl.NumberFormat('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const number = (n: number | null) => n === null ? '—' : numeric.format(n);
function timestamp(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]} ${match[4]}` : value || '—';
}
function Flag({ value, yes = 1, no = 0 }: { value: number | null; yes?: number; no?: number }) {
  const label = value === yes ? 'Yes' : value === no ? 'No' : 'Unknown';
  return <span role="img" aria-label={label} title={label}>{value === yes ? '✓' : value === no ? '—' : '?'}</span>;
}
function Outcome({ row }: { row: BetsDesktopRow }) {
  const won = row.final === 1 && ((row.payout ?? 0) > 0 || (row.refund ?? 0) > 0);
  const lost = row.final === 1 && row.payout === 0 && row.refund === 0;
  const pending = row.final === 0;
  const label = won ? 'Settled with payout or refund' : lost ? 'Lost' : pending ? 'Pending' : 'Unknown';
  return <span role="img" aria-label={label} title={label} style={{ display: 'inline-block', width: 22, textAlign: 'center', fontWeight: 700, color: '#fff', borderRadius: 3, background: won ? '#4e9b41' : lost ? '#ed2f2f' : pending ? '#7C7474' : '#555' }}>{won ? '✓' : lost ? '✗' : '?'}</span>;
}

export function BetsPro() {
  const { player, restoring } = useAuth();
  const [draft, setDraft] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const [rows, setRows] = useState<BetsDesktopRow[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setRows([]); setError(''); setPage(0); setExpanded(new Set());
    if (!player || restoring) { setLoading(false); return; }
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 35000);
    setLoading(true);
    api.account.getBetsDesktop(query, controller.signal).then(data => { if (active) setRows(data); })
      .catch(() => { if (active) setError('Could not load bets. Please retry, or log in again if your session has expired.'); })
      .finally(() => { window.clearTimeout(timer); if (active) setLoading(false); });
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [player, restoring, query, attempt]);
  function apply(e: FormEvent) {
    e.preventDefault();
    if (draft.from > draft.to) { setError('From must be on or before To.'); return; }
    setQuery({ ...draft });
  }
  if (!player || restoring) return <AccountFrame showSidebar={false}><p>Checking your account…</p></AccountFrame>;
  const total = rows.every(row => row.stake !== null) ? rows.reduce((sum, row) => sum + row.stake!, 0) : null;
  const pages = Math.max(1, Math.ceil(rows.length / 50));
  const content = <>
    <h1 className="page-title">Bets Pro/VIP</h1>
    <form className="card" onSubmit={apply} style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'end' }}>
      <label>From<input className="input" type="date" required value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
      <label>To<input className="input" type="date" required min={draft.from} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
      <button className="btn btn-primary" type="submit" disabled={loading}>Apply filters</button>
    </form>
    {!HTTP_AUTH_MODE && <p className="hint">Demo mode: no bet-history records are loaded.</p>}
    <p className="hint">Placed bets · {query.from} to {query.to}</p>
    {loading ? <p role="status">Loading bets…</p> : error ? <div role="alert">{error} <button className="btn btn-ghost" onClick={() => setAttempt(n => n + 1)}>Retry</button></div> : rows.length === 0 ? <div className="empty">No bets match this date range.</div> : <>
      {rows.length === 5000 && <p role="status">The report reached its 5,000-record limit. Narrow the date range to see all matching bets.</p>}
      <div style={{ overflowX: 'auto' }}><table className="table bets-pro" style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse' }}>
        <thead><tr>{['Details', 'Date/Time', 'Stake', 'System', 'Lines', 'Max. payout', 'Payout', 'Final', 'Outcome', 'Refund', 'Live', 'Bonus', 'Bonus factor', 'Safe bet'].map(label => <th key={label} scope="col" style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>{label}</th>)}</tr></thead>
        <tbody>{rows.slice(page * 50, (page + 1) * 50).map(row => <Fragment key={row.id}><tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td><button className="btn btn-ghost" aria-expanded={expanded.has(row.id)} aria-controls={`coupon-${row.id}`} aria-label={`${expanded.has(row.id) ? 'Collapse' : 'Expand'} coupon ${row.id}`} onClick={() => setExpanded(current => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; })}>{expanded.has(row.id) ? '▾' : '▸'}</button></td>
          <td title={row.placedAt} style={{ whiteSpace: 'nowrap' }}>{timestamp(row.placedAt)}</td>
          <td>{number(row.stake)}</td><td>{row.system || '—'}</td><td>{row.lines ?? '—'}</td><td>{number(row.maxPayout)}</td>
          <td style={{ color: (row.payout ?? 0) > 0 ? '#008000' : undefined }}>{row.payout === 0 ? '' : number(row.payout)}</td>
          <td><Flag value={row.final} /></td><td><Outcome row={row} /></td><td>{row.refund === 0 ? '' : number(row.refund)}</td>
          <td><Flag value={row.betType} yes={2} no={1} /></td><td>{row.bonus === 0 ? '' : number(row.bonus)}</td><td>{row.bonusFactor === null ? '—' : row.bonusFactor.toFixed(3)}</td><td><Flag value={row.safeBet} /></td>
        </tr>{expanded.has(row.id) && <tr><td colSpan={14} id={`coupon-${row.id}`}><BetDetails row={row} /></td></tr>}</Fragment>)}</tbody>
        <tfoot><tr><th scope="row" colSpan={2} style={{ padding: '12px 8px' }}>Total stake (loaded bets)</th><td>{number(total)}</td><td colSpan={11}>{rows.length.toLocaleString()} bets</td></tr></tfoot>
      </table></div>
      <nav aria-label="Bet history pages" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(n => n - 1)}>Previous</button>
        <span>Page {page + 1} of {pages}</span><button className="btn btn-ghost" disabled={page + 1 >= pages} onClick={() => setPage(n => n + 1)}>Next</button>
      </nav>
    </>}
  </>;
  return <AccountFrame showSidebar={false}>{content}</AccountFrame>;
}
