import { Deposit2 } from '@/pages/account/Deposit2';
import { Bets2 } from '@/pages/account/Bets2';
import { BetsPro } from '@/pages/account/BetsPro';
import { Deposits } from '@/pages/account/Deposits';
import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/state/AuthContext';
import { BetSlipProvider } from '@/state/BetSlipContext';
import { LiveProvider } from '@/state/LiveContext';
import { ThemeProvider } from '@/state/ThemeContext';
import { FavouritesProvider } from '@/state/FavouritesContext';
import { AppFrame } from '@/components/Layout';
import { Home } from '@/pages/sports/Home';
import { Live } from '@/pages/sports/Live';
import { CompetitionPage, SportPage, SportsIndex } from '@/pages/sports/SportPage';
import { EventPage } from '@/pages/sports/EventPage';
import { SharedSlip } from '@/pages/sports/SharedSlip';
import { Virtuals } from '@/pages/sports/Virtuals';
import { CasinoLobby, CollectionPage, GamePlay } from '@/pages/casino/Casino';
import { RewardsPage } from '@/pages/casino/Rewards';
import { LiveCasino } from '@/pages/casino/LiveCasino';
import { BetHistory, Overview, Profile, Transactions } from '@/pages/account/Account';
import { Deposit, PaymentForm, Withdraw } from '@/pages/account/Payments';
import { Protection } from '@/pages/account/Protection';

function NotFound() {
  return (
    <AppFrame slipRail={false}>
      <div className="empty"><h1 className="page-title">Page not found</h1>The link may be old. <Link className="btn btn-ghost" to="/">Go to sports</Link></div>
    </AppFrame>
  );
}

// HashRouter keeps every page reachable from a single static file (needed for the preview link).
// Switch to BrowserRouter when the app is served from your own web server.
export default function App() {
  return (
    <ThemeProvider>
      <LiveProvider>
        <AuthProvider>
          <FavouritesProvider>
          <BetSlipProvider>
            <HashRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/live" element={<Live />} />
                <Route path="/sports" element={<SportsIndex />} />
                <Route path="/backend-sports" element={<SportsIndex backend />} />
                <Route path="/sport/:sportId" element={<SportPage />} />
                <Route path="/sport/:sportId/competition/:compId" element={<CompetitionPage />} />
                <Route path="/sport/:sportId/:tab" element={<SportPage />} />
                <Route path="/event/:eventId" element={<EventPage />} />
                <Route path="/slip/:code" element={<SharedSlip />} />
                <Route path="/virtuals" element={<Virtuals />} />
                <Route path="/casino" element={<CasinoLobby />} />
                <Route path="/casino/c/:id" element={<CollectionPage kind="collection" />} />
                <Route path="/casino/provider/:id" element={<CollectionPage kind="provider" />} />
                <Route path="/casino/jackpots" element={<CollectionPage kind="jackpots" />} />
                <Route path="/casino/play/:id" element={<GamePlay />} />
                <Route path="/casino/rewards" element={<RewardsPage />} />
                <Route path="/live-casino" element={<LiveCasino />} />
                <Route path="/account" element={<Overview />} />
                <Route path="/account/deposit" element={<Deposit />} />
                <Route path="/account/deposit2" element={<Deposit2 />} />
                <Route path="/account/deposit/:methodId" element={<PaymentForm kind="deposit" />} />
                <Route path="/account/withdraw" element={<Withdraw />} />
                <Route path="/account/withdraw/:methodId" element={<PaymentForm kind="withdraw" />} />
                <Route path="/account/bets2" element={<Bets2 />} />
                <Route path="/account/bets-pro" element={<BetsPro />} />
                <Route path="/account/bets-desktop" element={<BetsPro />} />
                <Route path="/account/bets" element={<BetHistory />} />
                <Route path="/account/deposits" element={<Deposits />} />
                <Route path="/account/transactions" element={<Transactions />} />
                <Route path="/account/profile" element={<Profile />} />
                <Route path="/account/protection" element={<Protection />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HashRouter>
          </BetSlipProvider>
          </FavouritesProvider>
        </AuthProvider>
      </LiveProvider>
    </ThemeProvider>
  );
}
