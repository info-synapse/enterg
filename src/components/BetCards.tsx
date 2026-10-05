// Open bet card (cash-out, partial and auto cash-out, share) and the share panel.
// Cash-out opens in place on the card: never a second sheet on top of the bet slip.
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/api';
import type { Bet, SlipSelection } from '@/api/types';
import { cashOutValue } from '@/lib/cashout';
import { prettyCode } from '@/lib/bookingCode';
import { dateTime, money, odds as fmtOdds } from '@/lib/format';
import { useAuth } from '@/state/AuthContext';
import { useOddsLookup } from '@/state/LiveContext';
import { Icon } from './Icon';
import { toast } from './Toast';

export function Legs({ legs }: { legs: SlipSelection[] }) {
  return (
    <div className="legs">
      {legs.map((l) => (
        <div key={l.selectionId} className="leg">
          <span>
            <strong>{l.builder ? 'Bet Builder' : l.label}</strong> · {l.builder ? `${l.builder.length} selections` : l.marketName}
            {l.fast && <span className="tag" style={{ marginLeft: 6 }}>Fast</span>}
            <br /><span className="hint">{l.eventName}</span>
            {l.builder && <ul className="bb-mini">{l.builder.map((b) => <li key={b.selectionId}>{b.label} <span className="hint">{b.marketName}</span></li>)}</ul>}
          </span>
          <span className="o">{fmtOdds(l.odds)}</span>
        </div>
      ))}
    </div>
  );
}

type Panel = null | 'cashout' | 'auto' | 'share';

