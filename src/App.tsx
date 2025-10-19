import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import StarryBackground from "./components/shared/StarryBackground";
import DemoLanding from "./components/pages/DemoLanding";
import AuthPage from "./components/pages/AuthPage";
import PageContainer from "./components/layouts/PageContainer";
import DevIndicator from "./components/dev/DevIndicator";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminProvider, useAdmin } from "./contexts/AdminContext";
import { SidebarProvider } from "./contexts/SidebarContext";

// Lazy load authenticated components to avoid Supabase imports on landing page
const HomePage = React.lazy(() => import("./components/pages/HomePage"));
const Sidebar = React.lazy(() => import("./components/shared/Sidebar"));
const MoviesWatchlist = React.lazy(
  () => import("./components/pages/movies/MoviesWatchlist")
);
const MoviesSuggestions = React.lazy(
  () => import("./components/pages/movies/MoviesSuggestions")
);
const Music = React.lazy(() => import("./components/pages/Music"));
const UserSettings = React.lazy(
  () => import("./components/pages/UserSettings")
);
const Suggestions = React.lazy(() => import("./components/pages/Suggestions"));
const AdminOverview = React.lazy(
  () => import("./components/pages/admin/AdminOverview")
);
const AdminInviteCodes = React.lazy(
  () => import("./components/pages/admin/AdminInviteCodes")
);

// Protected Route wrapper for admin routes
interface ProtectedAdminRouteProps {
  user: User;
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  user,
  children,
}) => {
  const { isAdmin, isLoading } = useAdmin();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Access Denied - Admin Only</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Main App Layout (authenticated users)
interface AppLayoutProps {
  user: User;
}

const AppLayout: React.FC<AppLayoutProps> = ({ user }) => {
  const { isAdmin: userIsAdmin } = useAdmin();

  return (
    <SidebarProvider>
      <PageContainer className="relative">
        <StarryBackground />
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
          }
        >
          <Sidebar currentUser={user} />
          <DevIndicator isAdmin={userIsAdmin} />

          {/* Main content - no top nav, sidebar handles everything */}
          <Routes>
            <Route path="/" element={<HomePage user={user} />} />

            {/* Movies & TV nested routes */}
            <Route path="/movies/watchlist" element={<MoviesWatchlist />} />
            <Route path="/movies/suggestions" element={<MoviesSuggestions />} />
            <Route
              path="/movies"
              element={<Navigate to="/app/movies/watchlist" replace />}
            />

            <Route path="/music" element={<Music />} />
            <Route
              path="/settings"
              element={<UserSettings currentUser={user} />}
            />
            <Route
              path="/suggestions"
              element={<Suggestions currentUser={user} />}
            />

            {/* Admin nested routes */}
            <Route
              path="/admin/overview"
              element={
                <ProtectedAdminRoute user={user}>
                  <AdminOverview />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/invite-codes"
              element={
                <ProtectedAdminRoute user={user}>
                  <AdminInviteCodes />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin"
              element={<Navigate to="/app/admin/overview" replace />}
            />

            {/* Catch all - redirect to app home */}
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </React.Suspense>
      </PageContainer>
    </SidebarProvider>
  );
};

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
              <AppLayout user={user} />
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
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          {/* Public routes - NO AUTH REQUIRED */}
          <Route path="/" element={<DemoLanding />} />

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
  );
};

export default App;
