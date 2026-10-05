// Mock data used until the real back-end APIs are connected.
// Names of games, dealers and players are invented. Teams and providers are used only as sample data.
import type {
  StoryGroup, Collection, Competition, EventDetail, Game, Jackpot, LiveTable, Market, PaymentMethod, PlayerTable, BuildSuggestion, TimelineItem,
  Player, Promo, Provider, Sport, Transaction, VirtualEvent, VirtualLeague, Bet, Limit,
} from '../types';

/* Deterministic random so the preview looks the same on every load */
let seed = 20261003;
export function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const round2 = (n: number) => Math.round(n * 100) / 100;

const now = Date.now();
const minutes = (m: number) => new Date(now + m * 60_000).toISOString();

export const sports: Sport[] = [
  { id: 'football', name: 'Football', icon: 'football', liveCount: 0 },
  { id: 'basketball', name: 'Basketball', icon: 'basketball', liveCount: 0 },
  { id: 'tennis', name: 'Tennis', icon: 'tennis', liveCount: 0 },
  { id: 'volleyball', name: 'Volleyball', icon: 'volleyball', liveCount: 0 },
  { id: 'handball', name: 'Handball', icon: 'handball', liveCount: 0 },
  { id: 'ice-hockey', name: 'Ice Hockey', icon: 'hockey', liveCount: 0 },
  { id: 'esports', name: 'Esports', icon: 'esports', liveCount: 0 },
  { id: 'table-tennis', name: 'Table Tennis', icon: 'tabletennis', liveCount: 0 },
];

type C = [id: string, sportId: string, name: string, region: string, group: Competition['group'], featured?: boolean];
const C_LIST: C[] = [
  // Football · Europe main (country order follows the reference: Greece first)
  ['gr-sl', 'football', 'Super League', 'Greece', 'europe-main', true],
  ['gr-sl2', 'football', 'Super League 2', 'Greece', 'europe-main'],
  ['gr-cup', 'football', 'Greek Cup', 'Greece', 'europe-main'],
  ['ucl', 'football', 'Champions League', 'UEFA', 'europe-main', true],
  ['uel', 'football', 'Europa League', 'UEFA', 'europe-main', true],
  ['uecl', 'football', 'Conference League', 'UEFA', 'europe-main'],
  ['epl', 'football', 'Premier League', 'England', 'europe-main', true],
  ['champ', 'football', 'Championship', 'England', 'europe-main'],
  ['l1', 'football', 'League One', 'England', 'europe-main'],
  ['laliga', 'football', 'LaLiga', 'Spain', 'europe-main', true],
  ['segunda', 'football', 'Segunda División', 'Spain', 'europe-main'],
  ['seriea', 'football', 'Serie A', 'Italy', 'europe-main', true],
  ['bundesliga', 'football', 'Bundesliga', 'Germany', 'europe-main'],
  ['ligue1', 'football', 'Ligue 1', 'France', 'europe-main'],
  ['liga-pt', 'football', 'Liga Portugal', 'Portugal', 'europe-main'],
  ['cy1', 'football', 'First Division', 'Cyprus', 'europe-main'],
  ['ered', 'football', 'Eredivisie', 'Netherlands', 'europe-main'],
  ['superlig', 'football', 'Süper Lig', 'Turkey', 'europe-main'],
  // Football · Europe other
  ['aut', 'football', 'Bundesliga', 'Austria', 'europe-other'],
  ['bel', 'football', 'Pro League', 'Belgium', 'europe-other'],
  ['cro', 'football', 'HNL', 'Croatia', 'europe-other'],
  ['den', 'football', 'Superliga', 'Denmark', 'europe-other'],
  ['pol', 'football', 'Ekstraklasa', 'Poland', 'europe-other'],
  ['sco', 'football', 'Premiership', 'Scotland', 'europe-other'],
  ['srb', 'football', 'SuperLiga', 'Serbia', 'europe-other'],
  ['sui', 'football', 'Super League', 'Switzerland', 'europe-other'],
  // Football · Americas
  ['lib', 'football', 'Copa Libertadores', 'South America', 'americas'],
  ['arg', 'football', 'Liga Profesional', 'Argentina', 'americas'],
  ['bra', 'football', 'Série A', 'Brazil', 'americas'],
  ['mex', 'football', 'Liga MX', 'Mexico', 'americas'],
  ['mls', 'football', 'MLS', 'USA', 'americas'],
  // Football · Rest of the world
  ['aus', 'football', 'A-League', 'Australia', 'world'],
  ['jpn', 'football', 'J1 League', 'Japan', 'world'],
  ['ksa', 'football', 'Pro League', 'Saudi Arabia', 'world'],
  ['kor', 'football', 'K League 1', 'South Korea', 'world'],
  // Football · International
  ['unl', 'football', 'Nations League', 'UEFA', 'international', true],
  ['wcq', 'football', 'World Cup qualifiers', 'UEFA', 'international'],
  ['intl-fr', 'football', 'International friendlies', 'World', 'international'],
  // Basketball
  ['euroleague', 'basketball', 'EuroLeague', 'Europe', 'international', true],
  ['eurocup', 'basketball', 'EuroCup', 'Europe', 'international'],
  ['gbl', 'basketball', 'Basket League', 'Greece', 'europe-main', true],
  ['acb', 'basketball', 'Liga ACB', 'Spain', 'europe-main'],
  ['lba', 'basketball', 'Serie A', 'Italy', 'europe-main'],
  ['nba', 'basketball', 'NBA', 'USA', 'americas', true],
  ['nbl', 'basketball', 'NBL', 'Australia', 'world'],
  // Tennis
  ['atp', 'tennis', 'ATP Shanghai', 'China', 'international', true],
  ['wta', 'tennis', 'WTA Wuhan', 'China', 'international', true],
  ['chall', 'tennis', 'Challenger Lisbon', 'Portugal', 'europe-main'],
  // Other sports
  ['vb-gr', 'volleyball', 'Volley League', 'Greece', 'europe-main', true],
  ['vb-it', 'volleyball', 'SuperLega', 'Italy', 'europe-main'],
  ['hb-ehf', 'handball', 'EHF Champions League', 'Europe', 'international', true],
  ['hb-gr', 'handball', 'Handball Premier', 'Greece', 'europe-main'],
  ['nhl', 'ice-hockey', 'NHL', 'USA', 'americas', true],
  ['cs2', 'esports', 'CS2 Major', 'World', 'international', true],
  ['lol', 'esports', 'LoL Worlds', 'World', 'international'],
  ['tt-cup', 'table-tennis', 'TT Cup', 'World', 'international', true],
];
export const competitions: Competition[] = C_LIST.map(([id, sportId, name, region, group, featured]) => ({ id, sportId, name, region, group, featured: !!featured }));

