"use client";

import { ProtectedRoute } from "../../../components/ProtectedRoute";
import { AdminDashboardPage } from "../../../legacy/pages/AdminDashboardPage";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminDashboardPage />
    </ProtectedRoute>
  );
}

