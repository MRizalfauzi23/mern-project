"use client";

import { AppLayout } from "../../components/AppLayout.jsx";
import { ProtectedRoute } from "../../components/ProtectedRoute.jsx";

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}
