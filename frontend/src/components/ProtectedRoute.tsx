"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../features/auth/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
  roles?: string[];
};

export function ProtectedRoute({ children, roles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const roleKey = useMemo(() => roles.join("|"), [roles]);
  const userRole = user?.role ?? "";

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (roleKey && !roles.includes(userRole)) {
      router.replace("/");
    }
  }, [isAuthenticated, roleKey, roles, router, userRole]);

  if (!isAuthenticated) return null;
  if (roleKey && !roles.includes(userRole)) return null;
  return children;
}
