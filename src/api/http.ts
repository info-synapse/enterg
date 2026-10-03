// Real gateway adapter: the same Api contract, implemented with fetch().
// Fill in the paths once the back-end endpoints are known. Every method maps 1:1 to a gateway route.
import type { Api } from './services';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
let token: string | null = null;
export const setToken = (t: string | null) => (token = t);

async function http<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? `Request failed (${res.status})`), { code: err.code ?? res.status });
  }
  return res.json() as Promise<T>;
}

const qs = (q: Record<string, unknown>) =>
  '?' + Object.entries(q).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');

export const httpApi: Api = {
  sportsbook: {
    getSports: () => http('GET', '/sports'),
    getCompetitions: (sportId) => http('GET', `/competitions${qs({ sportId })}`),
    getEvents: (q) => http('GET', `/events${qs({ ...q, competitionIds: q.competitionIds?.join(',') })}`),
    getEvent: (id) => http('GET', `/events/${id}`),
    placeBet: (req) => http('POST', '/bets', req),
    getBets: (status) => http('GET', `/bets${qs({ status })}`),
    cashOut: (betId) => http('POST', `/bets/${betId}/cashout`),
  },
  casino: {
    getGames: () => http('GET', '/casino/games'),
    getCollections: (vertical) => http('GET', `/cms/collections${qs({ vertical })}`),
    getProviders: () => http('GET', '/casino/providers'),
    getJackpots: () => http('GET', '/casino/jackpots'),
    getLiveTables: () => http('GET', '/live-casino/tables'),
    getFilterOptions: () => http('GET', '/casino/filters'),
    launchGame: (gameId, mode) => http('POST', `/casino/games/${gameId}/launch`, { mode }),
  },
  virtuals: {
    getLeagues: () => http('GET', '/virtuals/leagues'),
    getUpcoming: () => http('GET', '/virtuals/events'),
  },
  auth: {
    login: (username, password) => http('POST', '/auth/login', { username, password }),
    register: (data) => http('POST', '/auth/register', data),
    logout: () => http('POST', '/auth/logout'),
  },
  account: {
    getPlayer: () => http('GET', '/account/profile'),
    updateContact: (field, value) => http('PUT', '/account/profile', { [field]: value }),
    getBalance: () => http('GET', '/wallet/balance'),
    getTransactions: (q) => http('GET', `/wallet/transactions${qs(q)}`),
    getLimits: () => http('GET', '/rg/limits'),
    setLimit: (kind, period, value) => http('PUT', `/rg/limits/${kind}`, { period, value }),
    takeBreak: (days) => http('POST', '/rg/time-out', { days }),
    selfExclude: (months) => http('POST', '/rg/self-exclusion', { months }),
  },
  payments: {
    getDepositMethods: () => http('GET', '/payments/deposit-methods'),
    getWithdrawalMethods: () => http('GET', '/payments/withdrawal-methods'),
    deposit: (methodId, amount) => http('POST', '/payments/deposits', { methodId, amount }),
    withdraw: (methodId, amount) => http('POST', '/payments/withdrawals', { methodId, amount }),
    cancelWithdrawal: (id) => http('DELETE', `/payments/withdrawals/${id}`),
  },
  cms: {
    getPromos: (vertical) => http('GET', `/cms/promos${qs({ vertical })}`),
    getStories: (vertical) => http('GET', `/cms/stories${qs({ vertical })}`),
  },
};
