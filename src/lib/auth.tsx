import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type User = {
  name: string;
  email: string;
  district: string;
  avatar?: string;
};

type AuthCtx = {
  user: User | null;
  signIn: () => void;
  signOut: () => void;
  isSignedIn: boolean;
};

const AuthContext = createContext<AuthCtx | null>(null);

const MOCK_USER: User = {
  name: "Rahim Uddin",
  email: "rahim@example.com",
  district: "Comilla",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("kb_auth") === "1") setUser(MOCK_USER);
    } catch {
      /* SSR / private browsing */
    }
  }, []);

  const signIn = () => {
    setUser(MOCK_USER);
    try {
      localStorage.setItem("kb_auth", "1");
    } catch {
      /* ignore */
    }
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem("kb_auth");
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isSignedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
