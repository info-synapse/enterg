import { useEffect, useState } from 'react';
import { api } from '@/api';
import type { Bet } from '@/api/types';
import { money, odds as fmtOdds, dateTime } from '@/lib/format';
import { useAuth } from '@/state/AuthContext';
import { useBetSlip, MAX_SELECTIONS } from '@/state/BetSlipContext';
import { Icon } from './Icon';

const QUICK = [5, 10, 25];

function StakeInput({ id, value, onChange }: { id: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="stake-row">
      <label className="sr-only" htmlFor={id}>Stake in euro</label>
      <input
        id={id}
        className="stake-input"
        inputMode="decimal"
        value={value ? String(value) : ''}
        placeholder="€ 0.00"
        onChange={(e) => onChange(Number(e.target.value.replace(',', '.')) || 0)}
      />
      {QUICK.map((q) => (
        <button key={q} type="button" className="stake-chip" onClick={() => onChange(value + q)}>+{q}</button>
      ))}
    </div>
  );
}

export function BetSlipPanel({ onClose }: { onClose?: () => void }) {
  const slip = useBetSlip();
  const { player, balance } = useAuth();
  const [tab, setTab] = useState<'slip' | 'open'>('slip');
  const count = slip.selections.length;

  return (
    <div className="slip">
      <div className="slip-head">
        <div className="seg" role="tablist" aria-label="Bet slip views">
          <button role="tab" aria-selected={tab === 'slip'} className={tab === 'slip' ? 'active' : ''} onClick={() => setTab('slip')}>
            Bet slip {count > 0 && <span className="slip-count" style={{ display: 'inline-grid', marginLeft: 6 }}>{count}</span>}
          </button>
          <button role="tab" aria-selected={tab === 'open'} className={tab === 'open' ? 'active' : ''} onClick={() => setTab('open')}>My bets</button>
        </div>
        {tab === 'slip' && count > 0 && (
          <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={slip.clear} aria-label="Remove all selections"><Icon name="trash" size={18} /></button>
        )}
        {onClose && <button className="icon-btn" style={{ marginLeft: tab === 'slip' && count > 0 ? 0 : 'auto' }} onClick={onClose} aria-label="Close bet slip"><Icon name="close" /></button>}
      </div>

      {tab === 'open' ? (
        <OpenBets />
      ) : slip.receipt ? (
        <Receipt bets={slip.receipt} onDone={() => { slip.dismissReceipt(); onClose?.(); }} />
      ) : count === 0 ? (
        <div className="slip-body">
          <div className="slip-empty">
            <Icon name="bets" size={32} />
            <strong style={{ color: 'var(--ink)' }}>Your bet slip is empty</strong>
            <span>Tap any odds to add a selection. You can combine up to {MAX_SELECTIONS}.</span>
          </div>
        </div>
      ) : (
        <>
          <div className="slip-body">
            {count > 1 && (
              <div className="seg" style={{ alignSelf: 'flex-start' }}>
                <button className={slip.mode === 'single' ? 'active' : ''} onClick={() => slip.setMode('single')}>Singles</button>
                <button className={slip.mode === 'combo' ? 'active' : ''} onClick={() => slip.setMode('combo')}>Combo ({count})</button>
              </div>
            )}
            {slip.selections.map((s) => {
              const sameEvent = slip.mode === 'combo' && slip.selections.filter((x) => x.eventId === s.eventId).length > 1;
              return (
                <div key={s.selectionId} className={`slip-item ${sameEvent ? 'conflict' : ''}`}>
                  <div className="slip-item-top">
                    <div style={{ minWidth: 0 }}>
                      <div className="pick">{s.label}</div>
                      <div className="mkt">{s.marketName}</div>
                      <div className="ev">{s.live && <span className="live-badge" style={{ marginRight: 6 }}>Live</span>}{s.eventName}</div>
                    </div>
                    <span className="o">{fmtOdds(slip.liveOdds(s))}</span>
                    <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => slip.remove(s.selectionId)} aria-label={`Remove ${s.label}`}><Icon name="close" size={16} /></button>
                  </div>
                  {slip.mode === 'single' && (
                    <StakeInput id={`stake-${s.selectionId}`} value={slip.stakes[s.selectionId] || 0} onChange={(v) => slip.setStake(s.selectionId, v)} />
                  )}
                </div>
              );
            })}
            {slip.mode === 'combo' && slip.conflict && <div className="alert warn">Two selections come from the same match, so they can't be combined. Remove one or use singles.</div>}
          </div>
          <div className="slip-foot">
            {slip.mode === 'combo' && (
              <>
                <div className="kv"><span>Total odds</span><strong>{fmtOdds(slip.totalOdds)}</strong></div>
                <StakeInput id="stake-combo" value={slip.stakes.combo || 0} onChange={(v) => slip.setStake('combo', v)} />
              </>
            )}
            <div className="kv"><span>Total stake</span><strong>{money(slip.totalStake)}</strong></div>
            <div className="kv big"><span>Potential return</span><strong>{money(slip.potentialReturn)}</strong></div>
            {slip.error && <div className="alert" role="alert">{slip.error}</div>}
            {player && balance && slip.totalStake > balance.bettingAvailable && (
              <div className="alert warn">Your stake is more than your balance of {money(balance.bettingAvailable)}.</div>
            )}
            <button className="btn btn-primary btn-block" disabled={slip.placing || slip.totalStake <= 0 || (slip.mode === 'combo' && slip.conflict)} onClick={slip.place}>
              {!player ? 'Log in to place bet' : slip.placing ? 'Placing…' : `Place bet ${money(slip.totalStake)}`}
            </button>
            <span className="hint" style={{ textAlign: 'center' }}>Odds changes are accepted automatically.</span>
          </div>
        </>
      )}
    </div>
  );
}

