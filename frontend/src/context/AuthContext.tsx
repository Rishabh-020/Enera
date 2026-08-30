import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import * as api from "../lib/api";
import type { Session, User } from "../lib/types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<User>;
  demoLogin: () => Promise<User>;
  switchDemoRole: (role: "Resident" | "Admin" | "Builder") => Promise<User>;
  loginDemo: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = sessionStorage.getItem("energy_session");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      sessionStorage.removeItem("energy_session");
      sessionStorage.removeItem("is_demo_mode");
      return null;
    }
  });

  const isDemoMode = Boolean(
    sessionStorage.getItem("is_demo_mode") === "true" ||
    session?.token?.startsWith("demo-token-") ||
    session?.user?.email?.toLowerCase().startsWith("demo")
  );

  const doLogin = useCallback(async (email: string, password: string) => {
    const isDemo = email.toLowerCase().startsWith("demo");
    if (isDemo) {
      sessionStorage.setItem("is_demo_mode", "true");
    } else {
      sessionStorage.removeItem("is_demo_mode");
    }
    const { token, user } = await api.login(email, password);
    const next: Session = { token, user };
    sessionStorage.setItem("energy_session", JSON.stringify(next));
    setSession(next);
    return user;
  }, []);

  const doDemoLogin = useCallback(async () => {
    const { token, user } = await api.demoLogin();
    const next: Session = { token, user };
    sessionStorage.setItem("is_demo_mode", "true");
    sessionStorage.setItem("energy_session", JSON.stringify(next));
    setSession(next);
    return user;
  }, []);

  const switchDemoRole = useCallback(async (targetRole: "Resident" | "Admin" | "Builder") => {
    const creds: Record<string, { email: string; pass: string }> = {
      Resident: { email: "demoOwner@enera.com", pass: "demoOwner@owner2007" },
      Admin: { email: "demoSociety@enera.com", pass: "demoSociety1@society2007" },
      Builder: { email: "demoBuilder@enera.com", pass: "demoBuilder1@builder2007" },
    };

    const target = creds[targetRole];
    if (!target) throw new Error("Invalid role target");

    const { token, user } = await api.login(target.email, target.pass);
    const next: Session = { token, user };
    sessionStorage.setItem("is_demo_mode", "true");
    sessionStorage.setItem("energy_session", JSON.stringify(next));
    setSession(next);
    return user;
  }, []);

  const loginDemo = useCallback((demoUser: User) => {
    const demoToken = `demo-token-${demoUser.role.toLowerCase()}-${Date.now()}`;
    const next: Session = { token: demoToken, user: demoUser };
    sessionStorage.setItem("is_demo_mode", "true");
    sessionStorage.setItem("energy_session", JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("energy_session");
    sessionStorage.removeItem("is_demo_mode");
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isDemoMode,
        login: doLogin,
        demoLogin: doDemoLogin,
        switchDemoRole,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
