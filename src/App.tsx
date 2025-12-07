import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DemoLanding from "./components/pages/DemoLanding";
import DeveloperDocs from "./components/pages/DeveloperDocs";
import AuthPage from "./components/pages/AuthPage";
import AuthenticatedAppLayout from "./components/layouts/AuthenticatedAppLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import ErrorBoundary from "./components/shared/ui/ErrorBoundary";

// Authenticated App Wrapper
const AuthenticatedApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login/Signup page (invite-only) */}
      <Route
        path="/login"
        element={user ? <Navigate to="/app" replace /> : <AuthPage />}
      />

      {/* Protected app routes */}
      <Route
        path="/app/*"
        element={
          user ? (
            <AdminProvider>
              <ErrorBoundary
                fallbackTitle="App Error"
                fallbackMessage="The application encountered an error. Your data is safe. Please try again."
              >
                <AuthenticatedAppLayout user={user} />
              </ErrorBoundary>
            </AdminProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            {/* Public routes - NO AUTH REQUIRED */}
            <Route path="/" element={<DemoLanding />} />
            <Route path="/docs" element={<DeveloperDocs />} />

            {/* All authenticated routes wrapped in AuthProvider */}
            <Route
              path="/*"
              element={
                <AuthProvider>
                  <AuthenticatedApp />
                </AuthProvider>
              }
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
