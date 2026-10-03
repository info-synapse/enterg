import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import type { Limit, LimitPeriod } from '@/api/types';
import { Icon } from '@/components/Icon';
import { dateTime, money } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/state/AuthContext';
import { AccountFrame } from './AccountFrame';

const META: Record<Limit['kind'], { title: string; label: string; unit: 'eur' | 'hours'; presets: number[]; note: string }> = {
  deposit: { title: 'Deposit limit', label: 'Most you can deposit', unit: 'eur', presets: [50, 100, 250, 500, 1000], note: 'Applies to all payment methods.' },
  loss: { title: 'Loss limit', label: 'Most you can lose', unit: 'eur', presets: [50, 100, 250, 500, 1000], note: 'Net losses across sports, casino and virtuals.' },
  time: { title: 'Time limit', label: 'Most time you can play', unit: 'hours', presets: [1, 2, 4, 6, 8], note: 'Counts time in slots, live casino and virtual sports. Sports betting is not included.' },
};
const PERIODS: LimitPeriod[] = ['daily', 'weekly', 'monthly'];
const fmt = (kind: Limit['kind'], v: number) => (META[kind].unit === 'eur' ? money(v) : `${v} hours`);

function LimitCard({ limit, onSaved }: { limit: Limit; onSaved: (l: Limit) => void }) {
  const meta = META[limit.kind];
  const [edit, setEdit] = useState(false);
  const [period, setPeriod] = useState<LimitPeriod>(limit.period);
  const [value, setValue] = useState(limit.value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const save = async () => {
    if (value <= 0) return setError('Enter a limit greater than zero.');
    setBusy(true);
    setError(undefined);
    try {
      onSaved(await api.account.setLimit(limit.kind, period, value));
      setEdit(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3>{meta.title}</h3>
        <span className="hint" style={{ marginLeft: 'auto' }}>Set {dateTime(limit.setAt)}</span>
      </div>
      {!edit ? (
        <>
          <div className="kv"><span>{meta.label} ({limit.period})</span><strong>{fmt(limit.kind, limit.value)}</strong></div>
          {limit.pending && <div className="alert warn">Increase to {fmt(limit.kind, limit.pending.value)} takes effect on {dateTime(limit.pending.effectiveAt)}.</div>}
          <p className="hint">{meta.note}</p>
          <button className="btn btn-ghost" onClick={() => setEdit(true)}>Change limit</button>
        </>
      ) : (
        <>
          <div className="field">
            <label htmlFor={`period-${limit.kind}`}>Period</label>
            <select id={`period-${limit.kind}`} className="select" value={period} onChange={(e) => setPeriod(e.target.value as LimitPeriod)}>
              {PERIODS.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`value-${limit.kind}`}>{meta.label} {meta.unit === 'eur' ? '(€)' : '(hours)'}</label>
            <input id={`value-${limit.kind}`} className="input num" inputMode="decimal" value={value || ''} onChange={(e) => setValue(Number(e.target.value) || 0)} />
            <div className="chips">{meta.presets.map((p) => <button key={p} className={`chip ${value === p ? 'active' : ''}`} onClick={() => setValue(p)}>{fmt(limit.kind, p)}</button>)}</div>
          </div>
          <p className="hint">Lower limits apply straight away. Higher limits apply after a 24-hour cooling-off period.</p>
          {error && <div className="alert" role="alert">{error}</div>}
          <div className="row-actions">
            <button className="btn btn-ghost" onClick={() => { setEdit(false); setValue(limit.value); setPeriod(limit.period); }}>Cancel</button>
            <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save limit'}</button>
          </div>
        </>
      )}
    </div>
  );
}

function Accordion({ icon, title, children, defaultOpen }: { icon: string; title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={`accordion ${open ? 'open' : ''}`}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}><Icon name={icon} />{title}<Icon name="chevronDown" /></button>
      {open && <div className="acc-body">{children}</div>}
    </div>
  );
}

function BlockAction({ kind }: { kind: 'break' | 'exclude' }) {
  const options = kind === 'break' ? [1, 7, 30] : [6, 12, 24];
  const unit = kind === 'break' ? 'day' : 'month';
  const [choice, setChoice] = useState<number | null>(null);
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState<string>();
  const { logout } = useAuth();
  const nav = useNavigate();
  const word = kind === 'break' ? 'BREAK' : 'EXCLUDE';
  const run = async () => {
    if (!choice) return;
    const r = kind === 'break' ? await api.account.takeBreak(choice) : await api.account.selfExclude(choice);
    setDone(`Your account is closed until ${dateTime(r.until)}. You'll be logged out now.`);
    setTimeout(() => { logout(); nav('/'); }, 2500);
  };
  if (done) return <div className="alert good" role="status">{done}</div>;
  return (
    <>
      <p className="hint">
        {kind === 'break'
          ? 'Lock your account for a short time. You can’t bet, play or deposit until the break ends, and it can’t be cancelled early.'
          : 'Close your account for at least 6 months. You can’t reopen it during this time. We also stop sending you marketing.'}
      </p>
      <div className="chips">
        {options.map((o) => <button key={o} className={`chip ${choice === o ? 'active' : ''}`} onClick={() => setChoice(o)}>{o} {unit}{o > 1 ? 's' : ''}</button>)}
      </div>
      {choice && (
        <>
          <div className="field">
            <label htmlFor={`confirm-${kind}`}>Type {word} to confirm</label>
            <input id={`confirm-${kind}`} className="input" value={confirm} onChange={(e) => setConfirm(e.target.value.toUpperCase())} />
          </div>
          <button className="btn btn-danger" disabled={confirm !== word} onClick={run}>{kind === 'break' ? `Take a ${choice}-${unit} break` : `Exclude myself for ${choice} months`}</button>
        </>
      )}
    </>
  );
}

export function Protection() {
  const { data, setData } = useAsync(() => api.account.getLimits(), []);
  const order: Limit['kind'][] = ['deposit', 'loss', 'time'];
  return (
    <AccountFrame>
      <h1 className="page-title">Limits and safer play</h1>
      <p className="hint">Set limits that fit your budget and your time. If gambling stops being fun, the help line is free and confidential: <strong>1114</strong>.</p>
      <Accordion icon="shield" title="Betting limits" defaultOpen>
        {data ? (
          <div className="limit-grid">
            {order.map((k) => {
              const l = data.find((x) => x.kind === k) ?? { kind: k, period: 'daily' as const, value: 0, setAt: new Date().toISOString() };
              return <LimitCard key={k} limit={l} onSaved={(n) => setData((d) => (d ?? []).filter((x) => x.kind !== k).concat(n))} />;
            })}
          </div>
        ) : <div className="skeleton" style={{ height: 200 }} />}
      </Accordion>
      <Accordion icon="transfer" title="Cancel a withdrawal request">
        <p className="hint">Changed your mind? Pending withdrawals can be cancelled from the Withdraw page until they are processed.</p>
        <Link to="/account/withdraw" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>Go to withdrawals</Link>
      </Accordion>
      <Accordion icon="history" title="Take a break"><BlockAction kind="break" /></Accordion>
      <Accordion icon="close" title="Self-exclusion"><BlockAction kind="exclude" /></Accordion>
    </AccountFrame>
  );
}
