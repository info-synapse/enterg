// Player markets as tables: one row per player, one column per market. One scan per player.
import { useState } from 'react';
import type { EventDetail, PlayerTable, Selection } from '@/api/types';
import { Crest } from '@/components/Art';
import { OddsButton } from '@/components/OddsButton';

const SHORT: Record<string, string> = {
  'Anytime goalscorer': 'Anytime', 'First goalscorer': 'First', 'To score 2 or more': '2+',
  '1+ shots on target': '1+', '2+ shots on target': '2+', 'To be booked': 'Booked',
};
const POS: Record<string, string> = { FW: 'Forward', MF: 'Midfielder', DF: 'Defender' };

export interface BuilderHooks {
  picked: (id: string) => boolean;
  blockedBy: (s: Selection, marketName: string, player: string) => string | undefined;
  onPick: (s: Selection, marketName: string, player: string) => void;
}

export function PlayerTables({ ev, live, builder }: { ev: EventDetail; live: boolean; builder?: BuilderHooks }) {
  const [side, setSide] = useState<'all' | 'home' | 'away'>('all');
  const name = `${ev.home} – ${ev.away}`;
  if (!ev.players?.length) return null;
  return (
    <>
      <div className="chips" role="tablist" aria-label="Team">
        {(['all', 'home', 'away'] as const).map((s) => (
          <button key={s} role="tab" aria-selected={side === s} className={`chip ${side === s ? 'active' : ''}`} onClick={() => setSide(s)}>
            {s === 'all' ? 'Both teams' : s === 'home' ? ev.home : ev.away}
          </button>
        ))}
      </div>
      {ev.players.map((t) => <Table key={t.id} t={t} side={side} ev={ev} eventName={name} live={live} builder={builder} />)}
    </>
  );
}

function Table({ t, side, ev, eventName, live, builder }: { t: PlayerTable; side: 'all' | 'home' | 'away'; ev: EventDetail; eventName: string; live: boolean; builder?: BuilderHooks }) {
  const rows = t.rows.filter((r) => side === 'all' || r.team === side);
  return (
    <div className="market ptable" style={{ ['--cols' as string]: t.columns.length }}>
      <div className="ptable-head">
        <strong>{t.name}</strong>
        {t.columns.map((c) => <span key={c} title={c}>{SHORT[c] ?? c}</span>)}
      </div>
      {rows.map((r) => (
        <div key={`${r.team}-${r.player}`} className="ptable-row">
          <div className="ptable-player">
            <Crest name={r.team === 'home' ? ev.home : ev.away} size={22} />
            <span><strong>{r.player}</strong><small>{POS[r.position]}</small></span>
          </div>
          {r.cells.map((c, i) =>
            c ? (
              <OddsButton
                key={c.id}
                selection={c}
                eventId={ev.id}
                eventName={eventName}
                marketName={t.columns[i]}
                live={live}
                showLabel={false}
                {...(builder ? { picked: builder.picked(c.id), onPick: () => builder.onPick(c, t.columns[i], r.player), blockedBy: builder.blockedBy(c, t.columns[i], r.player) } : {})}
              />
            ) : (
              <span key={i} className="ptable-na" aria-label="Not offered">–</span>
            ),
          )}
        </div>
      ))}
    </div>
  );
}
