// Shared data contracts between the front end and the API gateway (BFF).
// Every screen reads these shapes only, never a vendor's raw payload.
// When the real back end is connected, the gateway maps each vendor API onto these types.

export type Currency = string;

/* ---------- Sportsbook ---------- */

export interface Sport {
  id: string;
  name: string;
  icon: string; // key into the icon set
  liveCount: number;
}

export interface Competition {
  id: string;
  sportId: string;
  name: string;
  region: string; // country or area shown with the league name
  group: 'europe-main' | 'europe-other' | 'americas' | 'world' | 'international';
  featured?: boolean;
  eventCount?: number;
}

export interface Selection {
  id: string;
  label: string; // "1", "X", "Over 2.5", "Olympiacos"
  odds: number;
  suspended?: boolean;
  /** -1 drifted, 1 shortened, 0 unchanged since last push. UI flashes the button. */
  trend?: -1 | 0 | 1;
}

export type MarketGroup = 'popular' | 'goals' | 'combos' | 'asian' | 'specials' | 'players';

export interface Market {
  id: string;
  name: string;
  group: MarketGroup;
  betBuilder: boolean;
  selections: Selection[];
}

export interface TimelineItem {
  minute: number;
  type: 'goal' | 'card' | 'corner' | 'sub';
  team: 0 | 1;
  text: string;
}

export interface LiveState {
  minute: number;
  period: string; // "1H", "2H", "Q3", "Set 2"
  score: [number, number];
  cards?: [number, number];
  corners?: [number, number];
  lastAction?: string;
  stats?: { label: string; home: number; away: number }[];
  /** Key match events, newest first (match centre Timeline tab). */
  timeline?: TimelineItem[];
}

/** Player markets as one table: a row per player, a column per market (Anytime, First, 2+ …). */
export interface PlayerTable {
  id: string;
  name: string; // "Goalscorer", "Shots on target", "Cards"
  columns: string[]; // market names, one per column
  betBuilder: boolean;
  rows: { player: string; team: 'home' | 'away'; position: string; cells: (Selection | null)[] }[];
}

/** Ready-made Bet Builder combination shown at the top of the Bet Builder tab. */
export interface BuildSuggestion {
  id: string;
  title: string;
  selectionIds: string[];
}

/** Fast ("next event") market on a live match: open for a short window, then settles. */
export interface MicroMarket {
  id: string;
  eventId: string;
  title: string; // "Corner in the next 5 minutes"
  window: string; // "63′–68′"
  opensAt: string;
  closesAt: string;
  status: 'open' | 'settling' | 'settled';
  selections: Selection[];
  result?: string; // shown after settlement
}

export interface SportEvent {
  id: string;
  sportId: string;
  competitionId: string;
  competitionName: string;
  home: string;
  away: string;
  startTime: string; // ISO
  live?: LiveState;
  mainMarket: Market;
  badges?: ('boost' | 'betbuilder' | 'stream')[];
  marketCount: number;
}

export interface EventDetail extends SportEvent {
  markets: Market[];
  form?: { home: string; away: string }; // "WWDLW"
  winProbability?: [number, number, number];
  players?: PlayerTable[];
  builds?: BuildSuggestion[];
  h2h?: { date: string; home: string; away: string; score: string }[];
}

/* ---------- Bets ---------- */

export interface SlipSelection {
  selectionId: string;
  eventId: string;
  eventName: string;
  marketName: string;
  label: string;
  odds: number;
  live?: boolean;
  /** Bet Builder line: the legs inside this one selection. */
  builder?: { selectionId: string; label: string; marketName: string }[];
  /** Fast (micro) market selection. */
  fast?: boolean;
  /** Open bets only: the leg's odds right now, as the trading platform sees them (drives cash-out). */
  oddsNow?: number;
}

export type BetStatus = 'open' | 'won' | 'lost' | 'cashed_out' | 'void';

export interface Bet {
  id: string;
  placedAt: string;
  kind: 'single' | 'combo';
  stake: number;
  totalOdds: number;
  potentialReturn: number;
  status: BetStatus;
  legs: SlipSelection[];
  cashOutValue?: number;
  /** Auto cash-out target: the gateway cashes out when the value reaches it. */
  autoCashOut?: number;
  /** Money already taken through partial cash-outs. */
  cashedOut?: number;
}

export interface PlaceBetRequest {
  kind: 'single' | 'combo';
  stakes: { selectionIds: string[]; stake: number }[];
  acceptOddsChanges: boolean;
}

/* ---------- Casino ---------- */

export interface Mission {
  id: string;
  title: string;
  detail: string;
  progress: number;
  target: number;
  xp: number;
  status: 'active' | 'done' | 'claimed';
}

export interface Tournament {
  id: string;
  title: string;
  rule: string; // how the leaderboard is scored
  prize: string;
  endsAt: string;
  joined: boolean;
  gameIds: string[];
  leaderboard: { rank: number; name: string; score: number }[];
  me?: { rank: number; score: number };
}

export interface Rewards {
  level: number;
  xp: number;
  levelFrom: number; // XP where this level started
  levelTo: number; // XP needed for the next level
  nextReward: string;
  missions: Mission[];
  missionsResetAt: string;
  tournaments: Tournament[];
}

