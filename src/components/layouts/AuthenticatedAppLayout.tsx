import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import StarryBackground from "../shared/StarryBackground";
import PageContainer from "./PageContainer";
import DevIndicator from "../dev/DevIndicator";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import { SidebarProvider } from "../../contexts/SidebarContext";
import { useAdmin } from "../../contexts/AdminContext";

// Lazy load authenticated components to avoid Supabase imports on landing page
const HomePage = React.lazy(() => import("../pages/HomePage"));
const Sidebar = React.lazy(() => import("../shared/Sidebar"));
const MoviesPage = React.lazy(() => import("../pages/movies/MoviesPage"));
const BooksPage = React.lazy(() => import("../pages/books/BooksPage"));
const MusicPage = React.lazy(() => import("../pages/music/MusicPage"));
const GamesPage = React.lazy(() => import("../pages/games/GamesPage"));
const UserSettings = React.lazy(() => import("../pages/UserSettings"));
const Suggestions = React.lazy(() => import("../pages/Suggestions"));
const AdminPage = React.lazy(() => import("../pages/admin/AdminPage"));

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

            {/* Movies & TV - consolidated single route */}
            <Route path="/movies" element={<MoviesPage />} />

            {/* Books - consolidated single route */}
            <Route path="/books" element={<BooksPage />} />

            {/* Music - consolidated single route */}
            <Route path="/music" element={<MusicPage />} />

            {/* Games - consolidated single route */}
            <Route path="/games" element={<GamesPage />} />

            <Route
              path="/settings"
              element={<UserSettings currentUser={user} />}
            />
            <Route
              path="/suggestions"
              element={<Suggestions currentUser={user} />}
            />

            {/* Admin route */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute user={user}>
                  <AdminPage />
                </ProtectedAdminRoute>
              }
            />

            {/* Catch all - redirect to app home */}
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </React.Suspense>
      </PageContainer>
    </SidebarProvider>
  );
};

export default AuthenticatedAppLayout;
