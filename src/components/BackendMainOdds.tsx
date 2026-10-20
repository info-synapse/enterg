import { useState } from 'react';
import type { Selection, SportEvent } from '@/api/types';
import { loadMainGameForecasts } from '@/lib/mainGameForecasts';
import { loadMarkets } from '@/lib/backendMarkets';
import { useBetSlip } from '@/state/BetSlipContext';
import { toast } from './Toast';

export function BackendMainOdds({ event, selection }: { event: SportEvent; selection: Selection }) {
  const slip = useBetSlip();
  const [busy, setBusy] = useState(false);
  const [resolvedId, setResolvedId] = useState('');
  const add = async () => {
    if (busy) return;
    if (resolvedId && slip.has(resolvedId)) { slip.remove(resolvedId); return; }
    setBusy(true);
    try {
      const [config, data] = await Promise.all([loadMainGameForecasts(), loadMarkets(event.id)]);
      const key = ({ '1': 'CD_1', X: 'CD_X', '2': 'CD_2' } as const)[selection.label as '1' | 'X' | '2'];
      const rows = config.items.filter(r => r.EVT_TYPE === Number(event.sportId.replace('backend-', '')));
      const candidates = data.markets.flatMap(m => m.selections.filter(s => {
        const ref = s as Selection & { gameId: number; forecastCode: number };
        return rows.some(r => key && r[key] > 0 && r.MGAME_ID === ref.gameId && r[key] === ref.forecastCode);
      }).map(s => ({ m, s })));
      if (candidates.length !== 1) throw new Error('Open the event markets to choose this selection.');
      const { m, s } = candidates[0];
      if (s.suspended || s.odds <= 0) throw new Error('This selection is currently unavailable.');
      setResolvedId(s.id);
      slip.toggle({ selectionId: s.id, eventId: event.id, eventName: `${event.home} – ${event.away}`, marketName: m.name, label: s.label, odds: s.odds });
      if (s.odds !== selection.odds) toast(`Added at updated odds ${s.odds.toFixed(2)} to the test betslip.`, 'info');
    } catch (error) { toast((error as Error).message, 'info'); }
    finally { setBusy(false); }
  };
  return <button className={`odd ${resolvedId && slip.has(resolvedId) ? 'selected' : ''}`} disabled={busy || selection.odds <= 0} onClick={add} aria-pressed={!!resolvedId && slip.has(resolvedId)}>
    <span className="lbl">{selection.label}</span><span className="val">{busy ? '…' : selection.odds > 0 ? selection.odds.toFixed(2) : ''}</span>
  </button>;
}
