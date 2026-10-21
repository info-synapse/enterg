import { useEffect, useMemo, useRef, useState } from 'react';
import type { Window } from '@/lib/markets';

const dayId = (d: Date) => `date-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function CouponDateRange({ dates, value, onChange }: { dates: Window[]; value: string | null; onChange: (id: string) => void }) {
  const days = useMemo(() => dates.map(d => d.from!), [dates]);
  const [draft, setDraft] = useState<[number, number] | null>(null);
  const drag = useRef<{ x: number; pair: [number, number]; mode: 'move' | 'start' | 'end' } | null>(null);
  const keys = value?.startsWith('range:') ? value.slice(6).split('/') : [];
  const a = days.findIndex(d => dayId(d) === keys[0]), b = days.findIndex(d => dayId(d) === keys[1]);
  const pair: [number, number] = draft ?? (a >= 0 && b >= a ? [a, b] : [0, Math.min(1, days.length - 1)]);
  const commit = (p: [number, number]) => onChange(`range:${dayId(days[p[0]])}/${dayId(days[p[1]])}`);
  useEffect(() => { if (!value && days.length) commit([0, Math.min(1, days.length - 1)]); }, [value, days]);
  if (!days.length) return null;
  const now = new Date();
  const label = (index: number) => days[index].toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric',
    ...(days[index].getMonth() === now.getMonth() && days[index].getFullYear() === now.getFullYear() ? {} : { month: 'short' as const }),
  }).replace(',', '');
  const adjust = (mode: 'move' | 'start' | 'end', delta: number, p: [number, number]): [number, number] => {
    if (mode === 'start') return [Math.max(0, Math.min(p[1], p[0] + delta)), p[1]];
    if (mode === 'end') return [p[0], Math.min(days.length - 1, Math.max(p[0], p[1] + delta))];
    const shift = Math.max(-p[0], Math.min(days.length - 1 - p[1], delta));
    return [p[0] + shift, p[1] + shift];
  };
  const control = (mode: 'move' | 'start' | 'end') => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, pair, mode }; setDraft(pair); },
    onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => { if (drag.current) setDraft(adjust(drag.current.mode, Math.round((e.clientX - drag.current.x) / 76), drag.current.pair)); },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => { if (drag.current) { const next = adjust(drag.current.mode, Math.round((e.clientX - drag.current.x) / 76), drag.current.pair); drag.current = null; setDraft(null); commit(next); } },
    onPointerCancel: () => { drag.current = null; setDraft(null); },
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); commit(adjust(mode, e.key === 'ArrowLeft' ? -1 : 1, pair)); } },
  });
  return <section aria-label="Match date range">
    <p className="hint" style={{ fontSize: '0.72rem' }} aria-live="polite">{label(pair[0])} – {label(pair[1])}{!value?.startsWith('range:') ? ' · Drag or use arrow keys to apply' : ''}</p>
    <div style={{ overflowX: 'auto', padding: '8px 0' }}>
      <div style={{ position: 'relative', width: days.length * 76, height: 40 }}>
        <div style={{ display: 'flex', position: 'absolute', top: 0 }}>
          {days.map((d, i) => <button key={dayId(d)} title={d.toLocaleDateString('en-GB', { dateStyle: 'full' })} onClick={() => commit([i, i])} style={{ width: 76, height: 40, fontSize: '0.72rem', flexShrink: 0, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }}>{label(i)}</button>)}
        </div>
        <div style={{ position: 'absolute', left: pair[0] * 76, width: (pair[1] - pair[0] + 1) * 76, top: 0, height: 40, display: 'flex', background: 'rgba(217, 154, 0, 0.22)', border: '2px solid #d99a00', borderRadius: 6, boxSizing: 'border-box' }}>
          <button {...control('start')} aria-label="Resize start date; use left and right arrows" style={{ width: 12, padding: 0, flexShrink: 0, touchAction: 'none', cursor: 'ew-resize', background: 'rgba(217, 154, 0, 0.35)', border: 0 }} />
          <button {...control('move')} aria-label="Move date range; use left and right arrows" style={{ flex: 1, minWidth: 0, padding: 0, touchAction: 'none', cursor: 'grab', background: 'transparent', border: 0 }} />
          <button {...control('end')} aria-label="Resize end date; use left and right arrows" style={{ width: 12, padding: 0, flexShrink: 0, touchAction: 'none', cursor: 'ew-resize', background: 'rgba(217, 154, 0, 0.35)', border: 0 }} />
        </div>
      </div>
    </div>
  </section>;
}
