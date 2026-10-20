import { useEffect, useState } from 'react';
import { api } from '@/api';
import type { Bet } from '@/api/types';
import { money, odds as fmtOdds } from '@/lib/format';
import { useAuth } from '@/state/AuthContext';
import { useBetSlip, MAX_SELECTIONS } from '@/state/BetSlipContext';
import { useAutoCashOuts } from '@/state/LiveContext';
import { Legs, OpenBetCard, SharePanel } from './BetCards';
import { Icon } from './Icon';
import { toast } from './Toast';

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
  const [tab, setTab] = useState<'slip' | 'open' | 'code'>('slip');
  const count = slip.selections.length;

  return (
    <div className="slip">
      <div className="slip-head">
        <div className="seg" role="tablist" aria-label="Bet slip views">
          <button role="tab" aria-selected={tab === 'slip'} className={tab === 'slip' ? 'active' : ''} onClick={() => setTab('slip')}>
            Bet slip {count > 0 && <span className="slip-count" style={{ display: 'inline-grid', marginLeft: 6 }}>{count}</span>}
          </button>
          <button role="tab" aria-selected={tab === 'open'} className={tab === 'open' ? 'active' : ''} onClick={() => setTab('open')}>My bets</button>
          <button role="tab" aria-selected={tab === 'code'} className={tab === 'code' ? 'active' : ''} onClick={() => setTab('code')}>Code</button>
        </div>
        {tab === 'slip' && count > 0 && (
          <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={slip.clear} aria-label="Remove all selections"><Icon name="trash" size={18} /></button>
        )}
        {onClose && <button className="icon-btn" style={{ marginLeft: tab === 'slip' && count > 0 ? 0 : 'auto' }} onClick={onClose} aria-label="Close bet slip"><Icon name="close" /></button>}
      </div>

      {tab === 'open' ? (
        <OpenBets />
      ) : tab === 'code' ? (
        <div className="slip-body">
          <div className="slip-empty" style={{ paddingBottom: 0 }}>
            <Icon name="copy" size={28} />
            <strong style={{ color: 'var(--ink)' }}>Copy a bet</strong>
            <span>Paste a booking code from a friend. The selections are added to your bet slip at today’s odds.</span>
          </div>
          <BookingCode onLoaded={() => setTab('slip')} />
        </div>
      ) : slip.receipt ? (
        <Receipt bets={slip.receipt} onDone={() => { slip.dismissReceipt(); onClose?.(); }} />
      ) : count === 0 ? (
        <div className="slip-body">
          <div className="slip-empty">
            <Icon name="bets" size={32} />
            <strong style={{ color: 'var(--ink)' }}>Your bet slip is empty</strong>
            <span>Tap any odds to add a selection. You can combine up to {MAX_SELECTIONS}.</span>
          </div>
          <button className="link" style={{ alignSelf: 'center' }} onClick={() => setTab('code')}>Have a booking code?</button>
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
                      <div className="pick">{s.builder ? 'Bet Builder' : s.label}{s.fast && <span className="tag" style={{ marginLeft: 6 }}>Fast</span>}</div>
                      <div className="mkt">{s.builder ? `${s.builder.length} selections, one match` : s.marketName}</div>
                      <div className="ev">{s.live && <span className="live-badge" style={{ marginRight: 6 }}>Live</span>}{s.eventName}</div>
                      {s.builder && (
                        <ul className="bb-mini">{s.builder.map((b) => <li key={b.selectionId}>{b.label} <span className="hint">{b.marketName}</span></li>)}</ul>
                      )}
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
            {slip.mode === 'combo' && slip.conflict && <div className="alert warn">Two selections come from the same match, so they can't be combined. Use the match's Bet Builder tab, remove one, or use singles.</div>}
            {slip.selections.some((s) => s.builder) && <span className="hint">If one selection in a Bet Builder is void, the whole Bet Builder is void.</span>}
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
            {player && balance && balance.bettingAvailable !== null && slip.totalStake > balance.bettingAvailable && (
              <div className="alert warn">Your stake is more than your balance of {money(balance.bettingAvailable)}.</div>
            )}
            <button className="btn btn-primary btn-block" disabled={slip.selections.some(s => s.selectionId.startsWith('backend:')) || slip.placing || slip.totalStake <= 0 || (slip.mode === 'combo' && slip.conflict)} onClick={slip.place}>
              {slip.selections.some(s => s.selectionId.startsWith('backend:')) ? 'Test betslip · placement unavailable' : !player ? 'Log in to place bet' : slip.placing ? 'Placing…' : `Place bet ${money(slip.totalStake)}`}
            </button>
            <span className="hint" style={{ textAlign: 'center' }}>{slip.selections.some(s => s.selectionId.startsWith('backend:')) ? 'Temporary local selections; no real bets are submitted.' : 'Odds changes are accepted automatically.'}</span>
          </div>
        </>
      )}
    </div>
  );
}

