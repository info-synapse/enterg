import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SportEvent } from '@/api/types';
import { BackendEventContent } from '@/pages/sports/BackendEventPage';
import { Icon } from './Icon';

const OPEN = 'enterg-market-preview-open';
export function EventMarketPreview({ event }: { event: SportEvent }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [position, setPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const cancelClose = () => { clearTimeout(timer.current); };
  const close = () => { cancelClose(); setPosition(null); };
  const scheduleClose = () => { cancelClose(); timer.current = setTimeout(() => setPosition(null), 350); };
  const open = () => {
    cancelClose();
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    window.dispatchEvent(new CustomEvent(OPEN, { detail: trigger.current }));
    const topInset = Math.max(12, (document.querySelector('header.header')?.getBoundingClientRect().bottom ?? 0) + 8);
    const leftSpace = rect.left - 16;
    if (leftSpace >= 300) {
      const width = Math.min(820, leftSpace);
      setPosition({ left: rect.left - width - 8, top: topInset, width, maxHeight: Math.max(40, window.innerHeight - topInset - 12) });
    } else {
      // Narrow screen: use the larger space above/below, never cover the trigger.
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - topInset - 8;
      setPosition({ left: 8, top: below >= above ? Math.max(topInset, rect.bottom + 8) : topInset,
        width: window.innerWidth - 16, maxHeight: Math.max(40, below >= above ? below : above) });
    }
  };
  useEffect(() => {
    const otherOpened = (e: Event) => { if ((e as CustomEvent).detail !== trigger.current) close(); };
    window.addEventListener(OPEN, otherOpened);
    return () => { window.removeEventListener(OPEN, otherOpened); cancelClose(); };
  }, []);
  useEffect(() => {
    if (!position) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { close(); trigger.current?.focus(); } };
    const outside = (e: PointerEvent) => { if (!panel.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) close(); };
    const scroll = (e: Event) => { if (!panel.current?.contains(e.target as Node)) close(); };
    window.addEventListener('keydown', key); window.addEventListener('pointerdown', outside);
    window.addEventListener('resize', close); window.addEventListener('scroll', scroll, true);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', outside); window.removeEventListener('resize', close); window.removeEventListener('scroll', scroll, true); };
  }, [position]);
  return <>
    <button ref={trigger} className="icon-btn" style={{ width: 26, minWidth: 26, padding: 3 }} aria-label={`Preview markets: ${event.home} – ${event.away}`} aria-haspopup="dialog" aria-expanded={!!position}
      onMouseEnter={open} onMouseLeave={scheduleClose} onClick={() => position ? close() : open()}>
      <Icon name="eye" size={16} />
    </button>
    {position && createPortal(<div ref={panel} role="dialog" aria-label={`Market preview: ${event.home} – ${event.away}`} onMouseEnter={cancelClose} onMouseLeave={scheduleClose}
      onFocusCapture={cancelClose}
      style={{ position: 'fixed', ...position, zIndex: 110, overflowY: 'auto', overscrollBehavior: 'contain', padding: 16, boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 12px 40px #0006' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: -16, background: 'var(--surface)', zIndex: 2, padding: '8px 0' }}>
        <strong>Market preview</strong><button className="icon-btn" aria-label="Close market preview" onClick={close}><Icon name="close" size={18} /></button>
      </div>
      <BackendEventContent key={event.id} eventId={event.id} sportId={event.sportId} preview />
    </div>, document.body)}
  </>;
}
