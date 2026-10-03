// Service contracts: one interface per back-end domain.
// The UI only ever calls these. Swapping mock -> real is a one-line change in ./index.ts.
import type {
  Balance, Bet, Collection, EventDetail, Game, Jackpot, Limit, LiveTable, PaymentMethod,
  PaymentResult, PlaceBetRequest, Player, Promo, Provider, Sport, SportEvent, Transaction,
  VirtualEvent, VirtualLeague, Competition, CasinoFilterOptions, StoryGroup,
} from './types';

export interface EventQuery {
  sportId?: string;
  live?: boolean;
  competitionId?: string;
  competitionIds?: string[];
  marketName?: string;
  from?: string;
  to?: string;
}

export interface SportsbookService {
  getSports(): Promise<Sport[]>;
  getCompetitions(sportId?: string): Promise<Competition[]>;
  /**
   * Event list for any list screen.
   * marketName swaps the market shown in the odds columns (Match result, Total goals 2.5, …).
   * from/to limit the kick-off window (coupon time chips).
   */
  getEvents(q: EventQuery): Promise<SportEvent[]>;
  getEvent(id: string): Promise<EventDetail | undefined>;
  placeBet(req: PlaceBetRequest): Promise<{ bets: Bet[]; newBalance: number }>;
  getBets(status: 'open' | 'settled'): Promise<Bet[]>;
  cashOut(betId: string): Promise<{ amount: number }>;
}

export interface CasinoService {
  getGames(): Promise<Game[]>;
  getCollections(vertical: 'casino'): Promise<Collection[]>;
  getProviders(): Promise<Provider[]>;
  getJackpots(): Promise<Jackpot[]>;
  getLiveTables(): Promise<LiveTable[]>;
  /** Themes, features and providers for the lobby filter panel. */
  getFilterOptions(): Promise<CasinoFilterOptions>;
  /** Returns the provider launch URL for an authenticated session (or demo mode). */
  launchGame(gameId: string, mode: 'real' | 'demo'): Promise<{ url: string }>;
}

export interface VirtualsService {
  getLeagues(): Promise<VirtualLeague[]>;
  getUpcoming(): Promise<VirtualEvent[]>;
}

export interface AuthService {
  login(username: string, password: string): Promise<{ token: string; player: Player }>;
  register(data: { email: string; password: string; firstName: string; lastName: string; dateOfBirth: string; phone: string }): Promise<{ token: string; player: Player }>;
  logout(): Promise<void>;
}

export interface AccountService {
  getPlayer(): Promise<Player>;
  updateContact(field: 'email' | 'phone' | 'address', value: string): Promise<Player>;
  getBalance(): Promise<Balance>;
  getTransactions(q: { type?: Transaction['type']; from?: string; to?: string }): Promise<Transaction[]>;
  getLimits(): Promise<Limit[]>;
  setLimit(kind: Limit['kind'], period: Limit['period'], value: number): Promise<Limit>;
  takeBreak(days: number): Promise<{ until: string }>;
  selfExclude(months: number): Promise<{ until: string }>;
}

export interface PaymentsService {
  getDepositMethods(): Promise<PaymentMethod[]>;
  getWithdrawalMethods(): Promise<PaymentMethod[]>;
  deposit(methodId: string, amount: number): Promise<PaymentResult>;
  withdraw(methodId: string, amount: number): Promise<PaymentResult>;
  cancelWithdrawal(transactionId: string): Promise<PaymentResult>;
}

export interface CmsService {
  getPromos(vertical?: Promo['vertical']): Promise<Promo[]>;
  /** Stories strip for a product page (includes stories marked 'all'). */
  getStories(vertical: StoryGroup['vertical']): Promise<StoryGroup[]>;
}

export interface Api {
  sportsbook: SportsbookService;
  casino: CasinoService;
  virtuals: VirtualsService;
  auth: AuthService;
  account: AccountService;
  payments: PaymentsService;
  cms: CmsService;
}
