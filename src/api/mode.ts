// Mixed mode: implemented account methods use HTTP; unimplemented reads use sample data.
export const LOGIN_TEST_MODE = import.meta.env.VITE_LOGIN_TEST === 'true';

export const HTTP_AUTH_MODE = LOGIN_TEST_MODE || import.meta.env.VITE_USE_MOCKS === 'false';