const teams: Record<string, string[]> = {
  'gr-sl': ['Olympiacos', 'Panathinaikos', 'AEK Athens', 'PAOK', 'Aris', 'OFI', 'Asteras Tripolis', 'Volos', 'Atromitos', 'Levadiakos', 'Panserraikos', 'AEL'],
  'gr-sl2': ['Panionios', 'Iraklis', 'Kalamata', 'Chania', 'PAS Giannina', 'Niki Volos'],
  'gr-cup': ['Kifisia', 'Panetolikos', 'Lamia', 'Egaleo'],
  ucl: ['Real Madrid', 'Bayern Munich', 'Inter', 'Arsenal', 'PSG', 'Barcelona', 'Liverpool', 'Benfica'],
  uel: ['Roma', 'Ajax', 'Porto', 'Lyon', 'Fenerbahçe', 'Rangers', 'Lazio', 'Celtic'],
  uecl: ['Fiorentina', 'Chelsea', 'Real Betis', 'Legia Warsaw'],
  epl: ['Manchester City', 'Chelsea', 'Tottenham', 'Newcastle', 'Aston Villa', 'Brighton', 'Everton', 'Fulham'],
  champ: ['Leeds', 'Sunderland', 'Norwich', 'Middlesbrough'],
  l1: ['Reading', 'Bradford City', 'Wigan', 'Stockport'],
  laliga: ['Atlético Madrid', 'Sevilla', 'Real Sociedad', 'Villarreal', 'Valencia', 'Athletic Club'],
  segunda: ['Albacete', 'Eibar', 'Almería', 'Burgos', 'Cádiz', 'Leganés'],
  seriea: ['Juventus', 'Milan', 'Napoli', 'Atalanta', 'Bologna', 'Torino'],
  bundesliga: ['Dortmund', 'Leverkusen', 'Leipzig', 'Stuttgart'],
  ligue1: ['Marseille', 'Monaco', 'Lille', 'Nice'],
  'liga-pt': ['Sporting CP', 'Braga', 'Vitória SC', 'Famalicão'],
  cy1: ['APOEL', 'Omonia', 'Apollon Limassol', 'AEK Larnaca'],
  ered: ['PSV', 'Feyenoord', 'AZ', 'Twente'],
  superlig: ['Galatasaray', 'Beşiktaş', 'Trabzonspor', 'Başakşehir'],
  aut: ['Salzburg', 'Sturm Graz', 'Rapid Wien', 'LASK'],
  bel: ['Club Brugge', 'Anderlecht', 'Genk', 'Gent'],
  cro: ['Dinamo Zagreb', 'Hajduk Split', 'Rijeka', 'Osijek'],
  den: ['Copenhagen', 'Midtjylland', 'Brøndby', 'Nordsjælland'],
  pol: ['Lech Poznań', 'Raków', 'Jagiellonia', 'Pogoń'],
  sco: ['Hearts', 'Aberdeen', 'Hibernian', 'Motherwell'],
  srb: ['Red Star', 'Partizan', 'TSC', 'Vojvodina'],
  sui: ['Young Boys', 'Basel', 'Servette', 'Lugano'],
  lib: ['Flamengo', 'River Plate', 'Palmeiras', 'Boca Juniors'],
  arg: ['Racing', 'Independiente', 'Estudiantes', 'Talleres'],
  bra: ['Corinthians', 'São Paulo', 'Grêmio', 'Fluminense'],
  mex: ['América', 'Tigres', 'Monterrey', 'Cruz Azul'],
  mls: ['Inter Miami', 'LA Galaxy', 'Columbus Crew', 'Seattle Sounders'],
  aus: ['Melbourne City', 'Sydney FC', 'Wellington Phoenix', 'Adelaide United'],
  jpn: ['Vissel Kobe', 'Kawasaki Frontale', 'Urawa Reds', 'Kashima Antlers'],
  ksa: ['Al-Hilal', 'Al-Nassr', 'Al-Ittihad', 'Al-Ahli'],
  kor: ['Ulsan HD', 'Jeonbuk', 'Pohang', 'FC Seoul'],
  unl: ['Greece', 'Germany', 'Spain', 'Czechia', 'Croatia', 'England', 'Finland', 'Albania', 'Switzerland', 'Slovenia'],
  wcq: ['Portugal', 'Norway', 'Netherlands', 'Serbia'],
  'intl-fr': ['Cyprus', 'Malta', 'Iceland', 'Bulgaria'],
  euroleague: ['Panathinaikos', 'Olympiacos', 'Fenerbahçe', 'Real Madrid', 'Monaco', 'Partizan', 'Žalgiris', 'Barcelona'],
  eurocup: ['Hapoel Tel Aviv', 'Bourg', 'Trento', 'Cedevita'],
  gbl: ['AEK', 'PAOK', 'Aris', 'Peristeri', 'Promitheas', 'Kolossos'],
  acb: ['Unicaja', 'Valencia Basket', 'Baskonia', 'Tenerife'],
  lba: ['Virtus Bologna', 'Olimpia Milano', 'Venezia', 'Tortona'],
  nba: ['Boston Celtics', 'Denver Nuggets', 'Milwaukee Bucks', 'Golden State', 'Dallas Mavericks', 'Phoenix Suns'],
  nbl: ['Sydney Kings', 'Perth Wildcats', 'Melbourne United', 'Tasmania JackJumpers'],
  atp: ['S. Tsitsipas', 'C. Alcaraz', 'J. Sinner', 'A. Zverev', 'D. Medvedev', 'H. Rune'],
  wta: ['M. Sakkari', 'I. Swiatek', 'A. Sabalenka', 'C. Gauff', 'E. Rybakina', 'J. Pegula'],
  chall: ['A. Pellegrino', 'N. Borges', 'L. Gaston', 'B. Bonzi'],
  'vb-gr': ['Olympiacos', 'PAOK', 'Panathinaikos', 'Foinikas Syros'],
  'vb-it': ['Perugia', 'Trento', 'Lube', 'Piacenza'],
  'hb-ehf': ['Olympiacos', 'Barcelona', 'Kiel', 'Veszprém'],
  'hb-gr': ['AEK', 'PAOK', 'Diomidis Argous', 'Drama'],
  nhl: ['Rangers', 'Oilers', 'Bruins', 'Avalanche'],
  cs2: ['NAVI', 'Vitality', 'FaZe', 'G2'],
  lol: ['T1', 'Gen.G', 'G2 Esports', 'BLG'],
  'tt-cup': ['P. Gionis', 'K. Angelakis', 'L. Lee', 'M. Novak'],
};

let selId = 1000;
const sel = (label: string, odds: number) => ({ id: `s${selId++}`, label, odds: round2(odds), trend: 0 as const });

function threeWay(fav = rand()): Market {
  const p1 = 0.2 + fav * 0.55;
  const px = 0.22 + rand() * 0.08;
  const p2 = Math.max(0.08, 1 - p1 - px);
  const m = 1.06;
  return {
    id: `m${selId++}`, name: 'Match result', group: 'popular', betBuilder: true,
    selections: [sel('1', 1 / (p1 * m)), sel('X', 1 / (px * m)), sel('2', 1 / (p2 * m))],
  };
}
function twoWay(name = 'Winner', a = '1', b = '2'): Market {
  const p = 0.25 + rand() * 0.5;
  return { id: `m${selId++}`, name, group: 'popular', betBuilder: false, selections: [sel(a, 1 / (p * 1.05)), sel(b, 1 / ((1 - p) * 1.05))] };
}

/** Handicap, total and first-period market names per sport (football has its own list). */
export const SECONDARY: Record<string, [string, string, string]> = {
  basketball: ['Handicap -4.5', 'Total points 162.5', '1st half winner'],
  tennis: ['Games handicap -3.5', 'Total games 22.5', '1st set winner'],
  volleyball: ['Set handicap -1.5', 'Total points 182.5', '1st set winner'],
  handball: ['Handicap -2.5', 'Total goals 56.5', '1st half winner'],
  'ice-hockey': ['Puck line -1.5', 'Total goals 5.5', '1st period winner'],
  esports: ['Map handicap -1.5', 'Total maps 2.5', 'Map 1 winner'],
  other: ['Handicap -1.5', 'Total 4.5', '1st period winner'],
};

