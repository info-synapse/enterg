// "My competitions": leagues the player stars.
// Stored in this browser for the prototype; in production save it to the player profile through the account API
// so it follows the player across devices.
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const KEY = 'enterg-my-competitions';
const read = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '["gr-sl","ucl","euroleague"]');
  } catch {
    return ['gr-sl', 'ucl', 'euroleague'];
  }
};

const Ctx = createContext<{ ids: string[]; isFav: (id: string) => boolean; toggle: (id: string) => void } | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(read);
  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: keeps working for this visit */
      }
      return next;
    });
  }, []);
  return <Ctx.Provider value={{ ids, isFav: (id) => ids.includes(id), toggle }}>{children}</Ctx.Provider>;
}

export function useFavourites() {
  const c = useContext(Ctx);
  if (!c) throw new Error('FavouritesProvider missing');
  return c;
}
