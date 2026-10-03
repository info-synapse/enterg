// "Stories" promo strip (every product page) and the full-screen story viewer.
// Content comes from the CMS: api.cms.getStories(vertical).
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import type { StoryGroup, StorySlide } from '@/api/types';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/state/AuthContext';
import { Icon } from './Icon';

const DURATION = 6000; // ms per slide
const SEEN_KEY = 'enterg-stories-seen';
const hsl = (h: number, s: number, l: number) => `hsl(${h % 360} ${s}% ${l}%)`;

const MOTIF: Record<StorySlide['motif'], string> = {
  sun: 'M60 40a20 20 0 1 0 0 40 20 20 0 0 0 0-40zM60 20v10M60 90v10M28 60h10M82 60h10M37 37l7 7M76 76l7 7M37 83l7-7M76 44l7-7',
  wave: 'M15 70c15-15 30-15 45 0s30 15 45 0M15 85c15-15 30-15 45 0s30 15 45 0M15 55c15-15 30-15 45 0s30 15 45 0',
  column: 'M38 30h44v8H38zM42 38h6v44h-6zM57 38h6v44h-6zM72 38h6v44h-6zM34 82h52v8H34z',
  star: 'M60 25l9 22 24 2-18 16 6 24-21-13-21 13 6-24-18-16 24-2z',
  gem: 'M40 40h40l14 16-34 38-34-38zM26 56h68M52 40l-6 16 14 38 14-38-6-16',
  leaf: 'M30 90C30 50 60 30 92 30c0 32-20 62-62 60zM30 90l40-40',
};

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/** Generated artwork; in production each slide carries an image or short video from the CMS.
 *  "card" = narrow strip card, "wide" = group card, "full" = viewer. Each keeps the motif clear of the text. */
function StoryArt({ hue, motif, id, shape }: { hue: number; motif: StorySlide['motif']; id: string; shape: 'card' | 'wide' | 'full' }) {
  const box = shape === 'wide' ? { w: 180, h: 120, cx: 128, cy: 64, t: 'translate(84 22) scale(0.72)' } : shape === 'card' ? { w: 90, h: 124, cx: 45, cy: 56, t: 'translate(16 26) scale(0.48)' } : { w: 90, h: 160, cx: 45, cy: 98, t: 'translate(10 62) scale(0.58)' };
  return (
    <svg className="story-art" viewBox={`0 0 ${box.w} ${box.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={`sa-${id}`} cx={box.cx / box.w} cy={box.cy / box.h} r="0.9">
          <stop offset="0" stopColor={hsl(hue, 78, 46)} />
          <stop offset="1" stopColor={hsl(hue + 35, 70, 12)} />
        </radialGradient>
      </defs>
      <rect width={box.w} height={box.h} fill={`url(#sa-${id})`} />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={box.cx} cy={box.cy} r={18 + i * 14} fill="none" stroke={hsl(hue + 25, 95, 72)} strokeOpacity={0.28 - i * 0.04} strokeWidth="5" />
      ))}
      <g transform={box.t} fill="none" stroke={hsl(hue + 40, 100, 86)} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d={MOTIF[motif]} />
      </g>
    </svg>
  );
}

export function StoriesStrip({ vertical }: { vertical: StoryGroup['vertical'] }) {
  const { data } = useAsync(() => api.cms.getStories(vertical), [vertical]);
  const [open, setOpen] = useState<{ groups: StoryGroup[]; start: number } | null>(null);
  const [seen, setSeen] = useState<string[]>(readSeen);
  const rail = useRef<HTMLDivElement>(null);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: seen state lasts for this visit */
      }
      return next;
    });
  }, []);

  if (!data) return <div className="stories"><div className="story-card skeleton" /><div className="story-card wide skeleton" /><div className="story-card skeleton" /></div>;
  // Unseen stories first, like the reference.
  const ordered = [...data].sort((a, b) => Number(seen.includes(a.id)) - Number(seen.includes(b.id)));
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <section className="stories-wrap" aria-label="Offers and news">
      <div className="stories" ref={rail}>
        {ordered.map((g, i) => {
          const first = g.slides[0];
          const group = g.slides.length > 1;
          return (
            <button key={g.id} className={`story-card ${group ? 'wide' : ''} ${seen.includes(g.id) ? 'seen' : ''}`} onClick={() => setOpen({ groups: ordered, start: i })} aria-label={`${g.title}${group ? `, ${g.slides.length} stories` : ''}`}>
              <StoryArt hue={g.hue} motif={first.motif} id={`c-${g.id}`} shape={group ? 'wide' : 'card'} />
              <span className="story-icon"><Icon name={g.icon} size={16} /></span>
              {group && <span className="story-label">{g.label ?? g.title}<span className="story-count">{g.slides.length}</span></span>}
              <span className="story-title">{g.title}</span>
            </button>
          );
        })}
      </div>
      <button className="story-scroll left hide-mobile" onClick={() => scroll(-1)} aria-label="Scroll stories left"><Icon name="chevronLeft" size={18} /></button>
      <button className="story-scroll right hide-mobile" onClick={() => scroll(1)} aria-label="Scroll stories right"><Icon name="chevronRight" size={18} /></button>
      {/* The viewer keeps the order the strip had when it opened, even as stories get marked seen. */}
      {open && <StoryViewer groups={open.groups} start={open.start} onSeen={markSeen} onClose={() => setOpen(null)} />}
    </section>
  );
}

