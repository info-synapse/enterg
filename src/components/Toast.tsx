// Short confirmations ("Added to bet slip", "Auto cash-out: €12.40"). One at a time, bottom of the screen above the nav.
import { useEffect, useState } from 'react';
import { Icon } from './Icon';

type Toast = { id: number; text: string; tone: 'good' | 'info' };
const listeners = new Set<(t: Toast) => void>();
let seq = 1;

export function toast(text: string, tone: Toast['tone'] = 'good') {
  const t = { id: seq++, text, tone };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [current, setCurrent] = useState<Toast | null>(null);
  useEffect(() => {
    const l = (t: Toast) => setCurrent(t);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setCurrent(null), 3200);
    return () => clearTimeout(timer);
  }, [current]);
  if (!current) return null;
  return (
    <div className={`toast ${current.tone}`} role="status" aria-live="polite" key={current.id}>
      <Icon name={current.tone === 'good' ? 'check' : 'info'} size={16} strokeWidth={2.5} />
      {current.text}
    </div>
  );
}
