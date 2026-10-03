import { useState } from 'react';
import { api } from '@/api';
import type { LiveTable } from '@/api/types';
import { TableArt } from '@/components/Art';
import { AppFrame } from '@/components/Layout';
import { money } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { useAuth } from '@/state/AuthContext';
import { useLiveTable } from '@/state/LiveContext';
import { StoriesStrip } from '@/components/Stories';

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const KINDS: { id: LiveTable['kind'] | 'all' | 'greek'; label: string }[] = [
  { id: 'all', label: 'All tables' },
  { id: 'greek', label: 'Greek dealers' },
  { id: 'roulette', label: 'Roulette' },
  { id: 'blackjack', label: 'Blackjack' },
  { id: 'gameshow', label: 'Game shows' },
  { id: 'baccarat', label: 'Baccarat' },
  { id: 'poker', label: 'Poker' },
];

function TableCard({ t, onOpen }: { t: LiveTable; onOpen: () => void }) {
  const results = useLiveTable(t.id, t.results);
  const full = t.seats && t.seats.taken >= t.seats.total;
  return (
    <button className="table-card" onClick={onOpen} aria-label={`${t.name}, dealer ${t.dealer}, from ${money(t.minBet)}`}>
      <div className="scene">
        <TableArt table={t} />
        <div className="tags">
          {t.exclusive && <span className="tag accent">Exclusive</span>}
          {t.language === 'Greek' && <span className="tag" style={{ background: 'rgba(0,0,0,.55)', color: '#fff' }}>Ελληνικά</span>}
        </div>
        <span className="players num">{t.players.toLocaleString('en-GB')} playing</span>
      </div>
      <div className="info">
        <span className="name">{t.name}</span>
        <div className="sub"><span>{t.dealer === 'Auto' ? 'Automatic' : `Dealer ${t.dealer}`}</span><span className="num">{money(t.minBet)} – {money(t.maxBet)}</span></div>
        {results && (
          <div className="results num" aria-label="Last results">
            {results.map((n, i) => <span key={i} className={n === 0 ? 'g' : RED.has(n) ? 'r' : 'b'}>{n}</span>)}
          </div>
        )}
        {t.seats && (
          <div className="sub">
            <span className="seats" aria-hidden="true">{Array.from({ length: t.seats.total }, (_, i) => <i key={i} className={i < t.seats!.taken ? 'on' : ''} />)}</span>
            <span>{full ? 'Table full · bet behind' : `${t.seats.total - t.seats.taken} seats free`}</span>
          </div>
        )}
      </div>
    </button>
  );
}

export function LiveCasino() {
  const { data, loading } = useAsync(() => api.casino.getLiveTables(), []);
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('all');
  const [open, setOpen] = useState<LiveTable | null>(null);
  const { player, openAuth } = useAuth();
  const tables = (data ?? []).filter((t) => kind === 'all' || (kind === 'greek' ? t.language === 'Greek' : t.kind === kind));
  const greek = (data ?? []).filter((t) => t.language === 'Greek');
  return (
    <AppFrame slipRail={false}>
      <StoriesStrip vertical="live-casino" />
      <div className="chips" role="tablist" aria-label="Table type">
        {KINDS.map((k) => <button key={k.id} role="tab" aria-selected={kind === k.id} className={`chip ${kind === k.id ? 'active' : ''}`} onClick={() => setKind(k.id)}>{k.label}</button>)}
      </div>
      {kind === 'all' && greek.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>Greek tables</h2><span className="meta num">{greek.length}</span></div>
          <div className="table-grid">{greek.map((t) => <TableCard key={t.id} t={t} onOpen={() => setOpen(t)} />)}</div>
        </section>
      )}
      <section className="section">
        <div className="section-head"><h2>{kind === 'all' ? 'All live tables' : KINDS.find((k) => k.id === kind)?.label}</h2><span className="meta num">{tables.length}</span></div>
        {loading ? <div className="skeleton" style={{ height: 240 }} /> : <div className="table-grid">{tables.map((t) => <TableCard key={t.id} t={t} onOpen={() => setOpen(t)} />)}</div>}
      </section>
      {open && (
        <div className="backdrop center" onClick={() => setOpen(null)}>
          <div className="sheet" role="dialog" aria-label={open.name} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <h2>{open.name}</h2>
              <div className="launch"><TableArt table={open} /><div className="msg"><strong>{open.provider} live stream</strong><span style={{ fontSize: 'var(--fs-xs)' }}>The studio's video player opens here.</span></div></div>
              <div className="kv"><span>Bet range</span><strong>{money(open.minBet)} – {money(open.maxBet)}</strong></div>
              <div className="kv"><span>Language</span><strong>{open.language}</strong></div>
              {player ? <button className="btn btn-primary btn-block" onClick={() => setOpen(null)}>Join table</button> : <button className="btn btn-primary btn-block" onClick={() => { setOpen(null); openAuth('login'); }}>Log in to join</button>}
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
