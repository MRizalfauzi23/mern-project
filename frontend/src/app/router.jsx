import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/AppLayout.jsx";
import { ProtectedRoute } from "../components/ProtectedRoute.jsx";
import { AdminDashboardPage } from "../pages/AdminDashboardPage.jsx";
import { ApplicationDetailPage } from "../pages/ApplicationDetailPage.jsx";
import { ApplicationPipelinePage } from "../pages/ApplicationPipelinePage.jsx";
import { ApplicationsPage } from "../pages/ApplicationsPage.jsx";
import { ApplySuccessPage } from "../pages/ApplySuccessPage.jsx";
import { ApplicantFormPage } from "../pages/ApplicantFormPage.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { JobDetailPage } from "../pages/JobDetailPage.jsx";
import { JobsPage } from "../pages/JobsPage.jsx";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/apply" element={<ApplicantFormPage />} />
      <Route path="/apply/success" element={<ApplySuccessPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<JobsPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/pipeline" element={<ApplicationPipelinePage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
