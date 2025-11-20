import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Film,
  Music,
  BookOpen,
  Gamepad2,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import { useAdmin } from "../../../contexts/AdminContext";
import { useSidebar } from "../../../contexts/SidebarContext";
import { useProfileQuery } from "../../../hooks/useProfileQuery";
import ConfirmationModal from "../ui/ConfirmationModal";
import NavList, { type NavItem } from "./NavList";
import UserMenuDropdown from "./UserMenuDropdown";
import { signOut } from "../../../lib/auth";
import { BTN_PAD_DEFAULT } from "../../../styles/ui";
import Button from "../ui/Button";

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const focusTimeoutRef = useRef<number | null>(null);

  const displayName = profile?.display_name || currentUser?.email || "User";

  const handleLogout = () => {
    setShowSignOutModal(true);
  };

  const handleUserMenuSignOut = () => {
    setIsUserMenuOpen(false);
    handleLogout();
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

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Close user menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen]);

  // Close user menu when sidebar collapse state changes
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [isCollapsed]);

  const handleNavigation = (path: string) => {
    setIsUserMenuOpen(false); // Close dropdown on navigation
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

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside
        className={`hidden md:fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-40 md:flex flex-col ${
          isCollapsed ? "w-16" : "w-[224px]"
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
            isAdmin={isAdmin}
            onNavigate={handleNavigation}
          />
        </nav>

        {/* User Section with Dropdown - Moved to bottom */}
        <div
          ref={userMenuRef}
          className={`relative border-t border-gray-200 dark:border-gray-700 p-2 ${
            isCollapsed ? "overflow-visible" : ""
          }`}
        >
          {/* User Button */}
          <button
            type="button"
            onClick={() => {
              console.log(
                "User menu clicked, isCollapsed:",
                isCollapsed,
                "current isUserMenuOpen:",
                isUserMenuOpen
              );
              setIsUserMenuOpen(!isUserMenuOpen);
            }}
            className={`w-full flex items-center px-2 py-3 rounded-lg transition-all duration-200 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
              isCollapsed ? "justify-center" : "gap-2"
            }`}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            aria-label={isCollapsed ? "User menu" : undefined}
            title={isCollapsed ? "User menu" : undefined}
          >
            {isCollapsed ? (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
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
              <>
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
                <p className="text-base font-bold text-gray-900 dark:text-white truncate font-heading flex-1">
                  {displayName}
                </p>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </>
            )}
          </button>

          {/* User Menu Dropdown */}
          <UserMenuDropdown
            isOpen={isUserMenuOpen}
            isCollapsed={isCollapsed}
            displayName={displayName}
            items={USER_MENU_ITEMS}
            isAdmin={isAdmin}
            onNavigate={handleNavigation}
            onSignOut={handleUserMenuSignOut}
          />
        </div>

        {/* Sidebar Footer - Collapse Toggle */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
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
