import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { api } from '@/api';
import { setToken } from '@/api/http';
import { LOGIN_TEST_MODE } from '@/api/mode';
import type { Balance, Player } from '@/api/types';

type AuthModal = 'login' | 'register' | null;

interface AuthValue {
  player: Player | null;
  balance: Balance | null;
  modal: AuthModal;
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

  const refreshBalance = useCallback(async () => {
    if (LOGIN_TEST_MODE) { setBalance(null); return; }
    setBalance(await api.account.getBalance());
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const { player, token } = await api.auth.login(u, p);
    setToken(token);
    setPlayer(player);
    setBalance(LOGIN_TEST_MODE ? null : await api.account.getBalance());
    setModal(null);
  }, []);

  const register = useCallback(async (d: Parameters<typeof api.auth.register>[0]) => {
    const { player, token } = await api.auth.register(d);
    setToken(token);
    setPlayer(player);
    setBalance(await api.account.getBalance());
    setModal(null);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setToken(null);
    setPlayer(null);
    setBalance(null);
  }, []);

  return (
    <Ctx.Provider value={{ player, balance, modal, openAuth: setModal, login, register, logout, refreshBalance, setPlayer }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('AuthProvider missing');
  return c;
}
