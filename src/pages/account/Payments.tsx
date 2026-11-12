import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import { mockApi } from '@/api/mock';
import { LOGIN_TEST_MODE } from '@/api/mode';
import type { PaymentMethod, PaymentResult } from '@/api/types';
import { Icon } from '@/components/Icon';
import { dateTime, money } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/state/AuthContext';
import { AccountFrame } from './AccountFrame';

const GROUP_LABEL: Record<PaymentMethod['group'], string> = { bank: 'Bank and cards', wallet: 'Wallets', cash: 'Cash' };

const short = (m: PaymentMethod) =>
  m.name.match(/Visa|Apple|Google|PayPal|Skrill|IRIS|Paysafe/)?.[0].toUpperCase().slice(0, 6) ?? m.name.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase();

export function MethodList({ methods, base, disabled = LOGIN_TEST_MODE }: { methods: PaymentMethod[]; base: string; disabled?: boolean }) {
  const groups = (['bank', 'wallet', 'cash'] as const).filter((g) => methods.some((m) => m.group === g));
  return (
    <>
      {groups.map((g) => (
        <div key={g} className="card" style={{ paddingBlock: 12 }}>
          <div className="group-title">{GROUP_LABEL[g]}</div>
          <div className="list">
            {methods.filter((m) => m.group === g).map((m) => disabled ? (
              <div key={m.id} className="list-row">
                <span className="method-icon">{short(m)}</span>
                <span className="main-col"><span className="t">{m.name}</span><br /><span className="s">{m.speed} · {money(m.min)} – {money(m.max)}</span></span>
              </div>
            ) : (
              <Link key={m.id} to={`${base}/${m.id}`} className="list-row">
                <span className="method-icon">{short(m)}</span>
                <span className="main-col"><span className="t">{m.name}</span><br /><span className="s">{m.speed} · {money(m.min)} – {money(m.max)}</span></span>
                <Icon name="chevronRight" size={16} />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// The external widget posts the deposit to its own backend and then fires
//   document.dispatchEvent(new CustomEvent('sas_placement1092.deposit-success', { detail: result }))
// (result.code == 0). The money has already moved, so this only refreshes the balance and
// navigates (in-app, no reload) to the same success screen PaymentForm shows.
// The event is listened for on `document` because that is where it is dispatched and it does
// not bubble up to `window`.
const SUCCESS_EVENT = 'sas_placement1092.deposit-success';
const DEPOSIT_METHOD = 'card';

// Injects the external EnterG Pay widget. <script> tags rendered by React never execute,
// so the script element is created and appended by hand, then removed on unmount.
export function PayWidget() {
  const nav = useNavigate();
  const { refreshBalance } = useAuth();

  useEffect(() => {
    const onSuccess = (e: Event) => {
      const d = ((e as CustomEvent).detail ?? {}) as Record<string, unknown>;
      const result: PaymentResult = {
        status: 'success',
        transactionId: String(d.transactionId ?? d.transaction_id ?? d.id ?? d.reference ?? '—'),
        message: String(d.message ?? d.description ?? 'Your deposit was successful.'),
      };
      void refreshBalance();
      nav(`/account/deposit/${DEPOSIT_METHOD}`, { state: { result } });
    };
    document.addEventListener(SUCCESS_EVENT, onSuccess);

    const s = document.createElement('script');
    s.src = 'https://pos.entergaming.im/egpay/DWAD/PLACEMENT_ID=1092?lang=en';
    s.async = true;
    document.body.appendChild(s);
    return () => {
      s.remove();
      document.getElementById('sas_placement1092')?.replaceChildren();
      document.removeEventListener(SUCCESS_EVENT, onSuccess);
    };
  }, [nav, refreshBalance]);
  return <div id="sas_placement1092" />;
}

export function Deposit() {
  const { data, error, reload } = useAsync(() => mockApi.payments.getDepositMethods(), []);
  return (
    <AccountFrame>
      <h1 className="page-title">Deposit</h1>
      <p className="hint">Demo deposits use sample data. Pick how you want to pay.</p>
      {error ? <p role="alert">{error} <button className="btn btn-ghost" onClick={reload}>Retry</button></p> : data ? <MethodList methods={data} base="/account/deposit" disabled={false} /> : <div className="skeleton" style={{ height: 300 }} />}
    </AccountFrame>
  );
}

export function Withdraw() {
  const { data } = useAsync(() => api.payments.getWithdrawalMethods(), []);
  const { balance } = useAuth();
  const tx = useAsync(() => api.account.getTransactions({ type: 'withdrawal' }), []);
  const pending = (tx.data ?? []).filter((t) => t.status === 'pending');
  const [msg, setMsg] = useState<string>();
  const { refreshBalance } = useAuth();
  const cancel = async (id: string) => {
    try {
      const r = await api.payments.cancelWithdrawal(id);
      setMsg(r.message);
      tx.reload();
      refreshBalance();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  return (
    <AccountFrame>
      <h1 className="page-title">Withdraw</h1>
      {balance && <div className="alert info">You can withdraw up to <strong>{money(balance.withdrawable, balance.currency)}</strong>. Bonus money of {money(balance.bonus)} can't be withdrawn until wagering is complete.</div>}
      {pending.length > 0 && (
        <div className="card">
          <h3>Pending withdrawals</h3>
          {msg && <div className="alert good" role="status">{msg}</div>}
          <div className="list">
            {pending.map((t) => (
              <div key={t.id} className="list-row">
                <span className="main-col"><span className="t num">{money(-t.amount)}</span><br /><span className="s">{t.method} · {dateTime(t.createdAt)}</span></span>
                <button className="btn btn-ghost btn-sm" onClick={() => cancel(t.id)}>Cancel withdrawal</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="hint">Only methods you have used before are listed, so the money goes back to an account in your name.</p>
      {data ? <MethodList methods={data} base="/account/withdraw" /> : <div className="skeleton" style={{ height: 240 }} />}
    </AccountFrame>
  );
}

export function PaymentForm({ kind }: { kind: 'deposit' | 'withdraw' }) {
  const { methodId = '' } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { refreshBalance, balance } = useAuth();
  const methods = useAsync(() => (kind === 'deposit' ? mockApi.payments.getDepositMethods() : api.payments.getWithdrawalMethods()), [kind]);
  const limits = useAsync(() => (kind === 'deposit' ? mockApi : api).account.getLimits(), [kind]);
  const m = methods.data?.find((x) => x.id === methodId);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<PaymentResult | undefined>((location.state as { result?: PaymentResult } | null)?.result);
  const base = kind === 'deposit' ? '/account/deposit' : '/account/withdraw';
  const depositLimit = limits.data?.find((l) => l.kind === 'deposit');

  const submit = async () => {
    if (!m) return;
    setBusy(true);
    setError(undefined);
    try {
      const r = kind === 'deposit' ? await mockApi.payments.deposit(m.id, amount) : await api.payments.withdraw(m.id, amount);
      setResult(r);
      if (kind !== 'deposit' || !LOGIN_TEST_MODE) void refreshBalance();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (LOGIN_TEST_MODE && kind !== 'deposit') return <AccountFrame><p>Payments are not connected in mixed mode.</p><Link to={base}>Back to methods</Link></AccountFrame>;
  if (!m) return <AccountFrame><div className="skeleton" style={{ height: 320 }} /></AccountFrame>;
  const valid = amount >= m.min && amount <= m.max && (kind === 'deposit' || amount <= (balance?.withdrawable ?? 0));

  return (
    <AccountFrame>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link to={base} className="icon-btn" aria-label="Back to methods"><Icon name="chevronLeft" /></Link>
        <h1 className="page-title">{kind === 'deposit' ? 'Deposit' : 'Withdraw'} · {m.name}</h1>
      </nav>
      {result ? (
        <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <span style={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-text)' }}><Icon name="check" size={28} /></span>
          <h2>{result.status === 'success' ? (kind === 'deposit' ? 'Deposit complete' : 'Done') : 'Withdrawal requested'}</h2>
          <p className="hint">{result.message}</p>
          <p className="hint num">Reference {result.transactionId}</p>
          <div className="row-actions" style={{ width: '100%', maxWidth: 360 }}>
            <button className="btn btn-ghost" onClick={() => nav('/account/transactions')}>View transactions</button>
            <button className="btn btn-primary" onClick={() => nav('/')}>Go to sports</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="kv"><span>{m.speed}</span><span>Limits {money(m.min)} – {money(m.max)}</span></div>
          <div className="amount-display">
            <span>€</span>
            <label htmlFor="pay-amount" className="sr-only">Amount in euro</label>
            <input id="pay-amount" inputMode="decimal" value={amount ? String(amount) : ''} placeholder="0" onChange={(e) => setAmount(Number(e.target.value.replace(',', '.')) || 0)} />
          </div>
          <div className="quick">
            {m.quickAmounts.map((q) => <button key={q} className={amount === q ? 'active' : ''} onClick={() => setAmount(q)}>{money(q)}</button>)}
          </div>
          {m.savedInstrument && (
            <div className="list-row" style={{ borderTop: 0, background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 12 }}>
              <span className="method-icon">{short(m)}</span>
              <span className="main-col"><span className="t">{m.savedInstrument}</span><br /><span className="s">Saved {kind === 'deposit' ? 'card' : 'account'}</span></span>
              <Icon name="check" size={18} />
            </div>
          )}
          {kind === 'deposit' && depositLimit && <p className="hint">Your {depositLimit.period} deposit limit is {money(depositLimit.value)}.</p>}
          {kind === 'withdraw' && balance && <p className="hint">Available to withdraw: {money(balance.withdrawable)}</p>}
          {error && <div className="alert" role="alert">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={!valid || busy} onClick={submit}>
            {busy ? 'Processing…' : `${kind === 'deposit' ? 'Deposit' : 'Withdraw'} ${amount ? money(amount) : ''}`}
          </button>
          <p className="hint" style={{ textAlign: 'center' }}>Payments are encrypted and processed by a licensed payment provider.</p>
        </div>
      )}
    </AccountFrame>
  );
}
