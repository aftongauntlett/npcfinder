import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import PageContainer from "./PageContainer";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import { SidebarProvider } from "../../contexts/SidebarContext";
import { useTheme } from "@/hooks/useTheme";
// Lazy load authenticated components to avoid Supabase imports on landing page
const HomePage = React.lazy(() => import("../pages/HomePage"));
const Sidebar = React.lazy(() => import("../shared/layout/Sidebar"));
const MediaPage = React.lazy(() => import("../pages/media/MediaPage"));
const TasksPage = React.lazy(() => import("../pages/tasks/TasksPage"));
const UserSettings = React.lazy(() => import("../pages/UserSettings"));
const AdminPage = React.lazy(() => import("../pages/admin/AdminPage"));

// Star background is only used in dark mode; lazy-load so it doesn't ship in light mode.
const StarryBackground = React.lazy(
  () => import("@/components/shared/common/StarryBackground"),
);
const GlobalTimerAlert = React.lazy(() => import("../tasks/GlobalTimerAlert"));

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

  return (
    <SidebarProvider>
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
          <Sidebar currentUser={user} />
          {/* Global timer completion alert - shows on all pages */}
          <GlobalTimerAlert />
          {/* Main content - no top nav, sidebar handles everything */}
          <Routes>
            <Route index element={<HomePage user={user} />} />

            {/* Media (Collections-first) */}
            <Route path="media" element={<MediaPage />} />
            <Route path="media/:collectionId" element={<MediaPage />} />
            {/* Tasks - tabbed view with all templates */}
            <Route path="tasks" element={<TasksPage />} />
            <Route
              path="settings"
              element={<UserSettings currentUser={user} />}
            />
            {/* Admin route */}
            <Route
              path="admin"
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
