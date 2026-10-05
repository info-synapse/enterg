// "Next up": fast markets on a live match. They stand out by position (right under the tracker) and by the
// draining countdown bar, not by colour. Guardrails: bets go through the normal slip, no one-tap betting,
// no deposit shortcut, and a per-match count of fast bets.
import { useEffect, useState } from 'react';
import { api } from '@/api';
import type { EventDetail, MicroMarket } from '@/api/types';
import { Icon } from '@/components/Icon';
import { OddsButton } from '@/components/OddsButton';
import { useAuth } from '@/state/AuthContext';
import { useBetSlip } from '@/state/BetSlipContext';

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function NextUp({ ev }: { ev: EventDetail }) {
  const [markets, setMarkets] = useState<MicroMarket[]>([]);
  const [fastBets, setFastBets] = useState(0);
  const { player } = useAuth();
  const slip = useBetSlip();
  const now = useNow(250);

  useEffect(() => {
    let alive = true;
    const load = () => api.sportsbook.getMicroMarkets(ev.id).then((m) => alive && setMarkets(m));
    load();
    const t = setInterval(load, 1500);
    return () => { alive = false; clearInterval(t); };
  }, [ev.id]);

  useEffect(() => {
    if (!player) return;
    api.sportsbook.getBets('open').then((bets) => setFastBets(bets.filter((b) => b.legs.some((l) => l.fast && l.eventId === ev.id)).length));
  }, [player, ev.id, slip.receipt]);

  if (!markets.length) return null;
  const name = `${ev.home} – ${ev.away}`;
  return (
    <section className="nextup" aria-label="Fast markets">
      <div className="nextup-head">
        <span className="live-badge">Next up</span>
        <span className="hint">Fast markets · settle within minutes</span>
      </div>
      <div className="nextup-rail">
        {markets.map((m) => {
          const total = Date.parse(m.closesAt) - Date.parse(m.opensAt);
          const left = Math.max(0, Date.parse(m.closesAt) - now);
          const secs = Math.ceil(left / 1000);
          return (
            <article key={m.id} className={`micro ${m.status}`} aria-label={`${m.title}, ${m.window}`}>
              <div className="micro-top">
                <strong>{m.title}</strong>
                <span className="hint num">{m.window}</span>
              </div>
              {m.status === 'open' ? (
                <div className="micro-clock" aria-label={`Closes in ${secs} seconds`}>
                  <span className="micro-bar"><i style={{ width: `${(left / total) * 100}%` }} /></span>
                  <span className="num"><Icon name="clock" size={14} /> {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
                </div>
              ) : (
                <div className="micro-clock done">
                  {m.status === 'settling' ? <span>Betting closed · waiting for the result</span> : <span>Result: <strong>{m.result}</strong></span>}
                </div>
              )}
              <div className="micro-odds">
                {m.selections.map((s) => (
                  <OddsButton key={s.id} selection={s} eventId={ev.id} eventName={name} marketName={`${m.title} (${m.window})`} live fast />
                ))}
              </div>
            </article>
          );
        })}
      </div>
      {fastBets > 0 && <p className="hint nextup-count">Fast bets on this match: <strong>{fastBets}</strong></p>}
    </section>
  );
}
