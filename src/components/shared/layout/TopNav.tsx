import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  UserCircle2,
  ChevronDown,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { signOut } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { BTN_PAD_DEFAULT, DROPDOWN_ITEM_PAD } from "@/styles/ui";
import ConfirmationModal from "../ui/ConfirmationModal";

interface TopNavProps {
  currentUser: { id: string; email?: string } | null;
}

interface TopNavItem {
  id: string;
  label: string;
  path: string;
}

const NAV_ITEMS: TopNavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/app" },
  { id: "tasks", label: "Tasks", path: "/app/tasks" },
  { id: "media", label: "Media", path: "/app/media" },
];

const TopNav: React.FC<TopNavProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAdmin();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = useMemo(() => {
    const email = currentUser?.email;
    if (!email) return "Account";
    return email.split("@")[0] || "Account";
  }, [currentUser?.email]);

  const isActivePath = (itemPath: string) => {
    if (itemPath === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(itemPath);
  };

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    void navigate(path);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-[45] border-b border-gray-200/80 dark:border-gray-700/80 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md">
        <div className="container mx-auto h-16 px-4 sm:px-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleNavigate("/app")}
            className="inline-flex items-center gap-2 justify-self-start text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1"
            aria-label="Go to dashboard"
          >
            <img src="/quest-marker.svg" alt="" className="w-6 h-6" />
            <span className="hidden sm:inline font-heading font-bold text-lg">
              NPC Finder
            </span>
          </button>

          <nav className="justify-self-center" aria-label="Main navigation">
            <ul className="flex items-center justify-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = isActivePath(item.path);

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      className={`inline-flex items-center gap-2 rounded-lg ${BTN_PAD_DEFAULT} text-sm transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="relative justify-self-end" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-lg ${BTN_PAD_DEFAULT} text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isMenuOpen
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              aria-label="Open account menu"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
            >
              <UserCircle2 className="w-5 h-5" aria-hidden="true" />
              <span className="hidden md:inline max-w-32 truncate">
                {displayName}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
                role="menu"
                aria-label="Account menu"
              >
                {(role === "admin" || role === "super_admin") && (
                  <button
                    type="button"
                    onClick={() => handleNavigate("/app/admin")}
                    className={`w-full flex items-center gap-3 text-left ${DROPDOWN_ITEM_PAD} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    role="menuitem"
                  >
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    <span>Admin Panel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleNavigate("/app/settings")}
                  className={`w-full flex items-center gap-3 text-left ${DROPDOWN_ITEM_PAD} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                  role="menuitem"
                >
                  <Settings className="w-4 h-4" aria-hidden="true" />
                  <span>Settings</span>
                </button>

                <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 text-left ${DROPDOWN_ITEM_PAD} text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

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

export default TopNav;