export function OpenBetCard({ bet: initial, onClosed }: { bet: Bet; onClosed?: (betId: string) => void }) {
  const [bet, setBet] = useState(initial);
  useEffect(() => setBet(initial), [initial]);
  const lookup = useOddsLookup();
  const { refreshBalance } = useAuth();
  const value = cashOutValue(bet, lookup);
  const canCashOut = !bet.legs.some((l) => l.fast) && bet.status === 'open';
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const doCashOut = async (amount?: number) => {
    setBusy(true);
    setError(undefined);
    try {
      const r = await api.sportsbook.cashOut(bet.id, amount);
      await refreshBalance();
      if (r.remaining) {
        setBet(r.remaining);
        setPanel(null);
        toast(`${money(r.amount)} cashed out. The rest of your bet is still running.`);
      } else {
        toast(`Cashed out ${money(r.amount)} from ${bet.id}.`);
        onClosed?.(bet.id);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const setAuto = async (target: number | null) => {
    setBusy(true);
    setError(undefined);
    try {
      setBet(await api.sportsbook.setAutoCashOut(bet.id, target));
      setPanel(null);
      toast(target ? `Auto cash-out set at ${money(target)}.` : 'Auto cash-out removed.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bet-card">
      <div className="kv"><span>{bet.kind === 'combo' ? `Combo · ${bet.legs.length}` : 'Single'} · {dateTime(bet.placedAt)}</span><span className="hint num">{bet.id}</span></div>
      <Legs legs={bet.legs} />
      <div className="kv"><span>Stake {money(bet.stake)}</span><strong>Returns {money(bet.potentialReturn)}</strong></div>
      {!!bet.cashedOut && <span className="hint">{money(bet.cashedOut)} already cashed out from this bet.</span>}
      {bet.autoCashOut && panel !== 'auto' && (
        <div className="auto-chip">
          <Icon name="clock" size={16} />
          <span>Auto cash-out at <strong>{money(bet.autoCashOut)}</strong></span>
          <button className="link" onClick={() => setPanel('auto')}>Edit</button>
          <button className="link" onClick={() => setAuto(null)} disabled={busy}>Remove</button>
        </div>
      )}
      <div className="bet-actions">
        {canCashOut && (
          <button className={`btn btn-quiet btn-sm ${panel === 'cashout' ? 'on' : ''}`} onClick={() => setPanel(panel === 'cashout' ? null : 'cashout')} aria-expanded={panel === 'cashout'}>
            Cash out <span className="num">{money(value)}</span>
          </button>
        )}
        <button className={`btn btn-ghost btn-sm ${panel === 'share' ? 'on' : ''}`} onClick={() => setPanel(panel === 'share' ? null : 'share')} aria-expanded={panel === 'share'}>
          <Icon name="share" size={15} />Share
        </button>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      {panel === 'cashout' && <CashOutPanel bet={bet} value={value} busy={busy} onConfirm={doCashOut} onAuto={() => setPanel('auto')} />}
      {panel === 'auto' && <AutoPanel bet={bet} value={value} busy={busy} onSave={setAuto} onCancel={() => setPanel(null)} />}
      {panel === 'share' && <SharePanel selections={bet.legs} stake={bet.stake} />}
    </div>
  );
}

function CashOutPanel({ bet, value, busy, onConfirm, onAuto }: { bet: Bet; value: number; busy: boolean; onConfirm: (amount?: number) => void; onAuto: () => void }) {
  // "full" follows the live value; a partial amount stays where the player put it.
  const [amount, setAmount] = useState<number | 'full'>('full');
  const min = 0.5;
  const take = amount === 'full' ? value : Math.min(amount, value);
  const full = amount === 'full' || take >= value - 0.01;
  const keepShare = full ? 0 : 1 - take / value;
  return (
    <div className="inline-panel" aria-label="Cash out">
      <div className="co-compare">
        <div><small>Cash out now</small><strong className="num">{money(value)}</strong></div>
        <div><small>If it wins</small><strong className="num">{money(bet.potentialReturn)}</strong></div>
      </div>
      {value > min * 2 && (
        <div className="field">
          <label htmlFor={`co-${bet.id}`}>Amount to cash out</label>
          <input id={`co-${bet.id}`} type="range" min={min} max={value} step={0.1} value={take} onChange={(e) => { const v = Number(e.target.value); setAmount(v >= value - 0.05 ? 'full' : v); }} />
          <span className="hint num">
            {full ? 'The whole bet' : `Take ${money(take)} now · ${money(bet.stake * keepShare)} stake keeps running for up to ${money(bet.potentialReturn * keepShare)}`}
          </span>
        </div>
      )}
      <button className="btn btn-primary btn-block" disabled={busy} onClick={() => onConfirm(full ? undefined : Math.round(take * 100) / 100)}>
        {busy ? 'Cashing out…' : `Cash out ${money(take)}`}
      </button>
      <button className="link" onClick={onAuto} style={{ alignSelf: 'center' }}>Set an automatic cash-out instead</button>
      <span className="hint">The amount can change with the odds. If it moves before you confirm, you get the new amount.</span>
    </div>
  );
}

function AutoPanel({ bet, value, busy, onSave, onCancel }: { bet: Bet; value: number; busy: boolean; onSave: (t: number | null) => void; onCancel: () => void }) {
  const [target, setTarget] = useState(String(bet.autoCashOut ?? Math.round(Math.max(value * 1.3, value + 1))));
  const n = Number(target.replace(',', '.'));
  const valid = n > 0 && n < bet.potentialReturn;
  return (
    <div className="inline-panel" aria-label="Automatic cash-out">
      <div className="field">
        <label htmlFor={`auto-${bet.id}`}>Cash out automatically when the value reaches</label>
        <input id={`auto-${bet.id}`} className="input num" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
        <span className="hint">Now {money(value)} · must be below the full return of {money(bet.potentialReturn)}. It runs on our side, even if you close the app.</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!valid || busy} onClick={() => onSave(n)}>Save auto cash-out</button>
      </div>
    </div>
  );
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Share a bet: booking code + link. Stakes are hidden unless the player turns them on. */
export function SharePanel({ selections, stake }: { selections: SlipSelection[]; stake?: number }) {
  const [res, setRes] = useState<{ code: string; url: string } | null>(null);
  const [error, setError] = useState<string>();
  const [showStake, setShowStake] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const ids = useMemo(() => selections.map((s) => s.selectionId).join(','), [selections]);
  useEffect(() => {
    api.sportsbook.shareSlip(selections).then(setRes).catch((e) => setError((e as Error).message));
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = selections.reduce((p, s) => p * s.odds, 1);
  const text = `My EnterG bet: ${selections.map((s) => (s.builder ? `Bet Builder (${s.builder.map((b) => b.label).join(', ')})` : `${s.label}, ${s.eventName}`)).join(' + ')}${showStake && stake ? ` · stake ${money(stake)}` : ''}. Copy it with code ${res ? prettyCode(res.code) : ''}`;

  const doCopy = async (what: 'link' | 'code') => {
    if (!res) return;
    const ok = await copy(what === 'link' ? res.url : res.code);
    if (ok) toast(what === 'link' ? 'Link copied' : 'Code copied');
    else { codeRef.current?.select(); toast('Copy isn’t allowed here. The code is selected, so you can copy it yourself.', 'info'); }
  };
  const doShare = async () => {
    if (!res) return;
    try { await navigator.share({ title: 'EnterG bet slip', text, url: res.url }); } catch { /* closed by the player */ }
  };

  if (error) return <div className="inline-panel"><div className="alert info">{error}</div></div>;
  return (
    <div className="inline-panel share" aria-label="Share this bet">
      <div className="share-card">
        <div className="share-card-head"><strong>EnterG</strong><span className="hint">Bet slip</span></div>
        {selections.map((s) => (
          <div key={s.selectionId} className="leg">
            <span><strong>{s.builder ? 'Bet Builder' : s.label}</strong><br /><span className="hint">{s.builder ? s.builder.map((b) => b.label).join(' · ') : `${s.marketName} · ${s.eventName}`}</span></span>
            <span className="o">{fmtOdds(s.odds)}</span>
          </div>
        ))}
        <div className="kv"><span>{selections.length > 1 ? 'Total odds' : 'Odds'}</span><strong className="num">{fmtOdds(Math.round(total * 100) / 100)}</strong></div>
        {showStake && stake !== undefined && <div className="kv"><span>Stake</span><strong>{money(stake)}</strong></div>}
      </div>
      {stake !== undefined && (
        <button className="switch" role="switch" aria-checked={showStake} onClick={() => setShowStake((v) => !v)}><span className="track" />Show my stake</button>
      )}
      <div className="share-code">
        <label htmlFor={`code-${ids}`} className="hint">Booking code</label>
        <input id={`code-${ids}`} ref={codeRef} readOnly className="input num" value={res ? prettyCode(res.code) : 'Creating…'} onFocus={(e) => e.target.select()} />
      </div>
      <div className="share-actions">
        {typeof navigator.share === 'function' && <button className="btn btn-primary" disabled={!res} onClick={doShare}><Icon name="share" size={16} />Share</button>}
        <button className="btn btn-ghost" disabled={!res} onClick={() => doCopy('link')}><Icon name="link" size={16} />Copy link</button>
        <button className="btn btn-ghost" disabled={!res} onClick={() => doCopy('code')}><Icon name="copy" size={16} />Copy code</button>
      </div>
      <span className="hint">Friends open the link or type the code in their bet slip. They get today’s odds.</span>
    </div>
  );
}
