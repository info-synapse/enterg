import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api';
import { BackendProfile } from './BackendProfile';
import { HTTP_AUTH_MODE, LOGIN_TEST_MODE } from '@/api/mode';
import type { Bet, Transaction } from '@/api/types';
import { Icon } from '@/components/Icon';
import { OpenBetCard } from '@/components/BetCards';
import { dateTime, money, odds as fmtOdds, shortDate } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/state/AuthContext';
import { AccountFrame, BalanceCard } from './AccountFrame';

const TX_LABEL: Record<Transaction['type'], string> = { deposit: 'Deposit', withdrawal: 'Withdrawal', bet: 'Bet placed', win: 'Winnings', bonus: 'Bonus', refund: 'Refund' };
const STATUS_TAG: Record<Transaction['status'], string> = { completed: 'good', pending: 'accent', cancelled: '', failed: 'bad' };

export function Overview() {
  const { player } = useAuth();
  const tx = useAsync(() => api.account.getTransactions({}), []);
  const bets = useAsync(() => api.sportsbook.getBets('open'), []);
  if (LOGIN_TEST_MODE) return <AccountFrame>{null}</AccountFrame>;
  if (!player) return null;
  return (
    <AccountFrame>
      <h1 className="page-title">Hello, {player.firstName}</h1>
      <div className="show-mobile"><BalanceCard /></div>
      {player.kycStatus !== 'verified' && (
        <div className="alert warn" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="shield" size={18} />
          <span>Verify your identity to withdraw. It takes about 2 minutes with your ID card.</span>
          <Link to="/account/profile" className="link" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>Verify now</Link>
        </div>
      )}
      <div className="grid-2">
        <Link to="/account/protection" className="card" style={{ flexDirection: 'row', alignItems: 'center' }}><Icon name="shield" /><span className="main-col"><strong>Limits and safer play</strong><br /><span className="hint">Deposit, loss and time limits</span></span></Link>
        <Link to="/account/profile" className="card" style={{ flexDirection: 'row', alignItems: 'center' }}><Icon name="user" /><span><strong>Personal details</strong><br /><span className="hint">Contact details and verification</span></span></Link>
      </div>
      <div className="card">
        <div className="section-head"><h2>Open bets</h2><Link className="more" to="/account/bets">All bets</Link></div>
        {bets.loading ? <div className="skeleton" style={{ height: 80 }} /> : bets.data?.length ? bets.data.slice(0, 2).map((b) => <BetCard key={b.id} bet={b} />) : <div className="empty">No open bets. <Link to="/" className="link">Browse sports</Link></div>}
      </div>
      <div className="card">
        <div className="section-head"><h2>Recent activity</h2><Link className="more" to="/account/transactions">All transactions</Link></div>
        <div className="list">{tx.data?.slice(0, 4).map((t) => <TxRow key={t.id} t={t} />)}</div>
      </div>
    </AccountFrame>
  );
}

function TxRow({ t }: { t: Transaction }) {
  return (
    <div className="list-row">
      <span className="method-icon"><Icon name={t.type === 'deposit' ? 'wallet' : t.type === 'withdrawal' ? 'transfer' : t.type === 'bet' ? 'bets' : 'star'} size={16} /></span>
      <span className="main-col"><span className="t">{TX_LABEL[t.type]}</span><br /><span className="s">{dateTime(t.createdAt)}{t.method ? ` · ${t.method}` : ''}</span></span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span className="amt" style={{ color: t.amount > 0 ? 'var(--good)' : 'var(--ink)' }}>{t.amount > 0 ? '+' : ''}{money(t.amount)}</span>
        {t.status !== 'completed' && <span className={`tag ${STATUS_TAG[t.status]}`}>{t.status}</span>}
      </span>
    </div>
  );
}

const BET_STATUS: Record<Bet['status'], { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'accent' }, won: { label: 'Won', cls: 'good' }, lost: { label: 'Lost', cls: 'bad' }, cashed_out: { label: 'Cashed out', cls: 'good' }, void: { label: 'Void', cls: '' },
};

