"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../features/auth/AuthContext";

export function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const roleKey = useMemo(() => roles.join("|"), [roles]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (roleKey && !roles.includes(user?.role)) {
      router.replace("/");
    }
  }, [isAuthenticated, roleKey, roles, router, user?.role]);

  if (!isAuthenticated) return null;
  if (roleKey && !roles.includes(user?.role)) return null;
  return children;
}