function eventMarkets(e: { sportId: string; home: string; away: string }): Market[] {
  if (e.sportId !== 'football') {
    const n = SECONDARY[e.sportId] ?? SECONDARY.other;
    return [
      { id: `m${selId++}`, name: n[0], group: 'popular', betBuilder: true, selections: [sel(e.home, 1.8 + rand() * 0.2), sel(e.away, 1.8 + rand() * 0.2)] },
      { id: `m${selId++}`, name: n[1], group: 'popular', betBuilder: true, selections: [sel('Over', 1.8 + rand() * 0.15), sel('Under', 1.8 + rand() * 0.15)] },
      { id: `m${selId++}`, name: n[2], group: 'popular', betBuilder: true, selections: [sel(e.home, 1.5 + rand()), sel(e.away, 1.5 + rand())] },
    ];
  }
  const ou = (line: number, base: number): Market => ({
    id: `m${selId++}`, name: `Total goals ${line}`, group: 'goals', betBuilder: true,
    selections: [sel(`Over ${line}`, base), sel(`Under ${line}`, round2(1 / (1 - 1 / base) ))],
  });
  return [
    ou(2.5, 1.7 + rand() * 0.6),
    { id: `m${selId++}`, name: 'Both teams to score', group: 'goals', betBuilder: true, selections: [sel('Yes', 1.72 + rand() * 0.3), sel('No', 1.9 + rand() * 0.3)] },
    { id: `m${selId++}`, name: 'Double chance', group: 'popular', betBuilder: true, selections: [sel('1X', 1.22), sel('12', 1.3), sel('X2', 1.85)] },
    ou(1.5, 1.25 + rand() * 0.15),
    ou(3.5, 2.6 + rand() * 0.8),
    { id: `m${selId++}`, name: 'Draw no bet', group: 'popular', betBuilder: false, selections: [sel(e.home, 1.45 + rand()), sel(e.away, 2.1 + rand())] },
    { id: `m${selId++}`, name: '1st half result', group: 'popular', betBuilder: true, selections: [sel('1', 2.6), sel('X', 2.05), sel('2', 4.1)] },
    { id: `m${selId++}`, name: 'Correct score', group: 'specials', betBuilder: false, selections: [sel('1-0', 6.5), sel('2-0', 8.5), sel('2-1', 8.75), sel('1-1', 6.25), sel('0-0', 9.5), sel('0-1', 11), sel('1-2', 13), sel('0-2', 17)] },
    { id: `m${selId++}`, name: 'Asian handicap -0.5', group: 'asian', betBuilder: false, selections: [sel(e.home, 1.9), sel(e.away, 1.9)] },
    { id: `m${selId++}`, name: 'Total corners 9.5', group: 'specials', betBuilder: true, selections: [sel('Over 9.5', 1.95), sel('Under 9.5', 1.8)] },
    { id: `m${selId++}`, name: 'Result & both teams score', group: 'combos', betBuilder: false, selections: [sel('1 & Yes', 4.4), sel('X & Yes', 4.9), sel('2 & Yes', 7.5)] },
  ];
}

/* ---------- Players (invented names) ---------- */

const SURNAMES = ['Vlachos', 'Rinaldi', 'Moreau', 'Kostić', 'Jansen', 'Almeida', 'Lindqvist', 'Novak', 'Mavros', 'Herrera', 'Duarte', 'Keller', 'Brandt', 'Okafor', 'Delgado', 'Fischer', 'Nikolaou', 'Petrou', 'Andrade', 'Varga', 'Holm', 'Sarris', 'Barros', 'Leclerc'];
const INITIALS = 'ADEGJKLMNPRST';
const POSITIONS = ['FW', 'FW', 'MF', 'DF'] as const;
const between = (a: number, b: number) => a + rand() * (b - a);

function squad() {
  return POSITIONS.map((position) => ({ name: `${pick(INITIALS.split(''))}. ${pick(SURNAMES)}`, position }));
}

/** Goalscorer, shots and cards tables for a football match, odds scaled by position and team strength. */
function playerTables(homeStrength: number): PlayerTable[] {
  const sides = [
    { team: 'home' as const, squad: squad(), k: 1.15 - homeStrength * 0.3 },
    { team: 'away' as const, squad: squad(), k: 0.85 + homeStrength * 0.3 },
  ];
  const rows = (cells: (pos: string, k: number) => (number | null)[]) =>
    sides.flatMap((side) => side.squad.map((p) => ({ player: p.name, team: side.team, position: p.position, cells: cells(p.position, side.k).map((o) => (o ? sel(p.name, o) : null)) })));
  const goal = { FW: [2.2, 3.2], MF: [4.4, 6], DF: [8, 11] } as Record<string, [number, number]>;
  const shot = { FW: [1.35, 1.75], MF: [1.9, 2.6], DF: [3.2, 4.2] } as Record<string, [number, number]>;
  const card = { FW: [5, 7], MF: [3.6, 4.6], DF: [3.1, 3.9] } as Record<string, [number, number]>;
  return [
    {
      id: `pt${selId++}`, name: 'Goalscorer', betBuilder: true, columns: ['Anytime goalscorer', 'First goalscorer', 'To score 2 or more'],
      rows: rows((pos, k) => { const a = between(...goal[pos]) * k; return [a, a * 2.3, pos === 'DF' ? null : a * 4.2]; }),
    },
    {
      id: `pt${selId++}`, name: 'Shots on target', betBuilder: true, columns: ['1+ shots on target', '2+ shots on target'],
      rows: rows((pos, k) => { const a = between(...shot[pos]) * k; return [a, a * 2.4]; }),
    },
    {
      id: `pt${selId++}`, name: 'Cards', betBuilder: true, columns: ['To be booked'],
      rows: rows((pos) => [between(...card[pos])]),
    },
  ];
}

/** Ready-made Bet Builder combinations for the top of the tab. */
function buildsFor(ev: EventDetail): BuildSuggestion[] {
  const m = (name: string) => ev.markets.find((x) => x.name === name);
  const fav = ev.mainMarket.selections[0].odds <= ev.mainMarket.selections[2].odds ? 0 : 2;
  const favTeam = fav === 0 ? ev.home : ev.away;
  const scorer = ev.players?.[0].rows.find((r) => r.team === (fav === 0 ? 'home' : 'away') && r.position === 'FW');
  const shots = ev.players?.[1].rows.find((r) => r.team === (fav === 0 ? 'home' : 'away') && r.position === 'FW');
  const list: BuildSuggestion[] = [];
  const o15 = m('Total goals 1.5')?.selections[0];
  const btts = m('Both teams to score')?.selections[0];
  const o25 = m('Total goals 2.5')?.selections[0];
  const corners = m('Total corners 9.5')?.selections[0];
  if (o15 && scorer?.cells[0]) list.push({ id: `bs${selId++}`, title: `${favTeam} win, over 1.5 goals, ${scorer.player} to score`, selectionIds: [ev.mainMarket.selections[fav].id, o15.id, scorer.cells[0].id] });
  if (btts && o25) list.push({ id: `bs${selId++}`, title: 'Both teams score, over 2.5 goals', selectionIds: [btts.id, o25.id] });
  if (corners && shots?.cells[0]) list.push({ id: `bs${selId++}`, title: `${favTeam} win, over 9.5 corners, ${shots.player} 1+ shot on target`, selectionIds: [ev.mainMarket.selections[fav].id, corners.id, shots.cells[0].id] });
  return list;
}

function timelineFor(home: string, away: string, minute: number, score: [number, number], cards: [number, number]): TimelineItem[] {
  const items: TimelineItem[] = [];
  const at = () => 2 + Math.floor(rand() * Math.max(1, minute - 3));
  ([0, 1] as const).forEach((team) => {
    for (let i = 0; i < score[team]; i++) items.push({ minute: at(), type: 'goal', team, text: `Goal · ${team === 0 ? home : away}` });
    for (let i = 0; i < cards[team]; i++) items.push({ minute: at(), type: 'card', team, text: `Yellow card · ${team === 0 ? home : away}` });
  });
  for (let i = 0; i < 2; i++) { const team = rand() < 0.5 ? 0 : 1; items.push({ minute: at(), type: 'corner', team, text: `Corner · ${team === 0 ? home : away}` }); }
  return items.sort((a, b) => b.minute - a.minute);
}

