// Opt-in mode: only authentication reaches the test gateway.
export const LOGIN_TEST_MODE = import.meta.env.VITE_LOGIN_TEST === 'true';

export const HTTP_AUTH_MODE = LOGIN_TEST_MODE || import.meta.env.VITE_USE_MOCKS === 'false';
