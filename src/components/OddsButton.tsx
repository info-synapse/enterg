import type { Selection } from '@/api/types';
import { odds as fmt } from '@/lib/format';
import { useLiveSelection } from '@/state/LiveContext';
import { useBetSlip } from '@/state/BetSlipContext';

interface Props {
  selection: Selection;
  eventId: string;
  eventName: string;
  marketName: string;
  live?: boolean;
  showLabel?: boolean;
  wide?: boolean;
}

export function OddsButton({ selection, eventId, eventName, marketName, live, showLabel = true, wide }: Props) {
  const { odds, trend } = useLiveSelection(selection);
  const slip = useBetSlip();
  const selected = slip.has(selection.id);
  const cls = ['odd', selected && 'selected', trend === 1 && 'up', trend === -1 && 'down', wide && 'wide'].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={cls}
      disabled={selection.suspended}
      aria-pressed={selected}
      aria-label={`${selection.label} at ${fmt(odds)}, ${marketName}, ${eventName}`}
      onClick={() => slip.toggle({ selectionId: selection.id, eventId, eventName, marketName, label: selection.label, odds, live })}
    >
      {trend !== 0 && <i className="arrow" />}
      {showLabel && <span className="lbl">{selection.label}</span>}
      <span className="val">{selection.suspended ? '–' : fmt(odds)}</span>
    </button>
  );
}