function h2hFor(home: string, away: string) {
  return Array.from({ length: 5 }, (_, i) => {
    const flip = rand() < 0.5;
    return { date: `${2025 - Math.floor(i / 2)}-${pick(['02', '04', '09', '11'])}-${10 + Math.floor(rand() * 18)}`, home: flip ? away : home, away: flip ? home : away, score: `${Math.floor(rand() * 4)}–${Math.floor(rand() * 3)}` };
  });
}

export const events: EventDetail[] = [];

function makeEvents() {
  const liveMinutes = [12, 23, 38, 45, 57, 66, 71, 84];
  for (const c of competitions) {
    const list = [...teams[c.id]];
    const pairs = Math.floor(list.length / 2);
    for (let i = 0; i < pairs; i++) {
      const home = list[i * 2];
      const away = list[i * 2 + 1];
      const isLive = rand() < (c.sportId === 'football' ? 0.16 : 0.25);
      const sportId = c.sportId;
      const markets = eventMarkets({ sportId, home, away });
      const main = sportId === 'football' ? threeWay() : twoWay('Winner', home, away);
            const minute = pick(liveMinutes);
      const ev: EventDetail = {
        id: `e${events.length + 101}`,
        sportId,
        competitionId: c.id,
        competitionName: `${c.region} · ${c.name}`,
        home,
        away,
        startTime: isLive ? minutes(-minute) : minutes(20 + Math.floor(Math.pow(rand(), 1.5) * 60 * 24 * 6)),
        mainMarket: main,
        markets: [main, ...markets],
        marketCount: 40 + Math.floor(rand() * 180),
        badges: [
          ...(rand() < 0.3 ? (['boost'] as const) : []),
          ...(sportId === 'football' ? (['betbuilder'] as const) : []),
          ...(isLive && rand() < 0.5 ? (['stream'] as const) : []),
        ],
        form: { home: formString(), away: formString() },
        winProbability: probs(main),
      };
      if (sportId === 'football') {
        ev.players = playerTables(probs(main)[0] / 100);
        ev.builds = buildsFor(ev);
        ev.h2h = h2hFor(home, away);
      }
      if (isLive) {
        const goalsH = Math.floor(rand() * (minute / 35 + 1));
        const goalsA = Math.floor(rand() * (minute / 40 + 1));
        ev.live = {
          minute,
          period: sportId === 'football' ? (minute > 45 ? '2H' : '1H') : sportId === 'basketball' ? `Q${Math.min(4, Math.ceil(minute / 12))}` : 'Set 2',
          score: sportId === 'basketball' ? [40 + goalsH * 11, 38 + goalsA * 12] : [goalsH, goalsA],
          cards: [Math.floor(rand() * 3), Math.floor(rand() * 3)],
          corners: [Math.floor(rand() * 7), Math.floor(rand() * 6)],
          lastAction: pick(['Corner', 'Free kick', 'Goal kick', 'Throw-in', 'Dangerous attack', 'Shot on target']) + ` · ${pick([home, away])}`,
          stats: [
            { label: 'Possession %', home: 40 + Math.floor(rand() * 21), away: 0 },
            { label: 'Shots on target', home: Math.floor(rand() * 7), away: Math.floor(rand() * 6) },
            { label: 'Attacks', home: 20 + Math.floor(rand() * 40), away: 20 + Math.floor(rand() * 40) },
            { label: 'Dangerous attacks', home: 8 + Math.floor(rand() * 25), away: 8 + Math.floor(rand() * 25) },
          ],
        };
        ev.live.stats![0].away = 100 - ev.live.stats![0].home;
        if (sportId === 'football') ev.live.timeline = timelineFor(home, away, minute, ev.live.score, ev.live.cards!);
      }
      events.push(ev);
    }
  }
  sports.forEach((s) => (s.liveCount = events.filter((e) => e.sportId === s.id && e.live).length));
}
function formString() {
  return Array.from({ length: 5 }, () => pick(['W', 'W', 'D', 'L'])).join('');
}
function probs(m: Market): [number, number, number] {
  const inv = m.selections.map((s) => 1 / s.odds);
  const sum = inv.reduce((a, b) => a + b, 0);
  const p = inv.map((x) => Math.round((x / sum) * 100));
  return m.selections.length === 3 ? [p[0], p[1], p[2]] : [p[0], 0, p[1]];
}
makeEvents();

/* ---------- Casino ---------- */

const providerNames = ['Pragmatic Play', 'Play’n GO', 'NetEnt', 'Playtech', 'EGT Digital', 'Hacksaw Gaming', 'Nolimit City', 'Red Tiger', 'Relax Gaming', 'Push Gaming', 'Amusnet', 'Spribe', '1x2 Gaming', '3 Oaks', 'Amatic', 'Novomatic', 'Wazdan', 'Yggdrasil'];

/** Filter taxonomy, following the reference's Themes and Features lists. */
export const THEMES = [
  'Adventure', 'African', 'American', 'Animals', 'Arabian', 'Asian', 'Baccarat', 'Beaches', 'Bingo', 'Blackjack', 'Books', 'Cards', 'Cartoon', 'Cash',
  'Casino', 'Celebrities', 'Chinese New Year', 'Christmas', 'Circus', 'Classic slots', 'Craps', 'Crash games', 'Crime', 'Day of the Dead', 'Dice',
  'Dragons', 'Easter', 'Egyptian', 'Elemental', 'Epic slots', 'Fairy tales', 'Fantasy', 'Farms', 'Festival', 'Fish', 'Food', 'Football', 'Forests',
  'Fruits', 'Gems', 'Glamour', 'Gold', 'Greco-Roman', 'Halloween', 'Historical', 'Horror', 'Horses', 'Ice', 'Irish', 'Joker', 'Jungle', 'Keno',
  'Live game shows', 'Luck', 'Luxury', 'Mafia', 'Magic', 'Maya', 'Medieval', 'Mexican', 'Mining', 'Monsters', 'Movie and music slots', 'Movies',
  'Music', 'Mystery', 'Mythology', 'Nature', 'Neon', 'Nordic', 'Oceans', 'Other', 'Party games', 'Pirates', 'Poker', 'Prehistoric', 'Retro',
  'Romance', 'Roulette', 'Sci-fi', 'Science', 'Scratch cards', 'Sic Bo', 'Space', 'Spies', 'Sports', 'Steampunk', 'Superheroes', 'Sweets',
  'Table games', 'Tiki', 'Transport', 'Travel', 'Urban', 'War', 'Western', 'Wildlife',
];
export const FEATURES = [
  'Expanding symbols', 'Walking wilds', 'Mystery symbols', 'Bonus game', 'Multiplier', 'Fixed paylines', 'Symbol collection', 'Random wilds',
  'Avalanche / cascading reels', 'Bonus Buy', 'Free spins', 'Gamble', 'Jackpots', 'Live', 'Mega symbols', 'Megaways', 'Respin', 'Scatter', 'Wilds', 'Sticky wilds',
];

