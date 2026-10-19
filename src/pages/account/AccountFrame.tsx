import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { AppFrame } from '@/components/Layout';
import { useTranslations } from '@/lib/useTranslations';
import { money } from '@/lib/format';
import { LOGIN_TEST_MODE } from '@/api/mode';
import { useAuth } from '@/state/AuthContext';

const NAV: { group: string; items: { to: string; label: string; icon: string; end?: boolean }[] }[] = [
  { group: '', items: [{ to: '/account', label: 'Overview', icon: 'home', end: true }] },
  { group: 'Payments', items: [{ to: '/account/deposit', label: 'Deposit', icon: 'wallet' }, { to: '/account/withdraw', label: 'Withdraw', icon: 'transfer' }] },
  { group: 'History', items: [{ to: '/account/bets', label: 'Bets', icon: 'bets' }, { to: '/account/bets2', label: 'Bets2', icon: 'bets' }, { to: '/account/bets-pro', label: 'Bets Pro/VIP', icon: 'bets' }, { to: '/account/transactions', label: 'Transactions', icon: 'history' }, { to: '/account/deposits', label: 'Deposits', icon: 'history' }] },
  { group: 'Profile', items: [{ to: '/account/profile', label: 'Personal details', icon: 'user' }, { to: '/account/protection', label: 'Limits and safer play', icon: 'shield' }] },
];

export function BalanceCard({ compact }: { compact?: boolean }) {
  const { t } = useTranslations();
  const { balance, refreshBalance } = useAuth();
  const nav = useNavigate();
  const [hidden, setHidden] = useState(false);
  if (!balance) return null;
  const v = (n: number | null) => (hidden ? '€ •••' : money(n, balance.currency));
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="hint" data-translation-key="HEADER_ACCOUNTBALANCE">{t('HEADER_ACCOUNTBALANCE', 'Account Balance')}</span>
        <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setHidden((h) => !h)} aria-label={hidden ? 'Show balance' : 'Hide balance'}><Icon name={hidden ? 'eye' : 'eyeOff'} size={16} /></button>
        <button className="link" style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)' }} onClick={refreshBalance}>Refresh</button>
      </div>
      <div className="balance-big">{v(balance.total)}</div>
      {!compact && (
        <>
          <div className="kv"><span>Cash balance</span><strong>{v(balance.bettingAvailable)}</strong></div>
          <div className="kv"><span>Available to withdraw</span><strong>{v(balance.withdrawable)}</strong></div>
          <div className="kv"><span>Total bonus</span><strong>{v(balance.bonus)}</strong></div>
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

export function AccountFrame({ children, showSidebar = true }: { children: ReactNode; showSidebar?: boolean }) {
  const { player, openAuth, logout, restoring, sessionError, retrySession } = useAuth();
  const { pathname } = useLocation();
  const [logoutError, setLogoutError] = useState('');
  const nav = useNavigate();
  if (restoring) return <AppFrame slipRail={false}><p role="status">Checking your session…</p></AppFrame>;
  if (!player)
    return (
      <AppFrame slipRail={false}>
        <div className="card" style={{ maxWidth: 480, margin: '24px auto', textAlign: 'center', alignItems: 'center' }}>
          <Icon name="user" size={32} />
          <h1 style={{ fontSize: 'var(--fs-xl)' }}>Log in to your account</h1>
          <p className="hint">See your balance, deposit and withdraw, check your bets and manage your limits.</p>
          {sessionError && <p role="alert">{sessionError} <button className="btn btn-ghost" onClick={retrySession}>Retry</button></p>}
          <div className="row-actions" style={{ width: '100%' }}>
            {!LOGIN_TEST_MODE && <button className="btn btn-ghost" onClick={() => openAuth('register')}>Join</button>}
            <button className="btn btn-primary" onClick={() => openAuth('login')}>Log in</button>
          </div>
        </div>
      </AppFrame>
    );
  return (
    <AppFrame slipRail={false}>
      <div className={showSidebar ? 'acct' : 'acct acct-no-side'}>
        <nav className="acct-nav" aria-label="Account">
          {NAV.map((g) => (
            <div key={g.group || 'top'} style={{ display: 'contents' }}>
              {g.group && <div className="grp">{g.group}</div>}
              {g.items.map((i) => <NavLink key={i.to} to={i.to} end={i.end}><Icon name={i.icon} size={18} />{i.label}</NavLink>)}
            </div>
          ))}
          <a href="#/" className="logout" onClick={async (e) => { e.preventDefault(); setLogoutError(''); try { await logout(); nav('/'); } catch { setLogoutError('Sign-out was not confirmed. Please retry.'); } }}><Icon name="logout" size={18} />Log out</a>
        </nav>
        <div className="acct-main">
          {logoutError && <p role="alert">{logoutError}</p>}
          {sessionError && <p role="alert">{sessionError}</p>}
          {LOGIN_TEST_MODE && <p className="hint" role="note">{pathname === '/account' ? 'Mixed mode: balance and personal details use the backend. Open bets and recent activity below are sample data.' : ['/account/bets2', '/account/profile', '/account/bets-pro', '/account/bets-desktop', '/account/deposits'].includes(pathname) ? 'Connected to your backend account.' : 'Sample preview: these records are not your backend account data. Payment, betting and limit-change actions are not enabled.'}</p>}
          {children}</div>
        {showSidebar && <aside className="acct-side" aria-label="Balance">
          <BalanceCard />
          {!LOGIN_TEST_MODE && <BankReference />}
        </aside>}
      </div>
    </AppFrame>
  );
}
