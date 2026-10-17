import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/api';
import type { DepositHistoryQuery, DepositHistoryRow } from '@/api/types';
import { HTTP_AUTH_MODE } from '@/api/mode';
import { useAuth } from '@/state/AuthContext';
import { AccountFrame } from './AccountFrame';
import { Icon } from '@/components/Icon';
import { DepositPaymentMethod } from '@/components/DepositPaymentMethod';

const dateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function initial(): DepositHistoryQuery {
  const today = new Date(), from = new Date(today); from.setDate(1); from.setFullYear(from.getFullYear() - 10);
  const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  from.setDate(Math.min(today.getDate(), lastDay));
  return { from: dateInput(from), to: dateInput(today), status: 'all' };
}
const timestamp = (value: string) => value ? value.replace('T', ' ') : '—';
const amountOnly = new Intl.NumberFormat('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function DepositStatus({ status, text }: { status: number; text: string }) {
  const label = status === 1 ? 'Processed' : status === 0 ? 'Pending' : status === 2 ? 'Rejected' : text || `Status ${status}`;
  const icon = status === 1 ? 'check' : status === 0 ? 'clock' : status === 2 ? 'close' : 'info';
  const color = status === 1 ? '#18733c' : status === 0 ? '#996000' : status === 2 ? '#bb2525' : '#555';
  return <span role="img" aria-label={label} title={label} style={{ display: 'inline-flex', color, background: '#fff', padding: 4, borderRadius: '50%' }}><Icon name={icon} size={22} strokeWidth={2.5} /></span>;
}

export function Deposits() {
  const { player, restoring } = useAuth();
  const [draft, setDraft] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const [rows, setRows] = useState<DepositHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setRows([]); setError('');
    if (!player || restoring) return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    api.account.getDeposits(query, controller.signal).then(data => { if (active) setRows(data); })
      .catch(() => { if (active) setError('Could not load deposits. Please retry, or log in again if your session has expired.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [player, restoring, query, attempt]);
  function apply(e: FormEvent) {
    e.preventDefault();
    if (draft.from > draft.to) { setError('From must be on or before To.'); return; }
    setQuery({ ...draft });
  }
  if (!player || restoring) return <AccountFrame><p>Checking your account…</p></AccountFrame>;
  const content = <>
    <h1 className="page-title">Deposits</h1>
    <form className="card" onSubmit={apply} style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'end' }}>
      <label>From<input className="input" type="date" required value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
      <label>To<input className="input" type="date" required min={draft.from} value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
      <fieldset style={{ border: 0, padding: 0, display: 'flex', gap: 12 }}><legend>Status</legend>
        {(['processed', 'pending', 'all'] as const).map(status => <label key={status}><input type="radio" name="deposit-status" value={status} checked={draft.status === status} onChange={() => setDraft({ ...draft, status })} /> {status === 'processed' ? 'Processed' : status === 'pending' ? 'Pending' : 'All'}</label>)}
      </fieldset>
      <button className="btn btn-primary" type="submit" disabled={loading}>Apply filters</button>
    </form>
    {!HTTP_AUTH_MODE && <p className="hint">Demo mode: no deposit-history records are loaded.</p>}
    <p className="hint">Showing {query.from} to {query.to} · {query.status === 'all' ? 'All' : query.status === 'pending' ? 'Pending' : 'Processed'}</p>
    {loading ? <p role="status">Loading deposits…</p> : error ? <div role="alert">{error} <button className="btn btn-ghost" onClick={() => setAttempt(n => n + 1)}>Retry</button></div> : rows.length === 0 ? <div className="empty">No deposits match these filters.</div> : <>
      {rows.length === 5000 && <p role="status">The report reached its 5,000-record limit. Narrow the date range to see all matching deposits.</p>}
      <div style={{ overflowX: 'auto' }}><table className="table" style={{ width: '100%' }}>
        <thead><tr><th scope="col">Date</th><th scope="col" style={{ textAlign: 'right' }}>Amount</th><th scope="col" style={{ textAlign: 'center' }}>Transaction ID</th><th scope="col">Status</th><th scope="col">Processed date</th><th scope="col">Payment method</th></tr></thead>
        <tbody>{rows.map((row, i) => <tr key={`${row.transactionId}-${i}`}>
          <td style={{ whiteSpace: 'nowrap' }}>{timestamp(row.createdAt)}</td><td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{amountOnly.format(row.amount)}</td>
          <td style={{ overflowWrap: 'anywhere', textAlign: 'center' }}>{row.transactionId || '—'}</td>
          <td><DepositStatus status={row.status} text={row.statusText} /></td>
          <td style={{ whiteSpace: 'nowrap' }}>{timestamp(row.processedAt)}</td><td style={{ overflowWrap: 'anywhere' }}><DepositPaymentMethod method={row.paymentMethod} /></td>
        </tr>)}</tbody>
      </table></div>
    </>}
  </>;
  return <AccountFrame>{content}</AccountFrame>;
}
