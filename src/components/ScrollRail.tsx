// Horizontal rail of tiles. No scrollbar: on desktop, arrow buttons page through it
// (the left arrow appears once you have moved right); on touch screens you swipe.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

export function ScrollRail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    const ro = new ResizeObserver(update);
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [update, children]);

  // One page = the tiles fully in view, so no tile is skipped.
  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(200, el.clientWidth - 160), behavior: 'smooth' });
  };

  return (
    <div className="scroll-rail">
      <div ref={ref} className="rail-row" onScroll={update} role="list" aria-label={label}>
        {children}
      </div>
      {!atStart && (
        <button className="rail-arrow left hide-mobile" onClick={() => page(-1)} aria-label={`Scroll ${label} left`}><Icon name="chevronLeft" size={20} /></button>
      )}
      {!atEnd && (
        <button className="rail-arrow right hide-mobile" onClick={() => page(1)} aria-label={`Scroll ${label} right`}><Icon name="chevronRight" size={20} /></button>
      )}
    </div>
  );
}
