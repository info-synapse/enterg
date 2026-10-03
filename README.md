# EnterG front end (prototype)

A working prototype of the new iGaming front end, built with React + TypeScript + Vite.
It runs entirely on sample data today. Every screen talks to the back end through one typed API layer,
so connecting the real APIs later does not require changing the screens.

## Run it on your computer

You need Node.js 20 or newer (https://nodejs.org).

```bash
npm install        # once, downloads the libraries
npm run dev        # starts the app at http://localhost:5173
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build in `dist/` (upload this folder to any web server or CDN) |
| `npm run build:artifact` | One self-contained HTML file in `dist-artifact/` (used for the shareable preview link) |

## What's in the prototype

| Area | Pages | Route |
| --- | --- | --- |
| Sportsbook | Home (offers, live/upcoming, featured leagues), Live (market switcher), Event page (scoreboard, tracker, stats, market tabs, Bet Builder, pin/collapse) | `/`, `/live`, `/event/:id`, `/sports` |
| Sport page (pre-match) | Sport switcher + three tabs. **Highlights**: popular leagues, market switcher, matches by day, coupon shortcuts. **Competitions**: search, My competitions (star a league), popular, region → country → league tree, multi-select mode that opens the chosen leagues together. **Coupon**: time chips (3h, 12h, today, tomorrow, next days, all), sort by top competitions or kick-off, market switcher, removable league filter | `/sport/:id`, `/sport/:id/competitions`, `/sport/:id/coupon?w=today&c=gr-sl,epl`, `/sport/:id/competition/:compId` |
| Bet slip | Desktop right rail, mobile bottom sheet + floating odds pill, singles/combo, quick stakes, same-match warning, receipt, open bets with cash out | everywhere in Sports |
| Casino | Lobby with filters and rails, collections, providers, jackpots (live tickers), game launch screen | `/casino`, `/casino/c/:id`, `/casino/provider/:id`, `/casino/jackpots`, `/casino/play/:id` |
| Live Casino | Table lobby with type filters, Greek tables, live roulette results, blackjack seats | `/live-casino` |
| Virtuals | League tree, countdown cards that lock when the event starts | `/virtuals` |
| PAM | Login and 2-step registration, account overview, bet history, transactions (filter, search, CSV export), personal details with inline edit, KYC status | `/account/...` |
| Responsible gaming | Deposit, loss and time limits (increases delayed 24h, decreases immediate), take a break, self-exclusion with typed confirmation | `/account/protection` |
| Payments | Deposit and withdrawal method lists, amount screen with quick amounts and saved instrument, limit checks, pending withdrawal cancel | `/account/deposit`, `/account/withdraw` |

Mobile has two navigation modes: Sports and Casino, each with its own bottom bar. The round button switches between them.

## Folder structure

```
src/
  api/
    types.ts       <- the data contracts (what every screen expects from the back end)
    services.ts    <- one interface per back-end domain: sportsbook, casino, virtuals, auth, account, payments, cms
    mock/          <- sample data + in-memory fake back end (used today)
    http.ts        <- real back-end adapter: same interfaces, implemented with fetch() to your API gateway
    realtime.ts    <- live updates (odds, clocks, tables, jackpots). Today a timer; later a WebSocket
    index.ts       <- the switch between mock and real
  state/           <- app-wide state: login + balance, bet slip, live updates, theme
  components/      <- shared building blocks: header, bottom nav, odds button, event row, bet slip, artwork
  pages/
    sports/        <- Home, Live, Sport, Event, Virtuals
    casino/        <- Casino lobby, collections, game launch, Live Casino
    account/       <- Overview, Payments, History, Profile, Limits
  styles/global.css <- design tokens (colours, type, spacing) and all component styles
```

## Connecting the real back end

1. Agree the gateway routes with the back-end team. `src/api/http.ts` lists every call the front end makes,
   one line each (for example `POST /bets`, `GET /wallet/balance`, `PUT /rg/limits/:kind`).
2. The gateway translates each vendor API (sportsbook platform, casino aggregator, PAM, PSPs, CMS)
   into the shapes in `src/api/types.ts`. The screens never see vendor payloads.
3. Copy `.env.example` to `.env`, set `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL` to the gateway.
4. Replace the timer in `src/api/realtime.ts` with the gateway's WebSocket. The message format stays the same.
5. Switch `HashRouter` to `BrowserRouter` in `src/App.tsx` once the app is served from your own domain.

Limits, KYC checks and balance rules are also enforced in the mock (`src/api/mock/index.ts`) so the UI handles
the same errors the real back end will return. They must be enforced server-side in production.

## Notes

- All names of games, dealers, players and the brand "EnterG" are placeholders. Teams and providers are sample data.
- Game and table artwork is generated. Replace with images from the CMS or the casino aggregator.
- UI copy is English for now. The structure is ready for a Greek translation layer.
