// One small stroke icon set so every icon shares weight and size.
const paths: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  live: 'M13 2 4 14h7l-1 8 9-12h-7z',
  sports: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7l4 3-1.5 4.5h-5L8 10zM12 3v4M20.5 9.5 16 10M17.5 19l-3-4.5M6.5 19l3-4.5M3.5 9.5 8 10',
  bets: 'M5 3h14v18l-3.5-2-3.5 2-3.5-2L5 21zM9 8h6M9 12h6M9 16h3',
  casino: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M5.6 18.4l2.9-2.9M15.5 8.5l2.9-2.9',
  livecasino: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7M17 3l2-1M19 6h2',
  virtuals: 'M3 5h18v11H3zM8 21h8M12 16v5M10 8.5v4l3.5-2z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  gift: 'M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9c-1.5-3-5-4-5-1.5S10 9 12 9zM12 9c1.5-3 5-4 5-1.5S14 9 12 9z',
  close: 'M6 6l12 12M18 6 6 18',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  pin: 'M9 4h6l-1 5 3 3H7l3-3zM12 15v6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.7M6.6 6.6C3.8 8.3 2 12 2 12s3.5 7 10 7c1.8 0 3.3-.5 4.6-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l12-4 2 4M16 13.5h2',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2',
  transfer: 'M4 8h14l-4-4M20 16H6l4 4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z',
  football: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7l4 3-1.5 4.5h-5L8 10z',
  basketball: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3v18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8',
  tennis: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.5 5.8c3.5 3.2 3.5 9.2 0 12.4M18.5 5.8c-3.5 3.2-3.5 9.2 0 12.4',
  volleyball: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 12c0-4 2-7 5.5-8M12 12c-3.5 2-7 2-9-.5M12 12c3.5 2 5 5.5 4 8.5',
  handball: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM7 9h10M7 15h10M12 3v18',
  hockey: 'M4 4l7 13h6a2 2 0 0 0 2-2M14 20h6',
  esports: 'M6 9h12a3 3 0 0 1 3 3l-1 5a2 2 0 0 1-3.5 1L14 16h-4l-2.5 2A2 2 0 0 1 4 17l-1-5a3 3 0 0 1 3-3zM8 12v2M7 13h2M16 12.5h.01M18 13.5h.01',
  tabletennis: 'M14 3a6 6 0 0 1 4.2 10.2l-5 5-4.4-4.4 5-5M8.8 13.8 4 18.6 5.4 20l4.8-4.8M19 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  az: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8 21h8M9.5 17h5v4h-5z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  builder: 'M4 6h9M4 12h9M4 18h9M18 9v6M15 12h6',
  check: 'M5 12l5 5 9-10',
  plus: 'M12 5v14M5 12h14',
  share: 'M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  stats: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  pitch: 'M3 5h18v14H3zM12 5v14M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 9h3v6H3M21 9h-3v6h3',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  download: 'M12 3v12M8 11l4 4 4-4M5 21h14',
  phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
  sound: 'M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6',
};

export function Icon({ name, size = 20, strokeWidth = 1.8, className }: { name: keyof typeof paths | string; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.info} />
    </svg>
  );
}

export function BrandMark() {
  // A Greek-key fragment folded into an "E": the one decorative signature of the brand.
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M9 8h14v4H13v2h8v4h-8v2h10v4H9z" fill="var(--accent-ink)" />
    </svg>
  );
}
