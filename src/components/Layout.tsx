import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import type { Competition, Game, Sport, SportEvent } from '@/api/types';
import { money } from '@/lib/format';
import { useAuth } from '@/state/AuthContext';
import { useTheme } from '@/state/ThemeContext';
import { useBetSlip } from '@/state/BetSlipContext';
import { useFavourites } from '@/state/FavouritesContext';
import { BrandMark, Icon } from './Icon';
import { Toaster } from './Toast';
import { Flag } from './Flag';
import { BetSlipPanel, SlipPillAndSheet } from './BetSlip';
import { AuthModal } from './AuthModal';
import { CasinoSearch } from './CasinoSearch';

export function useMode() {
  const { pathname } = useLocation();
  return pathname.startsWith('/casino') || pathname.startsWith('/live-casino') ? 'casino' : 'sports';
}

/** Appearance: follow the phone, or force light/dark. Lives in the account menu and the footer (not the crowded mobile top bar). */
function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  return (
    <span className="seg" role="radiogroup" aria-label="Appearance">
      {(['system', 'light', 'dark'] as const).map((t) => (
        <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? 'active' : ''} onClick={() => setTheme(t)}>
          {t === 'system' ? 'Auto' : t === 'light' ? <><Icon name="sun" size={14} /> Light</> : <><Icon name="moon" size={14} /> Dark</>}
        </button>
      ))}
    </span>
  );
}

function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return (
    <button className="icon-btn" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
}

