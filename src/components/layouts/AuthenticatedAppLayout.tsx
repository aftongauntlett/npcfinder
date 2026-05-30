import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import PageContainer from "./PageContainer";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import { useTheme } from "@/hooks/useTheme";
import AppSidebar from "@/components/shared/layout/AppSidebar";
// Lazy load authenticated components to avoid Supabase imports on landing page
const TrackerPage = React.lazy(() => import("../pages/TrackerPage"));
const PlaylistsLibraryPage = React.lazy(
  () => import("../pages/PlaylistsLibraryPage"),
);
const FriendsPage = React.lazy(() => import("../pages/FriendsPage"));
const ProfilePage = React.lazy(() => import("../pages/ProfilePage"));
const UserSettings = React.lazy(() => import("../pages/UserSettings"));
const AdminPage = React.lazy(() => import("../pages/admin/AdminPage"));

// Star background is only used in dark mode; lazy-load so it doesn't ship in light mode.
const StarryBackground = React.lazy(
  () => import("@/components/shared/common/StarryBackground"),
);

interface AuthenticatedAppLayoutProps {
  user: User;
}

/**
 * Layout wrapper for authenticated app routes
 * Provides sidebar navigation, background, and route configuration
 */
const AuthenticatedAppLayout: React.FC<AuthenticatedAppLayoutProps> = ({
  user,
}) => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    document.body.classList.add("app-authenticated-shell");
    return () => {
      document.body.classList.remove("app-authenticated-shell");
    };
  }, []);

  return (
    <PageContainer className="relative">
      {resolvedTheme === "dark" && (
        <React.Suspense fallback={null}>
          <StarryBackground />
        </React.Suspense>
      )}
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        }
      >
        <div className="flex min-h-screen">
          <AppSidebar currentUser={user} />

          <div className="flex-1 min-w-0">
            <Routes>
              <Route
                index
                element={<Navigate to="/app/tracker/movies-tv" replace />}
              />
              <Route
                path="tracker"
                element={<Navigate to="/app/tracker/movies-tv" replace />}
              />
              <Route
                path="tracker/movies-tv"
                element={<TrackerPage scope="movies-tv" />}
              />
              <Route
                path="tracker/books"
                element={<TrackerPage scope="books" />}
              />
              <Route
                path="tracker/music"
                element={<TrackerPage scope="music" />}
              />
              <Route
                path="tracker/games"
                element={<TrackerPage scope="games" />}
              />
              <Route path="playlists" element={<PlaylistsLibraryPage />} />
              <Route path="friends" element={<FriendsPage />} />
              <Route
                path="social"
                element={<Navigate to="/app/profile" replace />}
              />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/:username" element={<ProfilePage />} />
              <Route
                path="playlists/mine"
                element={<Navigate to="/app/playlists?tab=mine" replace />}
              />
              <Route
                path="playlists/shared"
                element={<Navigate to="/app/playlists?tab=shared" replace />}
              />
              <Route
                path="playlists/:slug"
                element={<PlaylistsLibraryPage />}
              />
              <Route
                path="settings"
                element={<UserSettings currentUser={user} />}
              />
              <Route
                path="admin"
                element={
                  <ProtectedAdminRoute user={user}>
                    <AdminPage />
                  </ProtectedAdminRoute>
                }
              />

              <Route
                path="*"
                element={<Navigate to="/app/tracker/movies-tv" replace />}
              />
            </Routes>
          </div>
        </div>
      </React.Suspense>
    </PageContainer>
  );
};

export default AuthenticatedAppLayout;