function BetCard({ bet }: { bet: Bet }) {
  const st = BET_STATUS[bet.status];
  return (
    <div className="bet-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`tag ${st.cls}`}>{st.label}</span>
        <strong style={{ fontSize: 'var(--fs-sm)' }}>{bet.kind === 'combo' ? `Combo · ${bet.legs.length} selections` : 'Single'}</strong>
        <span className="hint num" style={{ marginLeft: 'auto' }}>{bet.id} · {shortDate(bet.placedAt)}</span>
      </div>
      <div className="legs">
        {bet.legs.map((l) => (
          <div key={l.selectionId} className="leg"><span><strong>{l.label}</strong> · {l.marketName}<br /><span className="hint">{l.eventName}</span></span><span className="o">{fmtOdds(l.odds)}</span></div>
        ))}
      </div>
      <div className="kv"><span>Stake {money(bet.stake)} · odds {fmtOdds(bet.totalOdds)}</span><strong>{bet.status === 'lost' ? money(0) : bet.status === 'cashed_out' ? money(bet.cashedOut ?? 0) : money(bet.potentialReturn)}</strong></div>
    </div>
  );
}

export function BetHistory() {
  const [tab, setTab] = useState<'open' | 'settled'>('open');
  const [q, setQ] = useState('');
  const { data, loading } = useAsync(() => api.sportsbook.getBets(tab), [tab]);
  const list = (data ?? []).filter((b) => !q || b.id.toLowerCase().includes(q.toLowerCase()));
  return (
    <AccountFrame>
      <h1 className="page-title">Bets</h1>
      <div className="filters">
        <div className="seg">
          <button className={tab === 'open' ? 'active' : ''} onClick={() => setTab('open')}>Open</button>
          <button className={tab === 'settled' ? 'active' : ''} onClick={() => setTab('settled')}>Settled</button>
        </div>
        <label htmlFor="bet-q" className="sr-only">Search by bet ID</label>
        <input id="bet-q" className="input" placeholder="Search by bet ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="hint">Last 6 months</span>
      </div>
      {loading ? <div className="skeleton" style={{ height: 200 }} /> : list.length ? list.map((b) => (tab === 'open' ? <OpenBetCard key={b.id} bet={b} /> : <BetCard key={b.id} bet={b} />)) : <div className="card"><div className="empty"><Icon name="bets" size={28} />{tab === 'open' ? 'No open bets.' : 'No settled bets in this period.'}</div></div>}
    </AccountFrame>
  );
}

