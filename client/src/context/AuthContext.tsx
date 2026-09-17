"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<{ user: User | null; token: string | null }>({
    user: null,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("cg_token");
      const storedUser = localStorage.getItem("cg_user");

      if (storedToken && storedUser) {
        setAuth({
          token: storedToken,
          user: JSON.parse(storedUser),
        });
      }
    } catch {
      localStorage.removeItem("cg_token");
      localStorage.removeItem("cg_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((user: User, token: string) => {
    localStorage.setItem("cg_token", token);
    localStorage.setItem("cg_user", JSON.stringify(user));
    setAuth({ user, token });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cg_token");
    localStorage.removeItem("cg_user");
    setAuth({ user: null, token: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
