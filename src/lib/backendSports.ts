import { api } from '@/api';
import { mockApi } from '@/api/mock';
import type { Competition, Sport, BackendTournament, LeftMenuSport } from '@/api/types';
import { GROUP_ORDER } from './markets';
import { getBackendEvents } from './backendEvents';

export const isBackendSport = (id?: string) => !!id?.startsWith('backend-');
// Demo data fallback only: use explicit country names, never infer from club names
// or ambiguous league names. Canonical names match the existing Flag component.
const COUNTRY_NAMES = [
  'Greece', 'England', 'Scotland', 'Spain', 'Italy', 'Germany', 'France', 'Portugal',
  'Cyprus', 'Netherlands', 'Turkey', 'Austria', 'Belgium', 'Croatia', 'Denmark',
  'Poland', 'Serbia', 'Switzerland', 'Argentina', 'Brazil', 'Mexico', 'USA',
  'Australia', 'Japan', 'Saudi Arabia', 'South Korea', 'China',
];
function tournamentCountry(country: string, name: string): string {
  if (country?.trim() && country.trim().toLowerCase() !== 'null') return country;
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const matches = COUNTRY_NAMES.filter(candidate =>
    (` ${normalized} `).includes(` ${candidate.toLowerCase()} `));
  // Leave international or ambiguous titles unclassified rather than guess wrong.
  return matches.length === 1 ? matches[0] : '';
}
export function mapBackendCatalog(sports: LeftMenuSport[], tournaments: BackendTournament[]): { sports: Sport[]; competitions: Competition[] } {
  const ranks = new Map<number, number>();
  return {
    sports: sports.map((s, displayOrder) => ({ id: `backend-${s.ET_ID}`, backendId: s.ET_ID, name: s.ET_NAME, icon: 'sports', iconUrl: s.ET_FILENAME, liveCount: 0, displayOrder })),
    competitions: tournaments.map(t => {
      const displayOrder = ranks.get(t.EVENT_TYPE) ?? 0; ranks.set(t.EVENT_TYPE, displayOrder + 1);
      return { id: `backend-${t.TOURN_ID}`, backendId: t.TOURN_ID, sportId: `backend-${t.EVENT_TYPE}`, name: t.TNAME,
        iconUrl: t.FILE_NAME, order: t.TORDER, displayOrder, shortName: t.TNAME_ABB || undefined,
        region: tournamentCountry(t.tourn_country, t.TNAME), backendGroup: t.tourn_group,
        group: (GROUP_ORDER.includes(t.tourn_group) ? t.tourn_group : 'other') as Competition['group'], featured: displayOrder < 10 };
    }),
  };
}
type Catalog = ReturnType<typeof mapBackendCatalog>;
let cache: Catalog | undefined, expires = 0, pending: Promise<Catalog> | undefined;
export function loadBackendCatalog(): Promise<Catalog> {
  if (cache && performance.now() < expires) return Promise.resolve(cache);
  if (pending) return pending;
  const started = performance.now(), controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 35000);
  pending = Promise.all([api.referenceData.getLeftMenuSports(controller.signal), api.referenceData.getTournaments(controller.signal)]).then(([sports, tournaments]) => {
    if (!Array.isArray(sports.items) || !Array.isArray(tournaments.items)) throw new Error('Invalid backend catalog');
    cache = mapBackendCatalog(sports.items, tournaments.items);
    expires = started + Math.max(0, Math.min(300000, sports.cacheForMs, tournaments.cacheForMs));
    return cache;
  }).finally(() => { window.clearTimeout(timer); pending = undefined; });
  return pending;
}
// Backend matches are display-only; never substitute mock events or prices.
export const sportsPageApi = {
  ...api,
  sportsbook: {
    ...mockApi.sportsbook,
    getCompetitions: async (sportId?: string) => isBackendSport(sportId)
      ? (await loadBackendCatalog()).competitions.filter(c => c.sportId === sportId)
      : mockApi.sportsbook.getCompetitions(sportId),
    getEvents: (query: Parameters<typeof api.sportsbook.getEvents>[0]) =>
      isBackendSport(query.sportId) || isBackendSport(query.competitionId) || query.competitionIds?.some(isBackendSport)
        ? Promise.all([getBackendEvents(query), loadBackendCatalog()]).then(([events, catalog]) => {
          const comps = new Map(catalog.competitions.map(c => [c.id, c]));
          return events.map(e => ({ ...e, competitionIcon: comps.get(e.competitionId)?.iconUrl, competitionRegion: comps.get(e.competitionId)?.region }));
        }) : mockApi.sportsbook.getEvents(query),
  },
};
