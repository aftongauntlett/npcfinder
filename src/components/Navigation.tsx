import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  FlaskConical,
  User as UserIcon,
  Settings,
  ChevronDown,
} from "lucide-react";
import QuickSwitch from "./shared/QuickSwitch";
import WeatherWidget from "./shared/WeatherWidget";
import ConfirmationModal from "./shared/ConfirmationModal";
import { signOut } from "../lib/auth";
import { isAdmin } from "../lib/admin";
import { getUserProfile } from "../lib/profiles";

interface NavigationProps {
  currentUser: User | null;
}

const Navigation: React.FC<NavigationProps> = ({ currentUser }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser) return;

      try {
        const { data } = await getUserProfile(currentUser.id);
        setDisplayName(data?.display_name || currentUser.email || "User");
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setDisplayName(currentUser.email || "User");
      }
    };

    void loadUserProfile();
  }, [currentUser, location.pathname]);

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
      setIsDropdownOpen(false);
    }
  };

  const handleMenuItemClick = (path: string) => {
    setIsDropdownOpen(false);
    void navigate(path);
  };

  const showAdminButton = currentUser && isAdmin(currentUser.id);

  return (
    <nav
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Title (clickable to go home) */}
          <h1
            onClick={() => void navigate("/app")}
            className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-primary transition-colors"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                void navigate("/app");
              }
            }}
          >
            NPC Finder
          </h1>

          {/* Right side: QuickSwitch, Weather Widget, and Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-4">
            <QuickSwitch />
            <WeatherWidget />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Profile menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <UserIcon className="w-5 h-5" aria-hidden="true" />
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 min-w-max bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                  role="menu"
                >
                  {/* User Info */}
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {displayName}
                    </p>
                  </div>

                  {/* Divider */}
                  <div
                    className="my-1 border-t border-gray-200 dark:border-gray-700"
                    role="separator"
                  />

                  {/* Settings */}
                  <button
                    onClick={() => handleMenuItemClick("/app/settings")}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap text-left"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4" aria-hidden="true" />
                    <span>Settings</span>
                  </button>

                  {/* Admin (if user is admin) */}
                  {showAdminButton && (
                    <button
                      onClick={() => handleMenuItemClick("/app/admin")}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap text-left"
                      role="menuitem"
                    >
                      <FlaskConical className="w-4 h-4" aria-hidden="true" />
                      <span>Admin Panel</span>
                    </button>
                  )}

                  {/* Divider */}
                  <div
                    className="my-1 border-t border-gray-200 dark:border-gray-700"
                    role="separator"
                  />

                  {/* Sign Out */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap text-left"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={() => void confirmSignOut()}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to log in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="warning"
        isLoading={isSigningOut}
      />
    </nav>
  );
};

export default Navigation;
