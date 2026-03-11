"use client";

import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import { UsersPage } from "../../../../legacy/pages/UsersPage";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <UsersPage />
    </ProtectedRoute>
  );
}

