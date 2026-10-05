import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Game, LiveTable } from '@/api/types';
import { money } from '@/lib/format';
import { GameArt, TableArt } from './Art';
import { Icon } from './Icon';
import { useRewards } from '@/state/useRewards';


const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

/** The ⋮ menu on a tile: quick facts and the two ways to start the game. */
function TileMenu({ game, onClose }: { game: Game; onClose: () => void }) {
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const out = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, [onClose]);
  return (
    <div ref={ref} className="tile-menu" role="menu" onClick={(e) => e.stopPropagation()}>
      <strong>{game.name}</strong>
      <div className="kv"><span>RTP</span><strong>{game.rtp}%</strong></div>
      <div className="kv"><span>Volatility</span><strong style={{ textTransform: 'capitalize' }}>{game.volatility}</strong></div>
      <div className="kv"><span>Min bet</span><strong>{money(game.minBet)}</strong></div>
      <button role="menuitem" className="btn btn-primary btn-sm" onClick={() => nav(`/casino/play/${game.id}`)}>Play</button>
      <button role="menuitem" className="btn btn-ghost btn-sm" onClick={() => nav(`/casino/play/${game.id}?demo=1`)}>Try for free</button>
    </div>
  );
}

export function GameTile({ game }: { game: Game }) {
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const rewards = useRewards();
  const inTournament = rewards?.tournaments.some((t) => t.gameIds.includes(game.id));
  return (
    <div className="game">
      <button className="game-art" onClick={() => nav(`/casino/play/${game.id}`)} aria-label={`${game.name} by ${game.provider}`}>
        <GameArt game={game} />
        <span className="game-badges">
          {game.isNew && <span className="tag accent">New</span>}
          {game.exclusive && <span className="tag">Exclusive</span>}
          {game.bonusBuy && <span className="tag">Bonus Buy</span>}
        </span>
        {game.jackpot && <span className="game-jp num">{money(game.jackpot)}</span>}
        {inTournament && <span className={`game-trophy ${game.jackpot ? 'raised' : ''}`} title="Counts for a tournament"><Icon name="trophy" size={13} strokeWidth={2.2} /></span>}
      </button>
      <button className="tile-dots" onClick={() => setMenu((m) => !m)} aria-label={`More about ${game.name}`} aria-expanded={menu}>⋮</button>
      {menu && <TileMenu game={game} onClose={() => setMenu(false)} />}
      <span className="game-name">{game.name}</span>
      <span className="game-prov">{game.provider} · RTP {game.rtp}%</span>
    </div>
  );
}

/** Live table as a search result: same footprint as a game tile. */
export function TableTile({ table, results }: { table: LiveTable; results?: number[] }) {
  const nav = useNavigate();
  const r = results ?? table.results;
  return (
    <div className="game">
      <button className="game-art" onClick={() => nav('/live-casino')} aria-label={`${table.name}, dealer ${table.dealer}`}>
        <TableArt table={table} />
        <span className="game-badges"><span className="tag live">Live</span>{table.language === 'Greek' && <span className="tag">Ελληνικά</span>}</span>
        <span className="game-jp num" style={{ color: '#fff' }}>From {money(table.minBet)}</span>
      </button>
      <span className="game-name">{table.name}</span>
      <span className="game-prov">
        {table.dealer === 'Auto' ? 'Automatic' : `Dealer ${table.dealer}`}
        {r && <span className="mini-results"> {r.slice(0, 3).map((n, i) => <b key={i} className={n === 0 ? 'g' : RED.has(n) ? 'r' : 'b'}>{n}</b>)}</span>}
      </span>
    </div>
  );
}

