import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DemoLanding from "./components/pages/DemoLanding";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/shared/ui/ErrorBoundary";
import AuthLoadingScreen from "./components/shared/ui/AuthLoadingScreen";

// Lazy-loaded so the public landing page doesn't ship the Supabase/auth/app
// bundle - none of it is needed until a visitor navigates away from "/".
const PrivacyPolicyPage = React.lazy(
  () => import("./components/pages/PrivacyPolicyPage"),
);
const TermsOfServicePage = React.lazy(
  () => import("./components/pages/TermsOfServicePage"),
);
const AuthenticatedRoot = React.lazy(
  () => import("./components/app/AuthenticatedRoot"),
);

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            {/* Public routes - NO AUTH REQUIRED */}
            <Route path="/" element={<DemoLanding />} />
            <Route
              path="/privacy"
              element={
                <Suspense fallback={null}>
                  <PrivacyPolicyPage />
                </Suspense>
              }
            />
            <Route
              path="/terms"
              element={
                <Suspense fallback={null}>
                  <TermsOfServicePage />
                </Suspense>
              }
            />

            {/* Everything else (login, password reset, the authenticated
                app) is lazy-loaded together since it all needs Supabase. */}
            <Route
              path="/*"
              element={
                <Suspense fallback={<AuthLoadingScreen />}>
                  <AuthenticatedRoot />
                </Suspense>
              }
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
