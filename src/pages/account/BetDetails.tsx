import { useEffect, useState } from 'react';
import { api } from '@/api';
import type { BetDetailRow, BetsDesktopRow } from '@/api/types';

const amount = (v: number | null) => v === null ? '—' : v.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function date(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/.exec(value);
  return m ? `${m[3]}/${m[2]} ${m[4]}` : value || '—';
}
function odds(value: number | null) {
  if (value === null || value <= 1) return '—';
  const american = Math.round(value >= 2 ? (value - 1) * 100 : -100 / (value - 1));
  return american > 0 ? `+${american}` : String(american);
}
function Status({ row }: { row: BetDetailRow }) {
  const won = row.final === 1 && row.hit === 1, lost = row.final === 1 && row.hit === 0, pending = row.final === 0 && row.hit === 0;
  const label = won ? 'Won' : lost ? 'Lost' : pending ? 'Pending' : 'Unknown';
  return <span role="img" aria-label={label} title={label} style={{ display: 'inline-block', width: 22, borderRadius: 3, fontWeight: 700, color: '#fff', background: won ? '#4e9b41' : lost ? '#ed2f2f' : pending ? '#7C7474' : '#555' }}>{won ? '✓' : lost ? '✗' : '?'}</span>;
}
function Sport({ row }: { row: BetDetailRow }) {
  const [failed, setFailed] = useState(false);
  return row.sportImage && !failed ? <img src={row.sportImage} alt={row.sport || 'Sport'} title={row.sport} width={15} height={15} referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : <span title={row.sport || 'Sport unavailable'}>{row.sport || '—'}</span>;
}
function selection(row: BetDetailRow) {
  if (!row.selection) return (row.forecastCode ?? 0) < 0 ? 'Selection name pending' : '—';
  const suffix = `(${row.parameter})`;
  return row.parameter && !row.selection.trimEnd().endsWith(suffix) ? `${row.selection} ${suffix}` : row.selection;
}
export function BetDetails({ row }: { row: BetsDesktopRow }) {
  const [rows, setRows] = useState<BetDetailRow[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0), [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 35000);
    setLoading(true); setError(''); setRows([]); setPage(0);
    // StrictMode replays setup/cleanup before this task runs. Cancel that first
    // setup before it can send a request, while preserving real unmount aborts.
    const start = window.setTimeout(() => {
      api.account.getBetDetails(row.id, controller.signal).then(data => { if (active) setRows(data); })
      .catch(() => { if (active) setError('Could not load coupon details. Retry, or reload your bet history.'); })
      .finally(() => { window.clearTimeout(timer); if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(start); controller.abort(); window.clearTimeout(timer); };
  }, [row.id, attempt]);
  const summary = [['Coupon ID', row.id], ['Payout', amount(row.payout)], ['Result', row.final === 1 ? 'Final' : row.final === 0 ? 'Not final' : 'Unknown'], ['Tax on win', amount(row.tax)], ['Date/time', row.placedAt || '—'], ['Maximum tax on win', amount(row.maxTax)], ['Stake', amount(row.stake)], ['Bonus factor', row.bonusFactor ?? '—'], ['Odds', amount(row.odds)], ['Bonus', amount(row.bonus)]];
  const pages = Math.max(1, Math.ceil(rows.length / 33));
  return <section className="coupon-details" aria-label={`Coupon ${row.id} details`}>
    <dl className="coupon-summary">{summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {loading ? <p role="status">Loading coupon details…</p> : error ? <p role="alert">{error} <button className="btn btn-ghost" onClick={() => setAttempt(n => n + 1)}>Retry</button></p> : rows.length === 0 ? <p>No selections returned for this coupon.</p> : <>
      <table className="coupon-selections"><thead><tr>{['№', 'Sport', 'Tournament', 'Time', 'Home team', 'Away team', 'Market', 'Selection', 'Odds (US)', 'Outcome', 'Live', 'Result', 'Group'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{rows.slice(page * 33, (page + 1) * 33).map((detail, index) => <tr key={page * 33 + index}>
          <td>{page * 33 + index + 1}</td><td><Sport row={detail} /></td><td>{detail.tournament || '—'}</td><td title={detail.startsAt} style={{ whiteSpace: 'nowrap' }}>{date(detail.startsAt)}</td>
          <td title={detail.home}>{detail.home || '—'}</td><td title={detail.away}>{detail.away || '—'}</td><td title={detail.market}>{detail.market || '—'}</td><td>{selection(detail)}</td>
          <td title={`Decimal odds: ${amount(detail.odds)}`}>{odds(detail.odds)}{detail.odds !== null && ` (${amount(detail.odds)})`}</td><td><Status row={detail} /></td>
          <td><span role="img" aria-label={detail.betType === 2 ? 'Live' : detail.betType === 1 ? 'Prematch' : 'Unknown'}>{detail.betType === 2 ? '✓' : detail.betType === 1 ? '—' : '?'}</span></td><td>{detail.result || '—'}</td><td>{detail.group || '—'}</td>
        </tr>)}</tbody>
      </table>
      {pages > 1 && <nav aria-label={`Coupon ${row.id} selection pages`}><button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(n => n - 1)}>Previous</button> Page {page + 1} of {pages} <button className="btn btn-ghost" disabled={page + 1 >= pages} onClick={() => setPage(n => n + 1)}>Next</button></nav>}
    </>}
  </section>;
}
