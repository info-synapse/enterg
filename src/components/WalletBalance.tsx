import { useAuth } from '@/state/AuthContext';
import { money } from '@/lib/format';

/** Shared cash/bonus display for any authenticated screen. */
export function WalletBalance() {
  const { player, balance, balanceLoading, balanceError, refreshBalance } = useAuth();
  if (!player) return null;
  return <div aria-label="Wallet balances">
    {balance && <span>Cash: {money(balance.total, balance.currency)} · Bonus: {money(balance.bonus, balance.currency)}</span>}
    {balanceLoading && <span role="status"> Loading balance…</span>}
    {balanceError && <span role="alert">{balanceError}</span>}
    <button className="link" disabled={balanceLoading} onClick={refreshBalance} aria-label="Refresh wallet balances">Refresh</button>
  </div>;
}
