"use client";
import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode,
} from "react";
import { authApi, User } from "./api";

interface AuthCtxType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
}

const AuthCtx = createContext<AuthCtxType>({
  user: null, token: null, loading: true,
  login: async () => {}, logout: () => {}, setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("agritrade_token");
    if (stored) {
      setToken(stored);
      authApi.me()
        .then(u => setUserState(u))
        .catch(() => { localStorage.removeItem("agritrade_token"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    localStorage.setItem("agritrade_token", data.access_token);
    setToken(data.access_token);
    setUserState(data.user);
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: User | null) => setUserState(u), []);

  return (
    <AuthCtx.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export const useUser = () => useContext(AuthCtx).user;
