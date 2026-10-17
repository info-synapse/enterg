import { mockApi } from './mock';
import { httpApi } from './http';
import type { Api } from './services';

const unavailable = async (): Promise<never> => { throw new Error('This action is not connected in mixed mode. No backend account changes were made.'); };
function blocked<T extends object>(service: T): T {
  return Object.fromEntries(Object.keys(service).map((key) => [key, unavailable])) as T;
}

// Mixed mode: sample reads with explicit HTTP overrides. Unimplemented writes remain blocked.
export const loginTestApi: Api = {
  ...mockApi,
  auth: {
    getSessionId: httpApi.auth.getSessionId,
    getSession: httpApi.auth.getSession,
    activity: httpApi.auth.activity, login: httpApi.auth.login, logout: httpApi.auth.logout, register: unavailable },
  account: { ...blocked(mockApi.account), getTransactions: mockApi.account.getTransactions, getLimits: mockApi.account.getLimits, getBetDetails: httpApi.account.getBetDetails, getBets2: httpApi.account.getBets2, getBetsDesktop: httpApi.account.getBetsDesktop, getDeposits: httpApi.account.getDeposits, getPlayer: httpApi.account.getPlayer, updateProfile: httpApi.account.updateProfile, updateContact: httpApi.account.updateContact, getBalance: httpApi.account.getBalance },
  payments: { ...blocked(mockApi.payments), getWithdrawalMethods: mockApi.payments.getWithdrawalMethods, getDepositMethods: httpApi.payments.getDepositMethods },
  sportsbook: {
    ...mockApi.sportsbook, placeBet: unavailable, getBets: mockApi.sportsbook.getBets, cashOut: unavailable,
    setAutoCashOut: unavailable, priceBetBuilder: unavailable, shareSlip: unavailable, loadSharedSlip: unavailable,
  },
  casino: {
    ...mockApi.casino, launchGame: unavailable, getRewards: mockApi.casino.getRewards,
    claimMission: unavailable, joinTournament: unavailable,
  },
};