const handNames = [
  'Olympus Thunder', 'Aegean Gold', 'Temple of Delphi', 'Midas Coin Rush', 'Kraken Reels', 'Lemon Grove 40', 'Santorini Sunset', 'Hydra Hold & Win',
  'Minotaur Maze', 'Golden Fleece', 'Seven Islands', 'Fruit Bazaar 100', 'Poseidon Pearls', 'Spartan Shields', 'Amphora Wilds', 'Zeus Lightning 1000',
  'Hermes Express', 'Athena Owl', 'Cyclops Megaways', 'Medusa Gaze', 'Lucky Drachma', 'Fig & Olive', 'Pegasus Rising', 'Titan Crash',
  'Nectar Bonanza', 'Bronze Age Bells', 'Ouzo Nights', 'Crete Treasures', 'Argo Voyage', 'Ionian Diamonds', 'Hot Peppers 20', 'Star Drop Pots',
];
const ADJ = ['Golden', 'Wild', 'Lucky', 'Mega', 'Royal', 'Mystic', 'Blazing', 'Crystal', 'Neon', 'Frozen', 'Sacred', 'Thunder'];
const NOUN = ['Pharaoh', 'Dragon', 'Pirates', 'Jungle', 'Fortune', 'Riches', 'Legends', 'Nights', 'Safari', 'Vault', 'Carnival', 'Galaxy'];
const generated: string[] = [];
for (let i = 0; generated.length < 100; i++) {
  const n = `${ADJ[i % ADJ.length]} ${NOUN[(i * 5 + Math.floor(i / ADJ.length)) % NOUN.length]}${i % 4 === 0 ? ' 1000' : i % 7 === 0 ? ' Megaways' : ''}`;
  if (!generated.includes(n)) generated.push(n);
}
const gameNames = [...handNames, ...generated];
const motifs: Game['art']['motif'][] = ['sun', 'wave', 'column', 'star', 'gem', 'leaf'];

const THEME_HINTS: [RegExp, string][] = [
  [/Olympus|Zeus|Athena|Hermes|Poseidon|Medusa|Minotaur|Hydra|Cyclops|Pegasus|Titan|Spartan|Argo|Fleece|Delphi|Amphora/, 'Greco-Roman'],
  [/Zeus|Poseidon|Medusa|Minotaur|Hydra|Cyclops|Pegasus|Titan|Athena|Hermes/, 'Mythology'],
  [/Fruit|Lemon|Fig|Peppers|Nectar/, 'Fruits'], [/Gold|Midas|Drachma|Riches|Vault/, 'Gold'], [/Diamond|Pearls|Crystal|Gems/, 'Gems'],
  [/Pharaoh/, 'Egyptian'], [/Dragon/, 'Dragons'], [/Pirates|Kraken/, 'Pirates'], [/Jungle|Safari/, 'Jungle'], [/Safari/, 'Wildlife'],
  [/Galaxy|Star/, 'Space'], [/Carnival/, 'Festival'], [/Islands|Santorini|Ionian|Crete|Aegean/, 'Travel'], [/Kraken|Pearls|Poseidon|Ionian/, 'Oceans'],
  [/Bells|Seven|Hot Peppers/, 'Classic slots'], [/Lucky|Fortune/, 'Luck'], [/Neon/, 'Neon'], [/Frozen/, 'Ice'], [/Crash/, 'Crash games'],
  [/Legends|Sacred|Mystic/, 'Fantasy'], [/Ouzo|Nights/, 'Music'],
];

export const games: Game[] = gameNames.map((name, i) => {
  const rtp = round2(94 + rand() * 3.4);
  const volatility = pick(['low', 'medium', 'high', 'high'] as const);
  const jackpot = rand() < 0.18 ? Math.round(5_000 + rand() * 250_000) : undefined;
  const themes = new Set(THEME_HINTS.filter(([re]) => re.test(name)).map(([, t]) => t));
  themes.add(THEMES[(i * 7) % THEMES.length]); // spread the catalogue so every theme has games
  if (themes.size < 2) themes.add(pick(THEMES));
  const features = new Set<string>([pick(FEATURES), pick(FEATURES), pick(['Free spins', 'Wilds', 'Scatter', 'Multiplier'])]);
  const bonusBuy = rand() < 0.35;
  if (bonusBuy) features.add('Bonus Buy');
  if (jackpot) features.add('Jackpots');
  if (/Megaways/.test(name)) features.add('Megaways');
  if (/Hold|Wilds/.test(name)) features.add('Wilds');
  features.delete('Live');
  const tags: string[] = [];
  if (rtp > 96.5) tags.push('high-rtp');
  if (volatility === 'high') tags.push('high-volatility');
  if (themes.has('Fruits')) tags.push('fruits');
  if (features.has('Wilds')) tags.push('wilds');
  if (jackpot) tags.push('jackpot');
  return {
    id: `g${i + 1}`,
    name,
    provider: providerNames[(i * 5) % providerNames.length],
    category: name.includes('Crash') ? 'crash' : 'slots',
    tags,
    themes: [...themes],
    features: [...features],
    popularity: Math.round(1000 - i * 6 + rand() * 120),
    rtp,
    volatility,
    minBet: pick([0.1, 0.1, 0.2, 0.25, 0.5]),
    bonusBuy,
    isNew: i >= 24 && i < 36,
    exclusive: i % 7 === 0,
    jackpot,
    art: { hue: Math.floor(rand() * 360), motif: motifs[i % motifs.length] },
  };
});

const ids = (from: number, to: number) => games.slice(from, to).map((g) => g.id);
export const collections: Collection[] = [
  { id: 'exclusives', title: 'EnterG exclusives', gameIds: games.filter((g) => g.exclusive).map((g) => g.id).concat(ids(3, 7)) },
  { id: 'new', title: 'New this week', gameIds: games.filter((g) => g.isNew).map((g) => g.id) },
  { id: 'top-greece', title: 'Top 10 in Greece', gameIds: ['g1', 'g16', 'g2', 'g8', 'g12', 'g5', 'g20', 'g3', 'g13', 'g9'] },
  { id: 'jackpots', title: 'Jackpot games', gameIds: games.filter((g) => g.jackpot).map((g) => g.id) },
  { id: 'high-rtp', title: 'High RTP', gameIds: games.filter((g) => g.tags.includes('high-rtp')).map((g) => g.id) },
  { id: 'bonus-buy', title: 'Bonus Buy', gameIds: games.filter((g) => g.bonusBuy).map((g) => g.id) },
  { id: 'greek-myths', title: 'Greek myths', gameIds: games.filter((g) => g.themes.includes('Greco-Roman')).map((g) => g.id) },
];

export const providers: Provider[] = providerNames.map((name) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  name,
  gameCount: games.filter((g) => g.provider === name).length,
}));

export const jackpots: Jackpot[] = [
  { id: 'jp-amusnet', provider: 'Amusnet', tiers: [{ name: 'Spades', amount: 412_380.55 }, { name: 'Hearts', amount: 38_102.1 }, { name: 'Diamonds', amount: 4_311.62 }, { name: 'Clubs', amount: 612.4 }] },
  { id: 'jp-egt', provider: 'EGT Digital', tiers: [{ name: 'Grand', amount: 158_220.3 }, { name: 'Major', amount: 21_044.9 }, { name: 'Minor', amount: 1_208.1 }, { name: 'Mini', amount: 104.5 }] },
  { id: 'jp-playtech', provider: 'Playtech', tiers: [{ name: 'Ultimate', amount: 1_942_008.0 }, { name: 'Super', amount: 52_660.7 }, { name: 'Extra', amount: 2_904.2 }, { name: 'Power', amount: 211.3 }] },
];

