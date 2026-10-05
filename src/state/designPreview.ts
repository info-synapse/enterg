// Prototype-only switches for design decisions: dark palette (Night match / Graphite) and border density.
// Stored per browser; they only set attributes on <html> that the stylesheet reads.
import { useState } from 'react';

export type Palette = 'navy' | 'graphite';
export type Borders = 'current' | 'lean';

const read = <T extends string>(key: string, fallback: T): T => {
  try { return (localStorage.getItem(key) as T) || fallback; } catch { return fallback; }
};
const save = (key: string, v: string) => { try { localStorage.setItem(key, v); } catch { /* not stored */ } };

function apply(p: Palette, b: Borders) {
  const root = document.documentElement;
  if (p === 'graphite') root.setAttribute('data-palette', 'graphite'); else root.removeAttribute('data-palette');
  if (b === 'lean') root.setAttribute('data-borders', 'lean'); else root.removeAttribute('data-borders');
}
apply(read<Palette>('enterg-palette', 'navy'), read<Borders>('enterg-borders', 'current'));

export function useDesignPreview() {
  const [palette, setP] = useState<Palette>(() => read('enterg-palette', 'navy'));
  const [borders, setB] = useState<Borders>(() => read('enterg-borders', 'current'));
  return {
    palette, borders,
    setPalette: (p: Palette) => { setP(p); save('enterg-palette', p); apply(p, borders); },
    setBorders: (b: Borders) => { setB(b); save('enterg-borders', b); apply(palette, b); },
  };
}
