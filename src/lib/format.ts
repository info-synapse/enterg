const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
export const money = (n: number | null, currency = 'EUR') => n === null ? 'Unavailable' : currency === 'EUR' ? eur.format(n) : new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(n);
export const odds = (n: number) => n.toFixed(2);

export function kickoff(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86_400_000);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Today ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} ${time}`;
}

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function countdown(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((Date.parse(iso) - now) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
