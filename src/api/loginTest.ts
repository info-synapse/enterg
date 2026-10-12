import { mockApi } from './mock';
import { httpApi } from './http';
import type { Api } from './services';

const unavailable = async (): Promise<never> => { throw new Error('Not connected in login-test mode. Only login is enabled.'); };
function blocked<T extends object>(service: T): T {
  return Object.fromEntries(Object.keys(service).map((key) => [key, unavailable])) as T;
}

// Public sample browsing is retained. No fake account data or mutations after real login.
export const loginTestApi: Api = {
  ...mockApi,
  auth: { login: httpApi.auth.login, logout: httpApi.auth.logout, register: unavailable },
  account: blocked(mockApi.account),
  payments: blocked(mockApi.payments),
  sportsbook: {
    ...mockApi.sportsbook, placeBet: unavailable, getBets: unavailable, cashOut: unavailable,
    setAutoCashOut: unavailable, priceBetBuilder: unavailable, shareSlip: unavailable, loadSharedSlip: unavailable,
  },
  casino: {
    ...mockApi.casino, launchGame: unavailable, getRewards: unavailable,
    claimMission: unavailable, joinTournament: unavailable,
  },
};
