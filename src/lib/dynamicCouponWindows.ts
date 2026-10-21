import type { Window } from './markets';

export function dateWindow(id: string): Window | undefined {
  if (id.startsWith('range:')) {
    const keys = id.slice(6).split('/');
    if (keys.length !== 2 || !keys.every(k => /^date-\d{4}-\d{2}-\d{2}$/.test(k))) return;
    const start = dateWindow(keys[0]), end = dateWindow(keys[1]);
    if (!start || !end || +start.from! > +end.from!) return;
    return { id, label: 'Date range', from: start.from, to: end.to };
  }
  if (!/^date-\d{4}-\d{2}-\d{2}$/.test(id)) return;
  const [year, month, day] = id.slice(5).split('-').map(Number);
  const from = new Date(year, month - 1, day);
  if (from.getFullYear() !== year || from.getMonth() !== month - 1 || from.getDate() !== day) return;
  return { id, label: from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), from, to: new Date(year, month - 1, day + 1) };
}

export function dynamicCouponWindows(events: { startTime: string }[], now = new Date()) {
  const times = events.map(e => Date.parse(e.startTime)).filter(Number.isFinite);
  const keys = new Set(times.map(time => {
    const d = new Date(time);
    return `date-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }));
  const dates = [...keys].sort().map(key => dateWindow(key)!);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const short = [3, 12].filter(hours => times.some(t => t >= +now && t < +now + hours * 3600000))
    .map(hours => ({ id: `${hours}h`, label: `${hours} hours`, from: now, to: new Date(+now + hours * 3600000) }));
  const days = dates.map(d => ({ ...d, label: +d.from! === +today ? 'Today' : +d.from! === +tomorrow ? 'Tomorrow'
    : d.from!.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '') }));
  return { buttons: [...short, ...days].slice(0, 8), dates };
}
