import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'system' | 'dark' | 'light';
const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: 'system', setTheme: () => {} });

function read(): Theme {
  try {
    return (localStorage.getItem('enterg-theme') as Theme) || 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(read);
  const [touched, setTouched] = useState(() => read() !== 'system');
  useEffect(() => {
    const root = document.documentElement;
    // Leave the host's own data-theme alone until the player picks a theme in the app.
    if (theme === 'system' && !touched) return;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('enterg-theme', theme);
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
  }, [theme, touched]);
  const choose = (t: Theme) => {
    setTouched(true);
    setTheme(t);
  };
  return <Ctx.Provider value={{ theme, setTheme: choose }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);
