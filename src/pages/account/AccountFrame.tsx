import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { AppFrame } from '@/components/Layout';
import { money } from '@/lib/format';
import { useAuth } from '@/state/AuthContext';

const NAV: { group: string; items: { to: string; label: string; icon: string; end?: boolean }[] }[] = [
  { group: '', items: [{ to: '/account', label: 'Overview', icon: 'home', end: true }] },
  { group: 'Payments', items: [{ to: '/account/deposit', label: 'Deposit', icon: 'wallet' }, { to: '/account/withdraw', label: 'Withdraw', icon: 'transfer' }] },
  { group: 'History', items: [{ to: '/account/bets', label: 'Bets', icon: 'bets' }, { to: '/account/transactions', label: 'Transactions', icon: 'history' }] },
  { group: 'Profile', items: [{ to: '/account/profile', label: 'Personal details', icon: 'user' }, { to: '/account/protection', label: 'Limits and safer play', icon: 'shield' }] },
];

export function BalanceCard({ compact }: { compact?: boolean }) {
  const { balance, refreshBalance } = useAuth();
  const nav = useNavigate();
  const [hidden, setHidden] = useState(false);
  if (!balance) return null;
  const v = (n: number) => (hidden ? '€ •••' : money(n));
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hint">Balance</span>
        <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setHidden((h) => !h)} aria-label={hidden ? 'Show balance' : 'Hide balance'}><Icon name={hidden ? 'eye' : 'eyeOff'} size={16} /></button>
        <button className="link" style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)' }} onClick={refreshBalance}>Refresh</button>
      </div>
      <div className="balance-big">{v(balance.total)}</div>
      {!compact && (
        <>
          <div className="kv"><span>Available to bet</span><strong>{v(balance.bettingAvailable)}</strong></div>
          <div className="kv"><span>Available to withdraw</span><strong>{v(balance.withdrawable)}</strong></div>
          <div className="kv"><span>Bonus money</span><strong>{v(balance.bonus)}</strong></div>
        </>
      )}
      <div className="row-actions">
        <button className="btn btn-ghost" onClick={() => nav('/account/withdraw')}>Withdraw</button>
        <button className="btn btn-primary" onClick={() => nav('/account/deposit')}>Deposit</button>
      </div>
    </div>
  );
}

function BankReference() {
  const { player } = useAuth();
  const [copied, setCopied] = useState(false);
  const ref = `RF${(player?.id ?? '').replace(/\D/g, '').padStart(8, '0')}0004417`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="card">
      <h3>Deposit from your bank app</h3>
      <p className="hint">Pay this personal reference from any Greek bank. The money reaches your balance automatically.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
        <span className="num" style={{ fontWeight: 700, userSelect: 'all', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ref}</span>
        <button className="link" style={{ marginLeft: 'auto' }} onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
    </div>
  );
}

export function AccountFrame({ children }: { children: ReactNode }) {
  const { player, openAuth, logout } = useAuth();
  const nav = useNavigate();
  if (!player)
    return (
      <AppFrame slipRail={false}>
        <div className="card" style={{ maxWidth: 480, margin: '24px auto', textAlign: 'center', alignItems: 'center' }}>
          <Icon name="user" size={32} />
          <h1 style={{ fontSize: 'var(--fs-xl)' }}>Log in to your account</h1>
          <p className="hint">See your balance, deposit and withdraw, check your bets and manage your limits.</p>
          <div className="row-actions" style={{ width: '100%' }}>
            <button className="btn btn-ghost" onClick={() => openAuth('register')}>Join</button>
            <button className="btn btn-primary" onClick={() => openAuth('login')}>Log in</button>
          </div>
        </div>
      </AppFrame>
    );
  return (
    <AppFrame slipRail={false}>
      <div className="acct">
        <nav className="acct-nav" aria-label="Account">
          {NAV.map((g) => (
            <div key={g.group || 'top'} style={{ display: 'contents' }}>
              {g.group && <div className="grp">{g.group}</div>}
              {g.items.map((i) => <NavLink key={i.to} to={i.to} end={i.end}><Icon name={i.icon} size={18} />{i.label}</NavLink>)}
            </div>
          ))}
          <a href="#/" className="logout" onClick={(e) => { e.preventDefault(); logout(); nav('/'); }}><Icon name="logout" size={18} />Log out</a>
        </nav>
        <div className="acct-main">{children}</div>
        <aside className="acct-side" aria-label="Balance">
          <BalanceCard />
          <BankReference />
        </aside>
      </div>
    </AppFrame>
  );
}
