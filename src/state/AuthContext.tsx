import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '@/api';
import { LOGIN_TEST_MODE } from '@/api/mode';
import type { Balance, Player } from '@/api/types';

type AuthModal = 'login' | 'register' | null;

interface AuthValue {
  player: Player | null;
  balance: Balance | null;
  modal: AuthModal;
  restoring: boolean;
  sessionError: string;
  retrySession: () => void;
  openAuth: (m: AuthModal) => void;
  login: (u: string, p: string) => Promise<void>;
  register: (d: Parameters<typeof api.auth.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  setPlayer: (p: Player) => void;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [modal, setModal] = useState<AuthModal>(null);

  const [restoring, setRestoring] = useState(LOGIN_TEST_MODE);
  const [sessionError, setSessionError] = useState('');
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const revision = useRef(0);
  const retrySession = useCallback(() => setRestoreAttempt(n => n + 1), []);

  useEffect(() => {
    if (!LOGIN_TEST_MODE) return;
    const current = ++revision.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    let active = true;
    setRestoring(true);
    setSessionError('');
    api.auth.getSession(controller.signal).then(({ player }) => {
      if (active && current === revision.current) setPlayer(player);
    }).catch((error: unknown) => {
      if (!active || current !== revision.current) return;
      if ((error as { status?: number })?.status === 401) {
        setPlayer(null);
        setBalance(null);
      } else {
        setSessionError('Could not check your session. Please try again.');
      }
    }).finally(() => {
      window.clearTimeout(timeout);
      if (active && current === revision.current) setRestoring(false);
    });
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [restoreAttempt]);

  const refreshBalance = useCallback(async () => {
    if (LOGIN_TEST_MODE) { setBalance(null); return; }
    setBalance(await api.account.getBalance());
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const { player } = await api.auth.login(u, p);
    ++revision.current;
    setRestoring(false);
    setSessionError('');
    setPlayer(player);
    setBalance(LOGIN_TEST_MODE ? null : await api.account.getBalance());
    setModal(null);
  }, []);

  const register = useCallback(async (d: Parameters<typeof api.auth.register>[0]) => {
    const { player } = await api.auth.register(d);
    setPlayer(player);
    setBalance(await api.account.getBalance());
    setModal(null);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    ++revision.current;
    setRestoring(false);
    setSessionError('');
    setPlayer(null);
    setBalance(null);
  }, []);

  return (
    <Ctx.Provider value={{ player, balance, modal, restoring, sessionError, retrySession, openAuth: setModal, login, register, logout, refreshBalance, setPlayer }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('AuthProvider missing');
  return c;
}
