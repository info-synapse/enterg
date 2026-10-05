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
  /** Fast-market selection (flagged on the slip line). */
  fast?: boolean;
  /** Bet Builder mode: the builder owns the pick instead of the bet slip. */
  picked?: boolean;
  onPick?: () => void;
  /** Greyed out with a reason, e.g. "Conflicts with Over 2.5". */
  blockedBy?: string;
}

export function OddsButton({ selection, eventId, eventName, marketName, live, showLabel = true, wide, fast, picked, onPick, blockedBy }: Props) {
  const { odds, trend } = useLiveSelection(selection);
  const slip = useBetSlip();
  const selected = onPick ? !!picked : slip.has(selection.id);
  const cls = ['odd', selected && 'selected', trend === 1 && 'up', trend === -1 && 'down', wide && 'wide', blockedBy && 'blocked'].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={cls}
      disabled={selection.suspended || !!blockedBy}
      title={blockedBy}
      aria-pressed={selected}
      aria-label={`${selection.label} at ${fmt(odds)}, ${marketName}, ${eventName}${blockedBy ? `. ${blockedBy}` : ''}`}
      onClick={() => (onPick ? onPick() : slip.toggle({ selectionId: selection.id, eventId, eventName, marketName, label: selection.label, odds, live, fast }))}
    >
      {trend !== 0 && <i className="arrow" />}
      {showLabel && <span className="lbl">{selection.label}</span>}
      <span className="val">{selection.suspended ? '–' : fmt(odds)}</span>
    </button>
  );
}