function StoryViewer({ groups, start, onClose, onSeen }: { groups: StoryGroup[]; start: number; onClose: () => void; onSeen: (id: string) => void }) {
  const [gi, setGi] = useState(start);
  const [si, setSi] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const nav = useNavigate();
  const { player, openAuth } = useAuth();
  const pressedAt = useRef(0);
  const group = groups[gi];
  const slide = group.slides[si];

  const next = useCallback(() => {
    setProgress(0);
    if (si < group.slides.length - 1) setSi(si + 1);
    else if (gi < groups.length - 1) { setGi(gi + 1); setSi(0); }
    else onClose();
  }, [si, gi, group.slides.length, groups.length, onClose]);
  const prev = useCallback(() => {
    setProgress(0);
    if (si > 0) setSi(si - 1);
    else if (gi > 0) { setGi(gi - 1); setSi(0); }
  }, [si, gi]);
  const jumpGroup = (d: 1 | -1) => {
    const n = gi + d;
    if (n < 0) return;
    if (n >= groups.length) return onClose();
    setGi(n);
    setSi(0);
    setProgress(0);
  };

  useEffect(() => onSeen(group.id), [group.id, onSeen]);

  // Timer: advances the progress bar and moves on when it fills.
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      setProgress((p) => Math.min(1, p + dt / DURATION));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, gi, si]);
  useEffect(() => {
    if (progress >= 1) next();
  }, [progress, next]);

  // Keyboard, and no page scrolling behind the viewer.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
    };
  }, [next, prev, onClose]);

  // Tap left third = back, elsewhere = forward; press and hold = pause.
  const down = () => { pressedAt.current = Date.now(); setPaused(true); };
  const up = (e: ReactPointerEvent<HTMLDivElement>) => {
    setPaused(false);
    if (Date.now() - pressedAt.current > 250) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left < r.width / 3) prev(); else next();
  };

  const act = () => {
    onClose();
    if (slide.to === 'register') { if (!player) openAuth('register'); else nav('/account/deposit'); }
    else nav(slide.to);
  };

  return (
    <div className="story-backdrop" role="dialog" aria-modal="true" aria-label={`${group.label ?? group.title} stories`} onClick={onClose}>
      <button className="story-nav prev hide-mobile" onClick={(e) => { e.stopPropagation(); jumpGroup(-1); }} disabled={gi === 0} aria-label="Previous story group"><Icon name="chevronLeft" /></button>
      <div className="story-frame" onClick={(e) => e.stopPropagation()}>
        <StoryArt hue={group.hue} motif={slide.motif} id={`v-${group.id}-${slide.id}`} shape="full" />
        <div className="story-top">
          <div className="story-bars" aria-hidden="true">
            {group.slides.map((s, i) => (
              <span key={s.id}><i style={{ width: `${(i < si ? 1 : i === si ? progress : 0) * 100}%` }} /></span>
            ))}
          </div>
          <div className="story-head">
            <span className="story-icon static"><Icon name={group.icon} size={16} /></span>
            <strong>{group.label ?? group.title}</strong>
            <button className="story-btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play' : 'Pause'}>{paused ? '▶' : '❚❚'}</button>
            <button className="story-btn" onClick={onClose} aria-label="Close stories"><Icon name="close" /></button>
          </div>
        </div>
        <div className="story-tap" onPointerDown={down} onPointerUp={up} onPointerLeave={() => setPaused(false)} />
        <div className="story-copy" aria-live="polite">
          <h2>{slide.title}</h2>
          <p>{slide.body}</p>
        </div>
        <button className="btn btn-primary story-cta" onClick={act}>{slide.cta}</button>
        <span className="sr-only">Story {si + 1} of {group.slides.length}</span>
      </div>
      <button className="story-nav next hide-mobile" onClick={(e) => { e.stopPropagation(); jumpGroup(1); }} aria-label="Next story group"><Icon name="chevronRight" /></button>
    </div>
  );
}
