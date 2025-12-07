import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Film,
  Music,
  BookOpen,
  Gamepad2,
  ListChecks,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAdmin } from "../../../contexts/AdminContext";
import { useSidebar } from "../../../contexts/SidebarContext";
import ConfirmationModal from "../ui/ConfirmationModal";
import NavList, { type NavItem } from "./NavList";
import { signOut } from "../../../lib/auth";
import { BTN_PAD_DEFAULT } from "../../../styles/ui";
import Button from "../ui/Button";
import { logger } from "@/lib/logger";

interface SidebarProps {
  currentUser: { id: string; email?: string } | null;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "movies",
    label: "Movies & TV",
    icon: Film,
    path: "/app/movies",
  },
  { id: "music", label: "Music", icon: Music, path: "/app/music" },
  { id: "books", label: "Books", icon: BookOpen, path: "/app/books" },
  { id: "games", label: "Games", icon: Gamepad2, path: "/app/games" },
  { id: "tasks", label: "Tasks", icon: ListChecks, path: "/app/tasks" },
];

// User menu items (shown in accordion under username)
const USER_MENU_ITEMS: NavItem[] = [
  {
    id: "admin",
    label: "Admin Panel",
    icon: ShieldCheck,
    path: "/app/admin",
    requiredRole: "admin",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/app/settings",
  },
];

const Sidebar: React.FC<SidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAdmin();
  const { isCollapsed, isMobile, setIsCollapsed } = useSidebar();

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const focusTimeoutRef = useRef<number | null>(null);

  const handleLogout = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      logger.error("Failed to sign out", { error });
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
    focusTimeoutRef.current = window.setTimeout(() => {
      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.focus();
      }
    }, 100);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current !== null) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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

      {/* Sidebar - Shows as overlay from right on mobile, fixed sidebar on left on desktop */}
      <aside
        className={`fixed z-40 flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-[224px]"
        } ${
          isMobile
            ? `inset-y-0 right-0 border-l ${
                isCollapsed ? "translate-x-full" : "translate-x-0"
              }`
            : "inset-y-0 left-0 border-r"
        }`}
        aria-label="Main sidebar navigation"
      >
        {/* App Title/Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => handleNavigation("/app")}
              className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
              aria-label="Go to dashboard"
            >
              <img
                src="/quest-marker.svg"
                alt="NPC Finder logo"
                className="w-6 h-6"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNavigation("/app")}
              className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary-light transition-colors font-heading whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
            >
              <img
                src="/quest-marker.svg"
                alt=""
                className="w-6 h-6 flex-shrink-0"
              />
              <span>NPC Finder</span>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-4"
          role="navigation"
        >
          <NavList
            items={NAV_ITEMS}
            currentPath={location.pathname}
            isCollapsed={isCollapsed}
            role={role}
            onNavigate={handleNavigation}
          />
        </nav>

        {/* Bottom section: Settings, Admin, Sign Out */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
          <div className="space-y-1">
            <NavList
              items={USER_MENU_ITEMS}
              currentPath={location.pathname}
              isCollapsed={isCollapsed}
              role={role}
              onNavigate={handleNavigation}
            />

            {/* Sign Out Button */}
            <div className="px-2">
              <button
                type="button"
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 ${BTN_PAD_DEFAULT} rounded-lg transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
                  isCollapsed ? "justify-center" : ""
                }`}
                aria-label="Sign out"
                title={isCollapsed ? "Sign out" : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!isCollapsed && <span className="truncate">Sign Out</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer - Collapse Toggle (Desktop only) */}
        <div className="hidden md:block p-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={toggleCollapse}
            variant="subtle"
            fullWidth
            icon={
              isCollapsed ? (
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              ) : (
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              )
            }
            className={BTN_PAD_DEFAULT}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {!isCollapsed && (
              <span className="text-sm font-medium whitespace-nowrap">
                Collapse
              </span>
            )}
          </Button>
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