function Receipt({ bets, onDone }: { bets: Bet[]; onDone: () => void }) {
  return (
    <div className="slip-body">
      <div className="alert good" role="status" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icon name="check" size={18} /> {bets.length > 1 ? `${bets.length} bets placed` : 'Bet placed'}
      </div>
      {bets.map((b) => (
        <div key={b.id} className="bet-card">
          <div className="kv"><span>{b.kind === 'combo' ? `Combo · ${b.legs.length} selections` : 'Single'}</span><strong>{b.id}</strong></div>
          <div className="legs">{b.legs.map((l) => <div key={l.selectionId} className="leg"><span>{l.label} · {l.eventName}</span><span className="o">{fmtOdds(l.odds)}</span></div>)}</div>
          <div className="kv"><span>Stake</span><strong>{money(b.stake)}</strong></div>
          <div className="kv"><span>Potential return</span><strong>{money(b.potentialReturn)}</strong></div>
        </div>
      ))}
      <button className="btn btn-ghost" onClick={onDone}>Done</button>
    </div>
  );
}

export function OpenBets() {
  const { player, openAuth, refreshBalance } = useAuth();
  const [bets, setBets] = useState<Bet[] | null>(null);
  const [msg, setMsg] = useState<string>();
  useEffect(() => {
    if (player) api.sportsbook.getBets('open').then(setBets);
  }, [player]);
  if (!player)
    return (
      <div className="slip-body"><div className="slip-empty"><Icon name="user" size={28} /><span>Log in to see your open bets.</span><button className="btn btn-primary" onClick={() => openAuth('login')}>Log in</button></div></div>
    );
  if (!bets) return <div className="slip-body"><div className="skeleton" style={{ height: 120 }} /></div>;
  if (!bets.length) return <div className="slip-body"><div className="slip-empty"><Icon name="bets" size={28} /><span>No open bets.</span></div></div>;
  const cashOut = async (b: Bet) => {
    try {
      const r = await api.sportsbook.cashOut(b.id);
      setMsg(`Cashed out ${money(r.amount)} from ${b.id}.`);
      setBets((prev) => prev?.filter((x) => x.id !== b.id) ?? null);
      refreshBalance();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  return (
    <div className="slip-body">
      {msg && <div className="alert good" role="status">{msg}</div>}
      {bets.map((b) => (
        <div key={b.id} className="bet-card">
          <div className="kv"><span>{b.kind === 'combo' ? `Combo · ${b.legs.length}` : 'Single'} · {dateTime(b.placedAt)}</span></div>
          <div className="legs">{b.legs.map((l) => <div key={l.selectionId} className="leg"><span>{l.label} · {l.eventName}</span><span className="o">{fmtOdds(l.odds)}</span></div>)}</div>
          <div className="kv"><span>Stake {money(b.stake)}</span><strong>Returns {money(b.potentialReturn)}</strong></div>
          {b.cashOutValue && <button className="btn btn-quiet btn-sm" onClick={() => cashOut(b)}>Cash out {money(b.cashOutValue)}</button>}
        </div>
      ))}
    </div>
  );
}

/** Floating pill (collapsed slip) + bottom sheet on smaller screens. */
export function SlipPillAndSheet({ sportsMode }: { sportsMode: boolean }) {
  const slip = useBetSlip();
  const count = slip.selections.length;
  return (
    <>
      {count > 0 && !slip.sheetOpen && (
        <button className={`slip-pill ${sportsMode ? 'sports' : ''}`} onClick={() => slip.setSheetOpen(true)} aria-label={`Open bet slip, ${count} selections`}>
          <span className="slip-count">{count}</span>
          <span className="num">{count > 1 ? fmtOdds(slip.totalOdds) : fmtOdds(slip.liveOdds(slip.selections[0]))}</span>
        </button>
      )}
      {slip.sheetOpen && (
        <div className="backdrop" onClick={() => slip.setSheetOpen(false)}>
          <div className="sheet" role="dialog" aria-label="Bet slip" onClick={(e) => e.stopPropagation()} style={{ height: '80vh' }}>
            <div className="sheet-grip" />
            <BetSlipPanel onClose={() => slip.setSheetOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
