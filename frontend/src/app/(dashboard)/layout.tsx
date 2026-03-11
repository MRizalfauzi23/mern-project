"use client";

import { AppLayout } from "../../components/AppLayout";
import { ProtectedRoute } from "../../components/ProtectedRoute";

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

