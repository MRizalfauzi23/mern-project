"use client";

import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";
import { AdminDashboardPage } from "../../../legacy/pages/AdminDashboardPage.jsx";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminDashboardPage />
    </ProtectedRoute>
  );
}
