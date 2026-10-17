# Mixed mode

Start with `npm run dev -- --mode login-test` and these values in `.env.login-test`:

```dotenv
VITE_LOGIN_TEST=true
VITE_USE_MOCKS=true
VITE_API_BASE_URL=/api
```

The existing flag name is retained for compatibility. Mixed mode now uses normal account navigation and page layouts, rather than replacing them with the old login-test screen. The development proxy still forwards `/api` to the gateway on port 8787.

## Data sources

| Feature | Source |
|---|---|
| Login, session restore/renewal, logout | HTTP gateway |
| Balance and personal details, including supported profile updates | HTTP gateway |
| Bets Desktop and expanded selections | HTTP gateway |
| Deposit history | HTTP gateway |
| Deposit methods | Fixed sample JSON from gateway |
| Sports/casino browsing, original Bets screen, transactions, limits, withdrawal methods, rewards | Mock data |

The account overview identifies its sample open bets/recent activity separately from the real balance. Other sample account pages have a notice. Connected account screens are labelled accordingly. The generated bank reference is hidden in mixed mode. Bets Desktop retains its wide layout without the right sidebar.

Unimplemented actions (payments, wagering/cashout, limit changes, self-exclusion, registration and casino actions) reject with a clear unavailable message; they do not execute mock mutations against a real login. Deposit/withdrawal method lists are read-only in this mode, direct payment-form routes are blocked, and the external payment widget is not mounted. Implemented HTTP failures are never replaced by mock results.

API routing remains centralized in `src/api/loginTest.ts`; pages consume the standard `api` interface. Demo (`false/true`) and full HTTP (`false/false`) selection remain unchanged. No gateway changes are needed.

## Validation

`node scripts/test-mixed-mode.mjs` passed 34 routing/action checks, including HTTP overrides, sample reads, blocked writes and propagation of backend failures. Both normal and login-test TypeScript/Vite builds passed. Browser rendering and live account navigation were not verified for this change.

Restart the frontend after environment changes. The gateway must be running for login and connected account screens.
