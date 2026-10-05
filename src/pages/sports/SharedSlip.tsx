// Landing page for a shared bet slip link (#/slip/EG…): shows the selections at today's odds,
// says what dropped out, and adds them with one tap. Works for visitors without an account.
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api';
import { Icon } from '@/components/Icon';
import { Legs } from '@/components/BetCards';
import { toast } from '@/components/Toast';
import { prettyCode } from '@/lib/bookingCode';
import { odds as fmtOdds } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { useBetSlip } from '@/state/BetSlipContext';
import { SportsFrame } from './SportsFrame';

export function SharedSlip() {
  const { code = '' } = useParams();
  const slip = useBetSlip();
  const { data, loading, error } = useAsync(() => api.sportsbook.loadSharedSlip(code), [code]);
  const total = data ? Math.round(data.selections.reduce((p, s) => p * s.odds, 1) * 100) / 100 : 0;
  const add = () => {
    if (!data) return;
    const n = slip.addMany(data.selections);
    toast(n ? `${n} ${n === 1 ? 'selection' : 'selections'} added to your bet slip` : 'These selections are already in your bet slip', n ? 'good' : 'info');
    if (n && window.matchMedia('(max-width: 1180px)').matches) slip.setSheetOpen(true);
  };
  return (
    <SportsFrame>
      <div>
        <h1 className="page-title">Shared bet slip</h1>
        <span className="hint num">Code {prettyCode(code.toUpperCase())}</span>
      </div>
      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: 160 }} />
        ) : error || !data ? (
          <div className="empty"><Icon name="info" size={28} />{error ?? 'This code didn’t work.'}<Link className="btn btn-ghost" to="/">Browse sports</Link></div>
        ) : data.selections.length === 0 ? (
          <div className="empty"><Icon name="bets" size={28} />None of these selections are available any more. The matches may have finished.<Link className="btn btn-ghost" to="/">Browse sports</Link></div>
        ) : (
          <>
            <Legs legs={data.selections} />
            {data.dropped > 0 && <div className="alert warn">{data.dropped} {data.dropped === 1 ? 'selection is' : 'selections are'} no longer available and {data.dropped === 1 ? 'was' : 'were'} left out.</div>}
            <div className="kv big"><span>{data.selections.length > 1 ? 'Total odds today' : 'Odds today'}</span><strong>{fmtOdds(total)}</strong></div>
            <button className="btn btn-primary btn-block" onClick={add}>Add to my bet slip</button>
            <span className="hint">You choose your own stake. Odds may have changed since this slip was shared.</span>
          </>
        )}
      </div>
    </SportsFrame>
  );
}