const dealers = ['Eleni', 'Nikos', 'Daphne', 'Yannis', 'Ioanna', 'Kostas', 'Sofia', 'Petros', 'Marina', 'Alexis', 'Zoe', 'Christos'];
export const liveTables: LiveTable[] = [
  { id: 't1', name: 'Greek Roulette', kind: 'roulette', provider: 'Evolution', dealer: dealers[0], minBet: 0.2, maxBet: 5000, language: 'Greek', exclusive: true, results: [17, 32, 4, 0, 21], players: 412, art: { hue: 205 } },
  { id: 't2', name: 'EnterG Blackjack', kind: 'blackjack', provider: 'Evolution', dealer: dealers[1], minBet: 5, maxBet: 2500, language: 'Greek', exclusive: true, seats: { taken: 4, total: 7 }, players: 89, art: { hue: 152 } },
  { id: 't3', name: 'Lightning Roulette', kind: 'roulette', provider: 'Evolution', dealer: dealers[2], minBet: 0.2, maxBet: 2000, language: 'English', results: [8, 11, 29, 36, 2], players: 2810, art: { hue: 48 } },
  { id: 't4', name: 'Crazy Time', kind: 'gameshow', provider: 'Evolution', dealer: dealers[3], minBet: 0.1, maxBet: 2500, language: 'English', players: 9120, art: { hue: 320 } },
  { id: 't5', name: 'Platinum Blackjack', kind: 'blackjack', provider: 'Pragmatic Live', dealer: dealers[4], minBet: 50, maxBet: 10000, language: 'Greek', exclusive: true, seats: { taken: 6, total: 7 }, players: 23, art: { hue: 260 } },
  { id: 't6', name: 'Mega Wheel', kind: 'gameshow', provider: 'Pragmatic Live', dealer: dealers[5], minBet: 0.1, maxBet: 1000, language: 'English', players: 3440, art: { hue: 15 } },
  { id: 't7', name: 'Speed Baccarat', kind: 'baccarat', provider: 'Evolution', dealer: dealers[6], minBet: 1, maxBet: 5000, language: 'English', players: 640, art: { hue: 0 } },
  { id: 't8', name: 'Auto Roulette Athens', kind: 'roulette', provider: 'Pragmatic Live', dealer: 'Auto', minBet: 0.1, maxBet: 1000, language: 'Greek', results: [26, 3, 3, 14, 30], players: 220, art: { hue: 180 } },
  { id: 't9', name: 'Blackjack Classic 12', kind: 'blackjack', provider: 'Evolution', dealer: dealers[7], minBet: 10, maxBet: 2000, language: 'English', seats: { taken: 7, total: 7 }, players: 51, art: { hue: 110 } },
  { id: 't10', name: 'Casino Hold’em', kind: 'poker', provider: 'Evolution', dealer: dealers[8], minBet: 1, maxBet: 500, language: 'English', players: 180, art: { hue: 280 } },
  { id: 't11', name: 'Quantum Roulette', kind: 'roulette', provider: 'Playtech', dealer: dealers[9], minBet: 0.2, maxBet: 2500, language: 'Greek', results: [1, 19, 33, 7, 12], players: 760, art: { hue: 230 } },
  { id: 't12', name: 'Dream Catcher', kind: 'gameshow', provider: 'Evolution', dealer: dealers[10], minBet: 0.1, maxBet: 5000, language: 'English', players: 1450, art: { hue: 95 } },
];

/* ---------- Virtuals ---------- */

export const virtualLeagues: VirtualLeague[] = [
  { id: 'v-gr', sport: 'Football', name: 'Greek League' },
  { id: 'v-euro', sport: 'Football', name: 'Euro Cup' },
  { id: 'v-world', sport: 'Football', name: 'World Stars' },
  { id: 'v-nba', sport: 'Basketball', name: 'US Arena' },
  { id: 'v-euro-b', sport: 'Basketball', name: 'Euro Champions' },
  { id: 'v-horses', sport: 'Horses', name: 'Parkway Downs' },
  { id: 'v-dogs', sport: 'Greyhounds', name: 'City Park' },
  { id: 'v-tennis', sport: 'Tennis', name: 'Grand Court' },
];
const vTeams: Record<string, string[]> = {
  'v-gr': ['Athina FC', 'Thessaloniki', 'Patra United', 'Heraklion', 'Larisa', 'Volos Port'],
  'v-euro': ['Lisboa', 'Milano', 'Bremen', 'Lyon', 'Napoli', 'Porto'],
  'v-world': ['Rio', 'Buenos Aires', 'Madrid', 'London', 'Paris', 'Munich'],
  'v-nba': ['Boston Harps', 'Miami Cruisers', 'Denver Peaks', 'LA Waves'],
  'v-euro-b': ['Athens Owls', 'Belgrade Wolves', 'Kaunas Storm', 'Madrid Kings'],
  'v-tennis': ['R. Kostas', 'M. Ellis', 'T. Ward', 'P. Ivanov'],
};
/** Virtual selections are generated on the fly, so the mock bet engine looks them up here. */
export const virtualSelections = new Map<string, { eventId: string; eventName: string; marketName: string; label: string; odds: number }>();

export function makeVirtualEvents(): VirtualEvent[] {
  const list = virtualLeagues.map((l, i) => {
    const startsAt = new Date(Date.now() + (40 + i * 35) * 1000).toISOString();
    let market: Market;
    if (l.sport === 'Horses' || l.sport === 'Greyhounds') {
      const runners = l.sport === 'Horses' ? ['Silver Arrow', 'Meltemi', 'Night Owl', 'Kalamata Star', 'Red Tide', 'Olive Branch'] : ['Trap 1 Blue Flash', 'Trap 2 Zephyr', 'Trap 3 Ruby', 'Trap 4 Bolt', 'Trap 5 Iris', 'Trap 6 Dusty'];
      market = { id: `vm${i}`, name: 'Winner', group: 'popular', betBuilder: false, selections: runners.map((r) => sel(r, 2.5 + rand() * 12)) };
    } else if (l.sport === 'Football') {
      market = threeWay();
    } else {
      market = twoWay();
    }
    const t = vTeams[l.id] ?? [];
    return {
      id: `ve${i}`,
      leagueId: l.id,
      leagueName: l.name,
      sport: l.sport,
      startsAt,
      market: t.length ? { ...market, selections: market.selections.map((s, si) => ({ ...s, label: market.selections.length === 3 ? s.label : t[si] ?? s.label })) } : market,
      ...(t.length ? { home: t[0], away: t[1] } : {}),
    };
  });
  for (const e of list) {
    const name = e.home ? `${e.home} – ${e.away}` : `${e.leagueName} race`;
    for (const s of e.market.selections) virtualSelections.set(s.id, { eventId: e.id, eventName: name, marketName: e.market.name, label: s.label, odds: s.odds });
  }
  return list;
}

/* ---------- Player (demo account) ---------- */

export const demoPlayer: Player = {
  id: 'p-1029',
  username: 'demo_player',
  firstName: 'Demo',
  lastName: 'Player',
  dateOfBirth: '1988-05-14',
  email: 'demo.player@example.com',
  phone: '+30 690 000 0000',
  address: '1 Example Street, Athens 105 57',
  favouriteTeam: 'Panathinaikos',
  kycStatus: 'verified',
  memberSince: '2021-08-09',
};

export const demoBalance = { currency: 'EUR' as const, total: 248.6, bettingAvailable: 248.6, withdrawable: 213.6, bonus: 35 };

export const demoLimits: Limit[] = [
  { kind: 'deposit', period: 'weekly', value: 500, setAt: '2026-08-21T09:00:00Z' },
  { kind: 'loss', period: 'monthly', value: 1000, setAt: '2026-08-09T17:03:00Z' },
  { kind: 'time', period: 'daily', value: 4, setAt: '2026-08-09T17:03:00Z' },
];

