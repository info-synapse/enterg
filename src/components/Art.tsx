// Generated artwork so the prototype has no external images. Replace with CMS/provider images later.
import type { Game, LiveTable } from '@/api/types';

const hsl = (h: number, s: number, l: number) => `hsl(${h % 360} ${s}% ${l}%)`;

const motifPath: Record<Game['art']['motif'], string> = {
  sun: 'M60 40a20 20 0 1 0 0 40 20 20 0 0 0 0-40zM60 20v10M60 90v10M28 60h10M82 60h10M37 37l7 7M76 76l7 7M37 83l7-7M76 44l7-7',
  wave: 'M15 70c15-15 30-15 45 0s30 15 45 0M15 85c15-15 30-15 45 0s30 15 45 0M15 55c15-15 30-15 45 0s30 15 45 0',
  column: 'M38 30h44v8H38zM42 38h6v44h-6zM57 38h6v44h-6zM72 38h6v44h-6zM34 82h52v8H34z',
  star: 'M60 25l9 22 24 2-18 16 6 24-21-13-21 13 6-24-18-16 24-2z',
  gem: 'M40 40h40l14 16-34 38-34-38zM26 56h68M52 40l-6 16 14 38 14-38-6-16',
  leaf: 'M30 90C30 50 60 30 92 30c0 32-20 62-62 60zM30 90l40-40',
};

export function GameArt({ game }: { game: Game }) {
  const { hue, motif } = game.art;
  const id = `g-${game.id}`;
  return (
    <svg viewBox="0 0 120 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="0.5" cy="0.35" r="0.8">
          <stop offset="0" stopColor={hsl(hue, 80, 52)} />
          <stop offset="1" stopColor={hsl(hue + 30, 70, 14)} />
        </radialGradient>
      </defs>
      <rect width="120" height="160" fill={`url(#${id})`} />
      <g transform="translate(0 20)" fill="none" stroke={hsl(hue + 40, 100, 82)} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
        <path d={motifPath[motif]} />
      </g>
    </svg>
  );
}

export function TableArt({ table }: { table: LiveTable }) {
  const h = table.art.hue;
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="100" fill={hsl(h, 45, 16)} />
      <ellipse cx="80" cy="104" rx="95" ry="46" fill={hsl(h + 140, 45, 26)} />
      <ellipse cx="80" cy="104" rx="95" ry="46" fill="none" stroke={hsl(40, 60, 55)} strokeWidth="2" opacity="0.6" />
      {table.kind === 'roulette' && <circle cx="80" cy="74" r="16" fill="none" stroke={hsl(40, 70, 60)} strokeWidth="3" strokeDasharray="3 3" />}
      {table.kind === 'blackjack' && [0, 1, 2].map((i) => <rect key={i} x={62 + i * 13} y={66} width="11" height="15" rx="2" fill="#f5f2ea" transform={`rotate(${(i - 1) * 8} 80 80)`} />)}
      {table.kind === 'gameshow' && <circle cx="80" cy="60" r="26" fill="none" stroke={hsl(h + 60, 85, 65)} strokeWidth="6" strokeDasharray="6 4" />}
      {(table.kind === 'baccarat' || table.kind === 'poker') && [0, 1].map((i) => <rect key={i} x={70 + i * 12} y={68} width="11" height="15" rx="2" fill="#f5f2ea" />)}
      <circle cx="80" cy="30" r="12" fill={hsl(h, 20, 75)} opacity="0.85" />
      <path d="M62 52c4-10 32-10 36 0" fill={hsl(h, 20, 75)} opacity="0.85" />
    </svg>
  );
}

export function Crest({ name, hue }: { name: string; hue?: number }) {
  const h = hue ?? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const initials = name.replace(/[^A-Za-zΑ-Ωα-ω ]/g, '').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className="crest" style={{ background: `linear-gradient(135deg, ${hsl(h, 60, 42)}, ${hsl(h + 30, 60, 26)})` }}>
      {initials}
    </span>
  );
}
