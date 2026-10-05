// Which Bet Builder picks can't go together. The trading platform has the final say when it prices
// the combination; these rules grey out the obvious clashes before the player taps them.

export interface Pick {
  id: string;
  label: string;
  marketName: string;
  player?: string;
}

/** Markets where several picks may sit side by side (different players). */
const MULTI = new Set(['Anytime goalscorer', 'To score 2 or more', '1+ shots on target', '2+ shots on target', 'To be booked']);
export const isMulti = (marketName: string) => MULTI.has(marketName);

const line = (p: Pick) => {
  const m = /^(Over|Under) ([\d.]+)$/.exec(p.label);
  return p.marketName.startsWith('Total goals') && m ? { side: m[1] as 'Over' | 'Under', n: Number(m[2]) } : null;
};

/** Fewest goals the picks imply (scorers, Over lines, both teams to score). */
function minGoals(picks: Pick[]) {
  const scorers = new Set(picks.filter((p) => p.marketName === 'Anytime goalscorer' || p.marketName === 'First goalscorer').map((p) => p.label));
  const twoPlus = picks.filter((p) => p.marketName === 'To score 2 or more').length;
  let n = Math.max(scorers.size + twoPlus, picks.some((p) => p.marketName === 'Both teams to score' && p.label === 'Yes') ? 2 : 0);
  for (const p of picks) { const l = line(p); if (l?.side === 'Over') n = Math.max(n, Math.ceil(l.n)); }
  return n;
}

const RESULT_VS_DOUBLE: Record<string, string> = { '1': 'X2', X: '12', '2': '1X' };

/** Returns the pick that clashes with the candidate, or null. Picks in the same single-choice market are replaced, not blocked. */
export function clashWith(cand: Pick, picks: Pick[]): Pick | null {
  const others = picks.filter((p) => p.id !== cand.id && !(p.marketName === cand.marketName && !isMulti(cand.marketName)));
  for (const p of others) {
    if (p.marketName === 'Match result' && cand.marketName === 'Double chance' && RESULT_VS_DOUBLE[p.label] === cand.label) return p;
    if (cand.marketName === 'Match result' && p.marketName === 'Double chance' && RESULT_VS_DOUBLE[cand.label] === p.label) return p;
    if (p.label === cand.label && p.marketName === 'First goalscorer' && cand.marketName === 'First goalscorer') return p;
  }
  // Goal-count clashes: an Under line below the goals the other picks need.
  const all = [...others, cand];
  const need = minGoals(all);
  for (const p of all) {
    const l = line(p);
    if (l?.side === 'Under' && need > l.n) return p === cand ? others.find((o) => minGoals([...others.filter((x) => x !== o)]) < need) ?? others[0] : p;
  }
  return null;
}
