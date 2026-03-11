"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { logout as logoutRequest } from "./authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("user");
    const token = window.localStorage.getItem("accessToken");
    setUser(raw ? JSON.parse(raw) : null);
    setIsAuthenticated(Boolean(token));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      setSession: (payload) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("accessToken", payload.accessToken);
          window.localStorage.setItem("user", JSON.stringify(payload.user));
        }
        setUser(payload.user);
        setIsAuthenticated(true);
      },
      logout: async () => {
        try {
          await logoutRequest();
        } catch (_error) {
          // Keep local logout behavior even if API logout fails.
        }
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("accessToken");
          window.localStorage.removeItem("user");
        }
        setUser(null);
        setIsAuthenticated(false);
      }
    }),
    [user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