export const paymentMethods: PaymentMethod[] = [
  { id: 'card', name: 'Debit / credit card', group: 'bank', speed: 'Instant', min: 5, max: 40_000, quickAmounts: [20, 50, 100], savedInstrument: 'Visa •••• 4821' },
  { id: 'bank-instant', name: 'Instant bank payment', group: 'bank', speed: 'Instant', min: 10, max: 20_000, quickAmounts: [50, 100, 250] },
  { id: 'iris', name: 'IRIS online payments', group: 'bank', speed: 'Instant', min: 5, max: 10_000, quickAmounts: [20, 50, 100] },
  { id: 'apple-pay', name: 'Apple Pay', group: 'wallet', speed: 'Instant', min: 5, max: 5_000, quickAmounts: [20, 50, 100] },
  { id: 'google-pay', name: 'Google Pay', group: 'wallet', speed: 'Instant', min: 5, max: 5_000, quickAmounts: [20, 50, 100] },
  { id: 'paypal', name: 'PayPal', group: 'wallet', speed: 'Instant', min: 10, max: 10_000, quickAmounts: [20, 50, 100] },
  { id: 'skrill', name: 'Skrill', group: 'wallet', speed: 'Instant', min: 10, max: 10_000, quickAmounts: [20, 50, 100] },
  { id: 'paysafecard', name: 'Paysafecard', group: 'cash', speed: 'Usually within 5 minutes', min: 10, max: 1_000, quickAmounts: [10, 25, 50] },
  { id: 'voucher', name: 'Retail top-up voucher', group: 'cash', speed: 'Instant', min: 5, max: 500, quickAmounts: [10, 20, 50] },
];

export const withdrawalMethods: PaymentMethod[] = [
  { id: 'bank-gr', name: 'Bank transfer (Greek bank)', group: 'bank', speed: 'Usually within 24 hours', min: 10, max: 50_000, quickAmounts: [50, 100, 200], savedInstrument: 'IBAN GR•• •••• 0417' },
  { id: 'bank-intl', name: 'Bank transfer (foreign bank)', group: 'bank', speed: 'Usually within 3 working days', min: 50, max: 50_000, quickAmounts: [100, 200, 500] },
  { id: 'card', name: 'Visa •••• 4821', group: 'bank', speed: 'Usually within 1 hour', min: 10, max: 5_000, quickAmounts: [50, 100, 200] },
  { id: 'paypal', name: 'PayPal', group: 'wallet', speed: 'Usually within 1 hour', min: 10, max: 10_000, quickAmounts: [50, 100, 200] },
];

const day = 86_400_000;
export const demoTransactions: Transaction[] = [
  { id: 'tx-9921', type: 'deposit', amount: 100, method: 'Visa •••• 4821', status: 'completed', createdAt: new Date(now - 0.2 * day).toISOString(), reference: 'DP-20261003-9921' },
  { id: 'tx-9919', type: 'bet', amount: -10, status: 'completed', createdAt: new Date(now - 0.3 * day).toISOString(), reference: 'BT-55120' },
  { id: 'tx-9915', type: 'win', amount: 42.5, status: 'completed', createdAt: new Date(now - 1.1 * day).toISOString(), reference: 'BT-55098' },
  { id: 'tx-9907', type: 'withdrawal', amount: -150, method: 'Bank transfer (Greek bank)', status: 'pending', createdAt: new Date(now - 1.6 * day).toISOString(), reference: 'WD-20261001-9907' },
  { id: 'tx-9890', type: 'bonus', amount: 35, method: 'Welcome offer', status: 'completed', createdAt: new Date(now - 3 * day).toISOString(), reference: 'BN-WELCOME' },
  { id: 'tx-9874', type: 'deposit', amount: 50, method: 'Apple Pay', status: 'completed', createdAt: new Date(now - 5 * day).toISOString(), reference: 'DP-20260928-9874' },
  { id: 'tx-9861', type: 'bet', amount: -25, status: 'completed', createdAt: new Date(now - 6 * day).toISOString(), reference: 'BT-54870' },
  { id: 'tx-9842', type: 'deposit', amount: 20, method: 'Paysafecard', status: 'failed', createdAt: new Date(now - 9 * day).toISOString(), reference: 'DP-20260924-9842' },
];

const liveFootball = events.filter((e) => e.live && e.sportId === 'football');
const legOf = (e: EventDetail, m: Market, i: number, placedAt: number) => ({
  selectionId: m.selections[i].id, eventId: e.id, eventName: `${e.home} – ${e.away}`, marketName: m.name, label: m.selections[i].label, odds: Math.round(m.selections[i].odds * placedAt * 100) / 100, live: true,
});
const openLegs = [
  legOf(liveFootball[0], liveFootball[0].mainMarket, 0, 1.18),
  legOf(liveFootball[1], liveFootball[1].markets[1], 0, 1.1),
];
const openSingle = legOf(liveFootball[2] ?? liveFootball[0], (liveFootball[2] ?? liveFootball[0]).mainMarket, 0, 1.25);
const comboOdds = Math.round(openLegs[0].odds * openLegs[1].odds * 100) / 100;

export const demoBets: Bet[] = [
  { id: 'BT-55120', placedAt: new Date(now - 0.05 * day).toISOString(), kind: 'combo', stake: 10, totalOdds: comboOdds, potentialReturn: Math.round(10 * comboOdds * 100) / 100, status: 'open', legs: openLegs },
  { id: 'BT-55131', placedAt: new Date(now - 0.03 * day).toISOString(), kind: 'single', stake: 20, totalOdds: openSingle.odds, potentialReturn: Math.round(20 * openSingle.odds * 100) / 100, status: 'open', legs: [openSingle] },
  {
    id: 'BT-55098', placedAt: new Date(now - 1.2 * day).toISOString(), kind: 'single', stake: 25, totalOdds: 1.7, potentialReturn: 42.5, status: 'won',
    legs: [{ selectionId: 'x3', eventId: 'e900', eventName: 'Panathinaikos – Real Madrid', marketName: 'Winner', label: 'Panathinaikos', odds: 1.7 }],
  },
  {
    id: 'BT-54870', placedAt: new Date(now - 6 * day).toISOString(), kind: 'combo', stake: 25, totalOdds: 7.9, potentialReturn: 197.5, status: 'lost',
    legs: [
      { selectionId: 'x4', eventId: 'e901', eventName: 'AEK Athens – PAOK', marketName: 'Both teams to score', label: 'Yes', odds: 1.8 },
      { selectionId: 'x5', eventId: 'e902', eventName: 'Inter – Arsenal', marketName: 'Match result', label: 'X', odds: 3.4 },
      { selectionId: 'x6', eventId: 'e903', eventName: 'S. Tsitsipas – A. Zverev', marketName: 'Winner', label: 'S. Tsitsipas', odds: 1.29 },
    ],
  },
];

/* ---------- CMS ---------- */

export const promos: Promo[] = [
  { id: 'welcome', title: 'Welcome offer', subtitle: '100% up to €100 on your first deposit', cta: 'Join now', vertical: 'all', hue: 38, kind: 'welcome' },
  { id: 'boost', title: 'Derby boost', subtitle: 'Olympiacos – Panathinaikos: both to score boosted to 2.40', cta: 'Add to slip', vertical: 'sports', hue: 200, kind: 'boost' },
  { id: 'tournament', title: 'Autumn spins tournament', subtitle: '€50,000 prize pool across 40 slots', cta: 'See games', vertical: 'casino', hue: 280, kind: 'tournament' },
  { id: 'freebet', title: '€5 free bet', subtitle: 'Place 3 combo bets on the Nations League this weekend', cta: 'How it works', vertical: 'sports', hue: 160, kind: 'freebet' },
  { id: 'cashback', title: 'Live table cashback', subtitle: '10% back every Sunday on Greek tables', cta: 'Play live', vertical: 'live-casino', hue: 12, kind: 'cashback' },
];

