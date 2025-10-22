import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Film,
  Music,
  BookOpen,
  Gamepad2,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { useAdmin } from "../../contexts/AdminContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import ConfirmationModal from "./ConfirmationModal";
import NavList, { type NavItem } from "./NavList";
import { signOut } from "../../lib/auth";

interface SidebarProps {
  currentUser: { id: string; email?: string } | null;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/app" },
  {
    id: "movies",
    label: "Movies & TV",
    icon: Film,
    path: "/app/movies",
  },
  { id: "music", label: "Music", icon: Music, path: "/app/music" },
  { id: "books", label: "Books", icon: BookOpen, path: "/app/books" },
  { id: "games", label: "Games", icon: Gamepad2, path: "/app/games" },
];

// User menu items (shown in accordion under username)
const USER_MENU_ITEMS: NavItem[] = [
  {
    id: "admin",
    label: "Admin Panel",
    icon: ShieldCheck,
    path: "/app/admin",
    adminOnly: true,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/app/settings",
  },
];

const Sidebar: React.FC<SidebarProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const { isCollapsed, isMobile, setIsCollapsed } = useSidebar();
  const { data: profile } = useProfileQuery();

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = profile?.display_name || currentUser?.email || "User";

  const handleLogout = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setIsSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  const handleNavigation = (path: string) => {
    void navigate(path);
    // Auto-collapse on mobile after navigation
    if (isMobile) {
      setIsCollapsed(true);
    }
    // Focus main content area after navigation for keyboard accessibility
    // Small delay to ensure DOM is updated after route change
    setTimeout(() => {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.focus();
      }
    }, 100);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Filter nav items based on admin status
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) {
      return isAdmin && currentUser;
    }
    return true;
  });

  // Determine active item based on current path
  const isActive = (itemPath: string) => {
    if (itemPath === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <>
      {/* Overlay for mobile when sidebar is expanded */}
      {!isCollapsed && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside
        className={`hidden md:fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-40 md:flex flex-col overflow-hidden ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        aria-label="Main sidebar navigation"
      >
        {/* App Title/Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          {isCollapsed ? (
            <button
              onClick={() => void navigate("/app")}
              className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
              aria-label="Go to dashboard"
            >
              <Home className="w-5 h-5 text-primary" aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={() => void navigate("/app")}
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary-light transition-colors font-heading whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 rounded"
            >
              NPC Finder
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4" role="navigation">
          <NavList
            items={visibleNavItems}
            currentPath={location.pathname}
            isCollapsed={isCollapsed}
            isAdmin={isAdmin}
            onNavigate={handleNavigation}
            isActive={isActive}
          />
        </nav>

        {/* Sidebar Footer - User Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-2">
          {/* User Header - Static Display */}
          <div
            className={`flex items-center gap-3 px-2 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            {isCollapsed ? (
              <div
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
                aria-label="User profile"
              >
                {isAdmin ? (
                  <ShieldCheck
                    className="w-5 h-5 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <UserIcon
                    className="w-5 h-5 text-primary"
                    aria-hidden="true"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {isAdmin ? (
                    <ShieldCheck
                      className="w-5 h-5 text-primary"
                      aria-hidden="true"
                    />
                  ) : (
                    <UserIcon
                      className="w-5 h-5 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-gray-900 dark:text-white truncate font-heading">
                    {displayName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Menu Items - Always Visible */}
          {!isCollapsed && (
            <nav className="space-y-1 px-1" aria-label="User menu">
              <div className="space-y-1">
                <NavList
                  items={USER_MENU_ITEMS}
                  currentPath={location.pathname}
                  isCollapsed={false}
                  isAdmin={isAdmin}
                  onNavigate={handleNavigation}
                  isActive={isActive}
                />
              </div>

              {/* Divider */}
              <div className="my-2 border-t border-gray-200 dark:border-gray-700 w-3/4 mx-auto" />

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="whitespace-nowrap">Sign Out</span>
              </button>
            </nav>
          )}

          {/* Collapse Toggle */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-medium whitespace-nowrap">
                    Collapse
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={() => void confirmSignOut()}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to log in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSigningOut}
      />
    </>
  );
};

export default Sidebar;
