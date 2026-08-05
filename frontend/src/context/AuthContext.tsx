import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import * as api from "../lib/api";
import type { Session, User } from "../lib/types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = sessionStorage.getItem("energy_session");
    return raw ? (JSON.parse(raw) as Session) : null;
  });

  const doLogin = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    const next: Session = { token, user };
    sessionStorage.setItem("energy_session", JSON.stringify(next));
    setSession(next);
    return user;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("energy_session");
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, login: doLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
