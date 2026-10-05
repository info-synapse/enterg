// Booking codes: short codes that carry the selections of a shared slip.
// In production the gateway stores the slip and the code is just a key; this prototype encodes the
// selection ids into the code so a link works on any device without a server.
// Each selection id ("s1234") becomes 3 characters in base 35 (0-9, A-Y). A Bet Builder line is "Z" + leg count + its legs.

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXY';

const enc = (n: number) => {
  let out = '';
  for (let i = 0; i < 3; i++) { out = DIGITS[n % 35] + out; n = Math.floor(n / 35); }
  return out;
};
const dec = (s: string) => [...s].reduce((n, c) => n * 35 + DIGITS.indexOf(c), 0);

export type CodeEntry = { kind: 'single'; id: string } | { kind: 'builder'; ids: string[] };

export function encodeSlip(entries: CodeEntry[]) {
  const body = entries.map((e) => (e.kind === 'single' ? enc(Number(e.id.slice(1))) : `Z${DIGITS[e.ids.length]}${e.ids.map((id) => enc(Number(id.slice(1)))).join('')}`)).join('');
  return `EG${body}`;
}

export function decodeSlip(code: string): CodeEntry[] | null {
  const c = code.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (!c.startsWith('EG') || c.length < 5) return null;
  const out: CodeEntry[] = [];
  let i = 2;
  while (i < c.length) {
    if (c[i] === 'Z') {
      const n = DIGITS.indexOf(c[i + 1]);
      if (n < 1) return null;
      const ids: string[] = [];
      for (let k = 0; k < n; k++) ids.push(`s${dec(c.slice(i + 2 + k * 3, i + 5 + k * 3))}`);
      out.push({ kind: 'builder', ids });
      i += 2 + n * 3;
    } else {
      const part = c.slice(i, i + 3);
      if (part.length < 3) return null;
      out.push({ kind: 'single', id: `s${dec(part)}` });
      i += 3;
    }
  }
  return out;
}

/** Groups a code for reading aloud: EG4K2-Q7M01. */
export const prettyCode = (code: string) => code.replace(/(.{5})(?=.)/g, '$1-');