function Receipt({ bets, onDone }: { bets: Bet[]; onDone: () => void }) {
  const [sharing, setSharing] = useState<string | null>(null);
  return (
    <div className="slip-body">
      <div className="alert good" role="status" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Icon name="check" size={18} /> {bets.length > 1 ? `${bets.length} bets placed` : 'Bet placed'}
      </div>
      {bets.map((b) => (
        <div key={b.id} className="bet-card">
          <div className="kv"><span>{b.kind === 'combo' ? `Combo · ${b.legs.length} selections` : 'Single'}</span><strong>{b.id}</strong></div>
          <Legs legs={b.legs} />
          <div className="kv"><span>Stake</span><strong>{money(b.stake)}</strong></div>
          <div className="kv"><span>Potential return</span><strong>{money(b.potentialReturn)}</strong></div>
          {!b.legs.every((l) => l.fast) && (
            <div className="bet-actions">
              <button className={`btn btn-ghost btn-sm ${sharing === b.id ? 'on' : ''}`} onClick={() => setSharing(sharing === b.id ? null : b.id)} aria-expanded={sharing === b.id}><Icon name="share" size={15} />Share this bet</button>
            </div>
          )}
          {sharing === b.id && <SharePanel selections={b.legs} stake={b.stake} />}
        </div>
      ))}
      <button className="btn btn-ghost" onClick={onDone}>Done</button>
    </div>
  );
}

/** "Have a booking code?" in the empty slip: loads a shared slip at today's odds. */
function BookingCode({ onLoaded }: { onLoaded: () => void }) {
  const slip = useBetSlip();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const load = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const r = await api.sportsbook.loadSharedSlip(code);
      const added = slip.addMany(r.selections);
      if (!added) setError(r.dropped ? 'None of these selections are available any more.' : 'These selections are already in your slip.');
      else {
        toast(`${added} ${added === 1 ? 'selection' : 'selections'} added${r.dropped ? ` · ${r.dropped} no longer available` : ''}`);
        setCode('');
        onLoaded();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="inline-panel">
      <label htmlFor="booking-code" className="hint">Booking code</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input id="booking-code" className="input num" autoFocus autoCapitalize="characters" autoComplete="off" placeholder="EG…" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && code && load()} />
        <button className="btn btn-primary" disabled={!code || busy} onClick={load}>{busy ? '…' : 'Add'}</button>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
    </div>
  );
}

export function OpenBets() {
  const { player, openAuth } = useAuth();
  const [bets, setBets] = useState<Bet[] | null>(null);
  const autos = useAutoCashOuts();
  useEffect(() => {
    if (player) api.sportsbook.getBets('open').then(setBets);
  }, [player, autos.length]);
  if (!player)
    return (
      <div className="slip-body"><div className="slip-empty"><Icon name="user" size={28} /><span>Log in to see your open bets.</span><button className="btn btn-primary" onClick={() => openAuth('login')}>Log in</button></div></div>
    );
  if (!bets) return <div className="slip-body"><div className="skeleton" style={{ height: 120 }} /></div>;
  if (!bets.length) return <div className="slip-body"><div className="slip-empty"><Icon name="bets" size={28} /><span>No open bets.</span></div></div>;
  return (
    <div className="slip-body">
      {bets.map((b) => <OpenBetCard key={b.id} bet={b} onClosed={(id) => setBets((prev) => prev?.filter((x) => x.id !== id) ?? null)} />)}
    </div>
  );
}

/** Floating pill (collapsed slip) + bottom sheet on smaller screens. */
export function SlipPillAndSheet({ sportsMode }: { sportsMode: boolean }) {
  const slip = useBetSlip();
  const count = slip.selections.length;
  return (
    <>
      {count > 0 && !slip.sheetOpen && !slip.pillHidden && (
        <button className={`slip-pill ${sportsMode ? 'sports' : ''}`} onClick={() => slip.setSheetOpen(true)} aria-label={`Open bet slip, ${count} selections`}>
          <span className="slip-count">{count}</span>
          <span className="num">{count > 1 ? fmtOdds(slip.totalOdds) : fmtOdds(slip.liveOdds(slip.selections[0]))}</span>
        </button>
      )}
      {/* Empty slip stays one tap away on sports pages, for booking codes and open bets. */}
      {count === 0 && sportsMode && !slip.sheetOpen && !slip.pillHidden && (
        <button className="slip-pill sports empty" onClick={() => slip.setSheetOpen(true)} aria-label="Open bet slip">
          <Icon name="bets" size={22} />
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