function AccountMenu() {
  const { player, balance, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  if (!player || !balance) return null;
  const go = (to: string) => {
    setOpen(false);
    nav(to);
  };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="balance-chip" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account and balance">
        <span className="avatar">{player.firstName[0]}{player.lastName[0]}</span>
        <span className="num">{hidden ? '€ •••' : money(balance.total)}</span>
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 46, width: 300, boxShadow: 'var(--shadow)', zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="avatar" style={{ width: 40, height: 40 }}>{player.firstName[0]}{player.lastName[0]}</span>
            <div><div style={{ fontWeight: 700 }}>{player.username}</div><div className="hint">Member since {new Date(player.memberSince).getFullYear()}</div></div>
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="kv"><span>Balance</span><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><strong>{hidden ? '•••' : money(balance.total)}</strong>
              <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => setHidden((h) => !h)} aria-label={hidden ? 'Show balance' : 'Hide balance'}><Icon name={hidden ? 'eye' : 'eyeOff'} size={16} /></button></span></div>
            <div className="kv"><span>Available to bet</span><strong>{hidden ? '•••' : money(balance.bettingAvailable)}</strong></div>
            <div className="kv"><span>Available to withdraw</span><strong>{hidden ? '•••' : money(balance.withdrawable)}</strong></div>
            <div className="kv"><span>Bonus money</span><strong>{hidden ? '•••' : money(balance.bonus)}</strong></div>
          </div>
          <div className="row-actions">
            <button className="btn btn-ghost" onClick={() => go('/account/withdraw')}>Withdraw</button>
            <button className="btn btn-primary" onClick={() => go('/account/deposit')}>Deposit</button>
          </div>
          <div className="list">
            <button className="list-row" onClick={() => go('/account')}><Icon name="user" /><span className="main-col t">My account</span><Icon name="chevronRight" size={16} /></button>
            <button className="list-row" onClick={() => go('/casino/rewards')}><Icon name="trophy" /><span className="main-col t">Rewards</span><Icon name="chevronRight" size={16} /></button>
            <button className="list-row" onClick={() => go('/account/bets')}><Icon name="bets" /><span className="main-col t">Bet history</span><Icon name="chevronRight" size={16} /></button>
            <button className="list-row" onClick={() => go('/account/protection')}><Icon name="shield" /><span className="main-col t">Limits and safer play</span><Icon name="chevronRight" size={16} /></button>
            <div className="list-row theme-row"><Icon name="moon" /><span className="main-col t">Appearance</span><ThemeChoice /></div>
            <button className="list-row" onClick={() => { setOpen(false); logout(); nav('/'); }}><Icon name="logout" /><span className="main-col t">Log out</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header({ onSearch }: { onSearch: () => void }) {
  const { player, openAuth } = useAuth();
  const nav = useNavigate();
  return (
    <header className="header">
      <Link to="/" className="brand" aria-label="EnterG home"><BrandMark /><span>Enter<b>G</b></span></Link>
      <nav className="vtabs" aria-label="Products">
        <NavLink to="/" end>Sports</NavLink>
        <NavLink to="/live"><span className="live-dot" />Live</NavLink>
        <NavLink to="/casino">Casino</NavLink>
        <NavLink to="/live-casino">Live Casino</NavLink>
        <NavLink to="/virtuals">Virtuals</NavLink>
      </nav>
      <div className="header-actions">
        <button className="icon-btn" onClick={onSearch} aria-label="Search"><Icon name="search" /></button>
        <span className="hide-mobile"><ThemeButton /></span>
        {player ? (
          <>
            <AccountMenu />
            <button className="btn btn-primary hide-mobile" onClick={() => nav('/account/deposit')}>Deposit</button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={() => openAuth('login')}>Log in</button>
            <button className="btn btn-primary" onClick={() => openAuth('register')}>Join</button>
          </>
        )}
      </div>
    </header>
  );
}

export function LeftNav({ sports, competitions }: { sports: Sport[]; competitions: Competition[] }) {
  const fav = useFavourites();
  const mine = competitions.filter((c) => fav.isFav(c.id));
  return (
    <aside className="leftnav" aria-label="Sports navigation">
      <div>
        <h3>Quick links</h3>
        <NavLink to="/live"><Icon name="live" size={18} />Live now<span className="count num">{sports.reduce((s, x) => s + x.liveCount, 0)}</span></NavLink>
        <NavLink to="/virtuals"><Icon name="virtuals" size={18} />Virtuals</NavLink>
        <NavLink to="/account/bets"><Icon name="bets" size={18} />My bets</NavLink>
      </div>
      {mine.length > 0 && (
        <div>
          <h3>My competitions</h3>
          {mine.map((c) => (
            <NavLink key={c.id} to={`/sport/${c.sportId}/competition/${c.id}`}><Icon name="star" size={18} />{c.name}</NavLink>
          ))}
        </div>
      )}
      <div>
        <h3>Top competitions</h3>
        {competitions.filter((c) => c.featured && !fav.isFav(c.id)).slice(0, 8).map((c) => (
          <NavLink key={c.id} to={`/sport/${c.sportId}/competition/${c.id}`}><Flag region={c.region} size={18} />{c.name}</NavLink>
        ))}
      </div>
      <div>
        <h3>Sports A–Z</h3>
        {sports.map((s) => (
          <NavLink key={s.id} to={`/sport/${s.id}`}><Icon name={s.icon} size={18} />{s.name}{s.liveCount > 0 && <span className="count num">{s.liveCount}</span>}</NavLink>
        ))}
      </div>
    </aside>
  );
}

export function BottomNav() {
  const mode = useMode();
  const nav = useNavigate();
  const { pathname } = useLocation();
  // "Sports" opens football straight away (like the reference) and stays lit on every sport page and on Sports A–Z.
  const inSports = pathname === '/sports' || pathname.startsWith('/sport/');
  if (mode === 'casino')
    return (
      <nav className="bottom-nav casino" aria-label="Casino navigation">
        <NavLink to="/casino" end><Icon name="casino" />Casino</NavLink>
        <NavLink to="/live-casino"><Icon name="livecasino" />Live Casino</NavLink>
        <NavLink to="/casino/jackpots"><Icon name="star" />Jackpots</NavLink>
        <NavLink to="/account"><Icon name="user" />Account</NavLink>
        <button className="mode-switch" onClick={() => nav('/')} aria-label="Switch to sports"><Icon name="football" size={24} /><span>Sports</span></button>
      </nav>
    );
  return (
    <nav className="bottom-nav" aria-label="Sports navigation">
      <NavLink to="/" end><Icon name="home" />Home</NavLink>
      <NavLink to="/live"><Icon name="live" />Live</NavLink>
      <NavLink to="/sport/football" className={inSports ? 'active' : ''} aria-current={inSports ? 'page' : undefined}><Icon name="sports" />Sports</NavLink>
      <NavLink to="/account/bets"><Icon name="bets" />My bets</NavLink>
      <NavLink to="/virtuals"><Icon name="virtuals" />Virtuals</NavLink>
      <button className="mode-switch" onClick={() => nav('/casino')} aria-label="Switch to casino"><Icon name="casino" size={24} /><span>Casino</span></button>
    </nav>
  );
}

function SearchSheet({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const nav = useNavigate();
  useEffect(() => {
    api.sportsbook.getEvents({}).then(setEvents);
    api.casino.getGames().then(setGames);
  }, []);
  const term = q.trim().toLowerCase();
  const ev = term.length > 1 ? events.filter((e) => `${e.home} ${e.away} ${e.competitionName}`.toLowerCase().includes(term)).slice(0, 6) : [];
  const gm = term.length > 1 ? games.filter((g) => `${g.name} ${g.provider}`.toLowerCase().includes(term)).slice(0, 6) : [];
  const go = (to: string) => {
    onClose();
    nav(to);
  };
  return (
    <div className="backdrop center" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Search" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8 }}>
            <label htmlFor="search-q" className="sr-only">Search teams, competitions and games</label>
            <input id="search-q" className="input" autoFocus placeholder="Search teams, leagues or games" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="icon-btn" onClick={onClose} aria-label="Close search" style={{ height: 46 }}><Icon name="close" /></button>
          </div>
          {term.length < 2 && <p className="hint">Try “Olympiacos”, “EuroLeague” or “Zeus”.</p>}
          {ev.length > 0 && <div className="group-title">Sports</div>}
          <div className="list">
            {ev.map((e) => <button key={e.id} className="list-row" onClick={() => go(`/event/${e.id}`)}><Icon name={e.sportId} /><span className="main-col"><span className="t">{e.home} – {e.away}</span><br /><span className="s">{e.competitionName}</span></span>{e.live && <span className="live-badge">Live</span>}</button>)}
          </div>
          {gm.length > 0 && <div className="group-title">Casino</div>}
          <div className="list">
            {gm.map((g) => <button key={g.id} className="list-row" onClick={() => go(`/casino/play/${g.id}`)}><Icon name="casino" /><span className="main-col"><span className="t">{g.name}</span><br /><span className="s">{g.provider}</span></span></button>)}
          </div>
          {term.length > 1 && !ev.length && !gm.length && <p className="hint">Nothing matches “{q}”. Check the spelling or try a team name.</p>}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="rg"><span className="age">21+</span><span>Gambling can be addictive. Play responsibly. Set deposit, loss and time limits in your account at any time.</span></div>
      <div className="links">
        <Link to="/account/protection">Safer gambling</Link><span>Terms and conditions</span><span>Privacy policy</span><span>Payments</span><span>Help centre</span><span>Licence information</span>
      </div>
      <div className="footer-appearance"><span>Appearance</span><ThemeChoice /></div>
      <span>Prototype build with sample data. No real money is used.</span>
    </footer>
  );
}

/** Page frame: header, optional left nav, content, optional bet-slip rail, bottom nav, overlays. */
export function AppFrame({ children, left, slipRail = true }: { children: ReactNode; left?: ReactNode; slipRail?: boolean }) {
  const [search, setSearch] = useState(false);
  const mode = useMode();
  const { pathname } = useLocation();
  const { setSheetOpen } = useBetSlip();
  useEffect(() => {
    window.scrollTo(0, 0);
    setSheetOpen(false);
  }, [pathname, setSheetOpen]);
  const shellCls = left ? 'shell' : slipRail ? 'shell no-left' : 'shell full';
  return (
    <>
      <div className="demo-banner">Prototype with sample data · log in with any username and a password of 4+ characters</div>
      <Header onSearch={() => setSearch(true)} />
      <div className={shellCls}>
        {left}
        <main className="main" id="main">{children}<Footer /></main>
        {slipRail && <aside className="rail" aria-label="Bet slip"><BetSlipPanel /></aside>}
      </div>
      <BottomNav />
      <SlipPillAndSheet sportsMode={slipRail} />
      {search && (mode === 'casino' ? <CasinoSearch onClose={() => setSearch(false)} /> : <SearchSheet onClose={() => setSearch(false)} />)}
      <AuthModal />
      <Toaster />
    </>
  );
}