export interface Game {
  id: string;
  name: string;
  provider: string;
  category: 'slots' | 'table' | 'crash' | 'live';
  tags: string[]; // quick-filter tags: "high-rtp", "high-volatility", "fruits", "wilds", "jackpot"
  themes: string[]; // from the filter taxonomy (Egyptian, Fruits, Mythology, …)
  features: string[]; // from the filter taxonomy (Free spins, Megaways, Bonus Buy, …)
  popularity: number; // used for "Most popular" sorting
  rtp: number;
  volatility: 'low' | 'medium' | 'high';
  minBet: number;
  bonusBuy?: boolean;
  isNew?: boolean;
  exclusive?: boolean;
  jackpot?: number;
  art: { hue: number; motif: 'sun' | 'wave' | 'column' | 'star' | 'gem' | 'leaf' };
}

export interface Collection {
  id: string;
  title: string;
  gameIds: string[];
  layout?: 'rail' | 'hero';
}

export interface Provider {
  id: string;
  name: string;
  gameCount: number;
}

export interface Jackpot {
  id: string;
  provider: string;
  tiers: { name: string; amount: number }[];
}

export interface LiveTable {
  id: string;
  name: string;
  kind: 'roulette' | 'blackjack' | 'baccarat' | 'gameshow' | 'poker';
  provider: string;
  dealer: string;
  minBet: number;
  maxBet: number;
  language: 'Greek' | 'English';
  exclusive?: boolean;
  results?: number[]; // roulette numbers, newest first
  seats?: { taken: number; total: number };
  players: number;
  art: { hue: number };
}

/* ---------- Virtuals ---------- */

export interface VirtualLeague {
  id: string;
  sport: 'Football' | 'Basketball' | 'Horses' | 'Greyhounds' | 'Tennis';
  name: string;
}

export interface VirtualEvent {
  id: string;
  leagueId: string;
  leagueName: string;
  sport: VirtualLeague['sport'];
  startsAt: string;
  home?: string;
  away?: string;
  market: Market;
}

/* ---------- Player account (PAM) ---------- */

export interface PersonalDetails {
  gender: string; addressLine2: string; postcode: string; countryCode: string; region: string;
  language: string; landline: string; timezoneOffset: number | null; timezoneName: string;
  timezoneId: number | null; promoCode: string; promoCodeEditable: boolean;
  countryOfBirth: string; nationality: string; identityNumber: string; identityType: number | null;
  resultsEmail: boolean | null; finalScoreUpdates: boolean | null; liveScoreUpdates: boolean | null;
  resultsSmsPush: boolean | null; contactEmail: boolean | null; weeklyPromotions: boolean | null;
  dailyPromotions: boolean | null; aiSuggestions: boolean | null; autoFavouriteLeagues: boolean | null;
}

export interface Player {
  details?: PersonalDetails;
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  favouriteTeam?: string;
  kycStatus: 'verified' | 'pending' | 'required' | 'unknown';
  memberSince: string;
}

export interface Balance {
  currency: Currency;
  total: number;
  bettingAvailable: number | null;
  withdrawable: number | null;
  bonus: number;
}

export type LimitPeriod = 'daily' | 'weekly' | 'monthly';

export interface Limit {
  kind: 'deposit' | 'loss' | 'time';
  period: LimitPeriod;
  value: number; // EUR for deposit/loss, hours for time
  setAt: string;
  /** Increases take effect after a cooling-off period; decreases are immediate. */
  pending?: { value: number; effectiveAt: string };
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus' | 'refund';
  amount: number;
  method?: string;
  status: 'completed' | 'pending' | 'cancelled' | 'failed';
  createdAt: string;
  reference: string;
}

/* ---------- Payments ---------- */

export interface PaymentMethod {
  /** Backend identifiers; not rendered in the payment list. */
  bid?: number;
  initiatorId?: number;
  id: string;
  name: string;
  group: 'bank' | 'wallet' | 'cash';
  speed: string; // "Instant", "Usually within 24 hours"
  min: number;
  max: number;
  quickAmounts: number[];
  savedInstrument?: string; // "Visa •••• 4821"
}

export interface PaymentResult {
  status: 'success' | 'pending' | 'failed';
  transactionId: string;
  message: string;
}

/* ---------- CMS ---------- */

export interface Promo {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  vertical: 'sports' | 'casino' | 'live-casino' | 'virtuals' | 'all';
  hue: number;
  kind: 'welcome' | 'boost' | 'tournament' | 'freebet' | 'cashback';
}

export interface CasinoFilterOptions {
  themes: string[];
  features: string[];
  providers: Provider[];
}

/* ---------- Stories (CMS) ---------- */

export interface StorySlide {
  id: string;
  title: string;
  body: string;
  cta: string;
  /** In-app route, or "register" to open sign-up. */
  to: string;
  motif: 'sun' | 'wave' | 'column' | 'star' | 'gem' | 'leaf';
}

export interface StoryGroup {
  id: string;
  vertical: 'sports' | 'live' | 'casino' | 'live-casino' | 'virtuals' | 'all';
  title: string;
  /** Group name shown on wide cards and in the viewer header (e.g. "Casino missions"). */
  label?: string;
  icon: string;
  hue: number;
  slides: StorySlide[];
}

export type ProfileUpdate = Partial<Pick<Player, 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'dateOfBirth'> & Omit<PersonalDetails, 'promoCodeEditable'>>;
