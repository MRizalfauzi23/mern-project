import { createContext, useContext, useMemo, useState } from "react";
import { logout as logoutRequest } from "./authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const isAuthenticated = Boolean(localStorage.getItem("accessToken"));

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      setSession: (payload) => {
        localStorage.setItem("accessToken", payload.accessToken);
        localStorage.setItem("user", JSON.stringify(payload.user));
        setUser(payload.user);
      },
      logout: async () => {
        try {
          await logoutRequest();
        } catch (_error) {
          // Keep local logout behavior even if API logout fails.
        }
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
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
