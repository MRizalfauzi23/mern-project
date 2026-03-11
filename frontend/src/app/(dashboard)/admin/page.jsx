"use client";

import { ProtectedRoute } from "../../../components/ProtectedRoute.jsx";
import { AdminDashboardPage } from "../../../pages/AdminDashboardPage.jsx";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <AdminDashboardPage />
    </ProtectedRoute>
  );
}