export function Transactions() {
  const [type, setType] = useState<Transaction['type'] | ''>('');
  const [q, setQ] = useState('');
  const { data, loading } = useAsync(() => api.account.getTransactions({ type: type || undefined }), [type]);
  const list = useMemo(() => (data ?? []).filter((t) => !q || t.reference.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const exportCsv = () => {
    const rows = [['Date', 'Type', 'Method', 'Amount', 'Status', 'Reference'], ...list.map((t) => [dateTime(t.createdAt), TX_LABEL[t.type], t.method ?? '', t.amount.toFixed(2), t.status, t.reference])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'transactions.csv';
    a.click();
  };
  return (
    <AccountFrame>
      <h1 className="page-title">Transactions</h1>
      <div className="filters">
        <label htmlFor="tx-type" className="sr-only">Transaction type</label>
        <select id="tx-type" className="select" value={type} onChange={(e) => setType(e.target.value as Transaction['type'] | '')}>
          <option value="">All types</option>
          {Object.entries(TX_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label htmlFor="tx-q" className="sr-only">Search by reference</label>
        <input id="tx-q" className="input" placeholder="Search by reference" value={q} onChange={(e) => setQ(e.target.value)} />
        {/* File downloads are blocked inside the shareable preview, so the export button only appears in the real app. */}
        {import.meta.env.MODE !== 'artifact' && <button className="btn btn-ghost btn-sm" onClick={exportCsv} style={{ height: 38 }}><Icon name="download" size={16} />Export CSV</button>}
      </div>
      <div className="card" style={{ padding: 8 }}>
        {loading ? <div className="skeleton" style={{ height: 200 }} /> : list.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Method</th><th>Status</th><th>Reference</th><th className="r">Amount</th></tr></thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td>{dateTime(t.createdAt)}</td>
                    <td>{TX_LABEL[t.type]}</td>
                    <td>{t.method ?? '–'}</td>
                    <td><span className={`tag ${STATUS_TAG[t.status]}`}>{t.status}</span></td>
                    <td className="num">{t.reference}</td>
                    <td className="r" style={{ color: t.amount > 0 ? 'var(--good)' : undefined, fontWeight: 700 }}>{t.amount > 0 ? '+' : ''}{money(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty">No transactions match these filters.</div>}
      </div>
    </AccountFrame>
  );
}

export function Profile() {
  return HTTP_AUTH_MODE ? <BackendProfile /> : <DemoProfile />;
}

function DemoProfile() {
  const { player, setPlayer } = useAuth();
  const [editing, setEditing] = useState<'email' | 'phone' | 'address' | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  const [showPersonal, setShowPersonal] = useState(false);
  if (!player) return null;
  const save = async () => {
    if (!editing) return;
    try {
      setPlayer(await api.account.updateContact(editing, value));
      setEditing(null);
      setError(undefined);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const rows: { key: 'email' | 'phone' | 'address'; label: string }[] = [
    { key: 'email', label: 'Email' }, { key: 'phone', label: 'Mobile' }, { key: 'address', label: 'Address' },
  ];
  return (
    <AccountFrame>
      <h1 className="page-title">Personal details</h1>
      <div className="card">
        <h2>Contact details</h2>
        <div className="list">
          {rows.map((r) => (
            <div key={r.key} className="list-row" style={{ flexWrap: 'wrap' }}>
              <span className="main-col"><span className="s">{r.label}</span><br /><span className="t">{player[r.key]}</span></span>
              {editing === r.key ? null : <button className="link" onClick={() => { setEditing(r.key); setValue(player[r.key]); }}>Edit</button>}
              {editing === r.key && (
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <label htmlFor={`edit-${r.key}`} className="sr-only">{r.label}</label>
                  <input id={`edit-${r.key}`} className="input" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
                  <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={save}>Save</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {error && <div className="alert" role="alert">{error}</div>}
      </div>
      <div className={`accordion ${showPersonal ? 'open' : ''}`}>
        <button onClick={() => setShowPersonal((s) => !s)} aria-expanded={showPersonal}><Icon name="user" />Personal information<Icon name="chevronDown" /></button>
        {showPersonal && (
          <div className="acc-body">
            <div className="kv"><span>Name</span><strong>{player.firstName} {player.lastName}</strong></div>
            <div className="kv"><span>Date of birth</span><strong>{shortDate(player.dateOfBirth)}</strong></div>
            <div className="kv"><span>Username</span><strong>{player.username}</strong></div>
            <div className="kv"><span>Favourite team</span><strong>{player.favouriteTeam ?? '–'}</strong></div>
            <p className="hint">Your name and date of birth come from your verified ID and can't be changed here. Contact support if they are wrong.</p>
          </div>
        )}
      </div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2>Identity verification</h2>
          <span className={`tag ${player.kycStatus === 'verified' ? 'good' : 'accent'}`} style={{ marginLeft: 'auto' }}>{player.kycStatus === 'verified' ? 'Verified' : player.kycStatus === 'pending' ? 'In review' : 'Required'}</span>
        </div>
        <p className="hint">{player.kycStatus === 'verified' ? 'Your identity is verified. You can deposit and withdraw without limits beyond the ones you set.' : 'Upload a photo of your ID card or passport and a recent proof of address. We usually confirm within an hour.'}</p>
        {player.kycStatus !== 'verified' && <button className="btn btn-primary" onClick={() => setPlayer({ ...player, kycStatus: 'pending' })}>Upload documents</button>}
      </div>
    </AccountFrame>
  );
}
