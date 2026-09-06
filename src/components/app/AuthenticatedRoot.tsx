import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";
import { AdminProvider } from "../../contexts/AdminContext";
import { EnrichmentProvider } from "../../contexts/EnrichmentContext";
import ErrorBoundary from "../shared/ui/ErrorBoundary";
import AuthLoadingScreen from "../shared/ui/AuthLoadingScreen";

const NotFoundPage = React.lazy(() => import("../pages/NotFoundPage"));
const AuthPage = React.lazy(() => import("../pages/AuthPage"));
const ForgotPassword = React.lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("../pages/ResetPassword"));
const AuthenticatedAppLayout = React.lazy(
  () => import("../layouts/AuthenticatedAppLayout"),
);

const AuthenticatedApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <Routes>
        {/* Login/Signup page (invite-only) */}
        <Route
          path="/login"
          element={
            authLoading ? (
              <AuthLoadingScreen />
            ) : user ? (
              <Navigate to="/app" replace />
            ) : (
              <AuthPage />
            )
          }
        />

        {/* Password reset pages (no auth required) */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected app routes */}
        <Route
          path="/app/*"
          element={
            authLoading ? (
              <AuthLoadingScreen />
            ) : user ? (
              <AdminProvider>
                <EnrichmentProvider>
                  <ErrorBoundary
                    fallbackTitle="App Error"
                    fallbackMessage="The application encountered an error. Your data is safe. Please try again."
                  >
                    <AuthenticatedAppLayout user={user} />
                  </ErrorBoundary>
                </EnrichmentProvider>
              </AdminProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all - unknown route (no auth check needed) */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

// Everything auth-related (Supabase client, login/app routing) lives behind
// this lazy boundary so the public landing page never loads it.
const AuthenticatedRoot: React.FC = () => (
  <AuthProvider>
    <AuthenticatedApp />
  </AuthProvider>
);

export default AuthenticatedRoot;
