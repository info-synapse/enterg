// Markets offered in the list views (odds columns), per sport.
// In production this list comes from the sportsbook platform's market-type feed.
const BY_SPORT: Record<string, string[]> = {
  football: ['Match result', 'Total goals 2.5', 'Both teams to score', 'Double chance', '1st half result', 'Total corners 9.5', 'Draw no bet'],
  basketball: ['Winner', 'Handicap -4.5', 'Total points 162.5', '1st half winner'],
  tennis: ['Winner', 'Games handicap -3.5', 'Total games 22.5', '1st set winner'],
  volleyball: ['Winner', 'Set handicap -1.5', 'Total points 182.5', '1st set winner'],
  handball: ['Winner', 'Handicap -2.5', 'Total goals 56.5', '1st half winner'],
  'ice-hockey': ['Winner', 'Puck line -1.5', 'Total goals 5.5', '1st period winner'],
  esports: ['Winner', 'Map handicap -1.5', 'Total maps 2.5', 'Map 1 winner'],
};
export const marketsFor = (sportId: string) => BY_SPORT[sportId] ?? ['Winner', 'Handicap -1.5', 'Total 4.5', '1st period winner'];

/** Short label for a market tab ("Total goals 2.5" -> "Over/Under 2.5"). */
export const marketTabLabel = (name: string) =>
  name.replace(/^Total goals (\d)/, 'Over/Under $1').replace('Both teams to score', 'Both score').replace('Total corners', 'Corners');

/** Kick-off windows used by the Coupon tab. */
export type Window = { id: string; label: string; from?: Date; to?: Date };
export function couponWindows(now = new Date()): Window[] {
  const startOfDay = (d: Date, add = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + add);
  const list: Window[] = [
    { id: '3h', label: '3 hours', from: now, to: new Date(now.getTime() + 3 * 3_600_000) },
    { id: '12h', label: '12 hours', from: now, to: new Date(now.getTime() + 12 * 3_600_000) },
    { id: 'today', label: 'Today', from: now, to: startOfDay(now, 1) },
    { id: 'tomorrow', label: 'Tomorrow', from: startOfDay(now, 1), to: startOfDay(now, 2) },
  ];
  for (let i = 2; i <= 5; i++) {
    const d = startOfDay(now, i);
    list.push({ id: `d${i}`, label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), from: d, to: startOfDay(now, i + 1) });
  }
  list.push({ id: 'all', label: 'All dates' });
  return list;
}

export function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86_400_000);
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  if (d.toDateString() === today.toDateString()) return `Today · ${date}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${date}`;
  return date;
}

/** Short badge for a country or area, used instead of flag images in the prototype. */
const CODES: Record<string, string> = {
  Greece: 'GR', England: 'EN', Spain: 'ES', Italy: 'IT', Germany: 'DE', France: 'FR', Portugal: 'PT', Cyprus: 'CY', Netherlands: 'NL',
  Turkey: 'TR', Austria: 'AT', Belgium: 'BE', Croatia: 'HR', Denmark: 'DK', Poland: 'PL', Scotland: 'SC', Serbia: 'RS', Switzerland: 'CH',
  'South America': 'SAM', Argentina: 'AR', Brazil: 'BR', Mexico: 'MX', USA: 'US', Australia: 'AU', Japan: 'JP', 'Saudi Arabia': 'KSA',
  'South Korea': 'KR', UEFA: 'UEFA', World: 'INT', Europe: 'EU', China: 'CN',
};
export const regionCode = (r: string) => CODES[r] ?? r.slice(0, 2).toUpperCase();

export const GROUP_LABEL: Record<string, string> = {
  'europe-main': 'Europe · main competitions and countries',
  americas: 'America',
  'europe-other': 'Europe · other competitions and countries',
  world: 'Rest of the world',
  international: 'International competitions',
  other: 'Other competitions',
};
/** Same order as the reference's Competitions page. */
export const GROUP_ORDER = ['europe-main', 'americas', 'europe-other', 'world', 'international', 'other'];

/** Competitions that belong to an area rather than one country: shown directly in their group, before the countries. */
export const AREA_REGIONS = new Set(['UEFA', 'Europe', 'World', 'South America', 'International', 'CONCACAF', 'AFC', 'CAF']);