/* ---------- Stories (CMS) ---------- */
// One strip per product page. A group with several slides shows as a wide card with a count.

export const stories: StoryGroup[] = [
  // Sports
  { id: 'st-welcome', vertical: 'all', title: 'Welcome offer', icon: 'gift', hue: 38, slides: [
    { id: 's1', title: 'Welcome offer', body: '100% of your first deposit, up to €100, as bonus money.', cta: 'Join now', to: 'register', motif: 'sun' },
  ] },
  { id: 'st-derby', vertical: 'sports', title: 'Derby boost', label: 'Odds boosts', icon: 'live', hue: 200, slides: [
    { id: 's1', title: 'Olympiacos – Panathinaikos', body: 'Both teams to score, boosted from 1.95 to 2.40.', cta: 'See the match', to: '/sport/football/competition/gr-sl', motif: 'star' },
    { id: 's2', title: 'Bet Builder boost', body: '+10% on any Bet Builder with 3 or more selections this weekend.', cta: 'Build a bet', to: '/sport/football', motif: 'gem' },
  ] },
  { id: 'st-freebet', vertical: 'sports', title: '€5 free bet', icon: 'bets', hue: 160, slides: [
    { id: 's1', title: '€5 free bet', body: 'Place 3 combo bets on the Nations League and get a €5 free bet on Monday.', cta: 'See matches', to: '/sport/football/competition/unl', motif: 'leaf' },
  ] },
  { id: 'st-euroleague', vertical: 'sports', title: 'EuroLeague week', label: 'Basketball', icon: 'basketball', hue: 18, slides: [
    { id: 's1', title: 'EuroLeague week', body: 'Panathinaikos and Olympiacos play twice. Full markets on every game.', cta: 'Open EuroLeague', to: '/sport/basketball/competition/euroleague', motif: 'column' },
    { id: 's2', title: 'Player points', body: 'New: player points, rebounds and assists on every EuroLeague game.', cta: 'Open EuroLeague', to: '/sport/basketball/competition/euroleague', motif: 'star' },
    { id: 's3', title: 'Cash out', body: 'Cash out any open basketball bet, in full or in part.', cta: 'My bets', to: '/account/bets', motif: 'wave' },
  ] },
  { id: 'st-coupon', vertical: 'sports', title: 'Today’s coupon', icon: 'history', hue: 230, slides: [
    { id: 's1', title: 'Today’s coupon', body: 'Every match kicking off today, in one list.', cta: 'Open coupon', to: '/sport/football/coupon?w=today', motif: 'wave' },
  ] },
  // Live
  { id: 'st-live-stream', vertical: 'live', title: 'Watch live', icon: 'live', hue: 0, slides: [
    { id: 's1', title: 'Watch and bet', body: 'Live streams on hundreds of matches every week. Look for the Stream tag.', cta: 'Live now', to: '/live', motif: 'sun' },
  ] },
  { id: 'st-live-cash', vertical: 'live', title: 'Early payout', label: 'Live specials', icon: 'star', hue: 140, slides: [
    { id: 's1', title: 'Two goals ahead', body: 'Your 1X2 single pays out if your team goes two goals up.', cta: 'Live football', to: '/live', motif: 'gem' },
    { id: 's2', title: 'Next goal', body: 'Next goal markets reopen within seconds after every goal.', cta: 'Live football', to: '/live', motif: 'star' },
  ] },
  // Casino
  { id: 'st-missions', vertical: 'casino', title: 'Casino missions', label: 'Casino missions', icon: 'casino', hue: 250, slides: [
    { id: 's1', title: 'Saturday quests', body: 'Play 50 spins on any featured slot and unlock 40 free spins.', cta: 'Join now', to: '/casino', motif: 'star' },
    { id: 's2', title: 'Sunday drops', body: 'Random cash drops every hour on Greek myths slots.', cta: 'See games', to: '/casino/c/greek-myths', motif: 'gem' },
  ] },
  { id: 'st-tournament', vertical: 'casino', title: '€50,000 tournament', icon: 'star', hue: 285, slides: [
    { id: 's1', title: 'Autumn spins tournament', body: '€50,000 prize pool across 40 slots. Top 500 players win.', cta: 'See games', to: '/casino/c/exclusives', motif: 'sun' },
  ] },
  { id: 'st-newprovider', vertical: 'casino', title: 'New provider', icon: 'gift', hue: 330, slides: [
    { id: 's1', title: 'Yggdrasil is here', body: 'Six new slots, exclusive in Greece for two weeks.', cta: 'Play now', to: '/casino/provider/yggdrasil', motif: 'leaf' },
  ] },
  { id: 'st-jackpots', vertical: 'casino', title: 'Jackpots', icon: 'wallet', hue: 45, slides: [
    { id: 's1', title: 'Jackpots climbing', body: 'Four jackpot networks, one over €1.9 million.', cta: 'See jackpots', to: '/casino/jackpots', motif: 'gem' },
  ] },
  { id: 'st-rg', vertical: 'all', title: 'Play responsibly', icon: 'shield', hue: 190, slides: [
    { id: 's1', title: 'Set your limits', body: 'Deposit, loss and time limits take 30 seconds to set.', cta: 'Set limits', to: '/account/protection', motif: 'wave' },
  ] },
  // Live casino
  { id: 'st-greek-tables', vertical: 'live-casino', title: 'Greek tables', label: 'Live casino', icon: 'livecasino', hue: 205, slides: [
    { id: 's1', title: 'Greek Roulette', body: 'Greek-speaking dealers every day from noon to 4am.', cta: 'Play live', to: '/live-casino', motif: 'sun' },
    { id: 's2', title: 'EnterG Blackjack', body: 'Seven seats, €5 minimum, bet behind when the table is full.', cta: 'Play live', to: '/live-casino', motif: 'gem' },
  ] },
  { id: 'st-cashback', vertical: 'live-casino', title: '10% cashback', icon: 'transfer', hue: 12, slides: [
    { id: 's1', title: 'Sunday cashback', body: '10% back on net losses at Greek tables, every Sunday.', cta: 'Play live', to: '/live-casino', motif: 'wave' },
  ] },
  { id: 'st-gameshows', vertical: 'live-casino', title: 'Game shows', icon: 'star', hue: 320, slides: [
    { id: 's1', title: 'Crazy Saturdays', body: 'Prize drops on every game show round on Saturday night.', cta: 'Play live', to: '/live-casino', motif: 'star' },
  ] },
  // Virtuals
  { id: 'st-virtuals', vertical: 'virtuals', title: 'Virtuals 24/7', icon: 'virtuals', hue: 175, slides: [
    { id: 's1', title: 'A match every 3 minutes', body: 'Greek League, Euro Cup and World Stars, around the clock.', cta: 'Play virtuals', to: '/virtuals', motif: 'column' },
  ] },
  { id: 'st-racing', vertical: 'virtuals', title: 'Racing', label: 'Virtual racing', icon: 'star', hue: 95, slides: [
    { id: 's1', title: 'Horses', body: 'Parkway Downs runs every 4 minutes. Win and place markets.', cta: 'See races', to: '/virtuals', motif: 'leaf' },
    { id: 's2', title: 'Greyhounds', body: 'City Park, six traps, races every 2 minutes.', cta: 'See races', to: '/virtuals', motif: 'wave' },
  ] },
];
