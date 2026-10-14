import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '@/api';
import { HTTP_AUTH_MODE } from '@/api/mode';
import type { Balance, Player } from '@/api/types';

type AuthModal = 'login' | 'register' | null;

interface AuthValue {
  player: Player | null;
  balance: Balance | null;
  balanceLoading: boolean;
  balanceError: string;
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
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState('');
  const balanceRequest = useRef(0);
  const [modal, setModal] = useState<AuthModal>(null);

  const [restoring, setRestoring] = useState(HTTP_AUTH_MODE);
  const [sessionError, setSessionError] = useState('');
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const revision = useRef(0);
  const signingOut = useRef(false);
  const retrySession = useCallback(() => setRestoreAttempt(n => n + 1), []);

  useEffect(() => {
    if (!HTTP_AUTH_MODE) return;
    const current = ++revision.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
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

  useEffect(() => {
    if (!HTTP_AUTH_MODE || !player) return;
    const controllers = new Set<AbortController>();
    let active = true;
    const onActivity = (event: Event) => {
      if (!event.isTrusted || signingOut.current || (event instanceof KeyboardEvent && event.repeat)) return;
      const current = revision.current;
      const controller = new AbortController();
      controllers.add(controller);
      // Each user event reaches the gateway; only the gateway caches validation.
      api.auth.activity(controller.signal).then(() => {
        if (active && current === revision.current) setSessionError('');
      }).catch((error: unknown) => {
        if (!active || current !== revision.current || controller.signal.aborted || signingOut.current) return;
        if ((error as { status?: number })?.status === 401) {
          ++revision.current;
          setPlayer(null);
          setBalance(null);
          setSessionError('');
        } else if ((error as { status?: number })?.status !== 409) {
          setSessionError('Could not validate your session. Try again shortly.');
        }
      }).finally(() => controllers.delete(controller));
    };
    const events = ['click', 'keydown', 'input', 'wheel', 'touchmove'];
    for (const name of events) document.addEventListener(name, onActivity, { capture: true, passive: true });
    return () => {
      active = false;
      for (const name of events) document.removeEventListener(name, onActivity, true);
      for (const controller of controllers) controller.abort();
    };
  }, [player]);

  const refreshBalance = useCallback(async () => {
    const request = ++balanceRequest.current;
    const current = revision.current;
    setBalanceLoading(true);
    setBalanceError('');
    try {
      const result = await api.account.getBalance();
      if (request === balanceRequest.current && current === revision.current) setBalance(result);
    } catch (error: unknown) {
      if (request !== balanceRequest.current || current !== revision.current) return;
      setBalance(null);
      if ((error as { status?: number })?.status === 401) {
        ++revision.current;
        setPlayer(null);
      } else setBalanceError('Could not load your balance. Please try again.');
    } finally {
      if (request === balanceRequest.current) setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    setBalance(null);
    setBalanceError('');
    if (player) void refreshBalance();
    else setBalanceLoading(false);
    return () => { ++balanceRequest.current; };
  }, [player, refreshBalance]);

  const login = useCallback(async (u: string, p: string) => {
    const { player } = await api.auth.login(u, p);
    ++revision.current;
    setRestoring(false);
    setSessionError('');
    setPlayer(player);
    setBalance(null);
    setModal(null);
  }, []);

  const register = useCallback(async (d: Parameters<typeof api.auth.register>[0]) => {
    const { player } = await api.auth.register(d);
    setPlayer(player);
    setBalance(null);
    setModal(null);
  }, []);

  const logout = useCallback(async () => {
    signingOut.current = true;
    ++revision.current;
    try { await api.auth.logout(); } finally { signingOut.current = false; }
    ++revision.current;
    setRestoring(false);
    setSessionError('');
    setPlayer(null);
    setBalance(null);
  }, []);

  return (
    <Ctx.Provider value={{ player, balance, balanceLoading, balanceError, modal, restoring, sessionError, retrySession, openAuth: setModal, login, register, logout, refreshBalance, setPlayer }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('AuthProvider missing');
  return c;
}
