// The single switch between mock data and the real back end.
// Set VITE_USE_MOCKS=false and VITE_API_BASE_URL=https://your-gateway in a .env file to go live.
import { mockApi } from './mock';
import { httpApi } from './http';
import type { Api } from './services';

export const api: Api = import.meta.env.VITE_USE_MOCKS === 'false' ? httpApi : mockApi;
export * from './types';
export { realtime } from './realtime';
