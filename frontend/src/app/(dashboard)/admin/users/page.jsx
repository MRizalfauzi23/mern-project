"use client";

import { ProtectedRoute } from "../../../../components/ProtectedRoute.jsx";
import { UsersPage } from "../../../../pages/UsersPage.jsx";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <UsersPage />
    </ProtectedRoute>
  );
}
