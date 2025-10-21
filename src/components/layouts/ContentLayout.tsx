import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Film,
  Music,
  BookOpen,
  Gamepad2,
  Settings,
  ShieldCheck,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAdmin } from "../../contexts/AdminContext";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import { signOut } from "../../lib/auth";

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface ContentLayoutProps {
  title: string;
  description?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
}

/**
 * ContentLayout - Reusable layout for content pages
 * Provides consistent header with title, description, and tabs
 * Mobile: Top navigation with hamburger menu
 * Desktop: Standard header with sidebar
 */
const ContentLayout: React.FC<ContentLayoutProps> = ({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const { data: profile } = useProfileQuery();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const displayName = profile?.display_name || "User";

  const navItems = [
    { label: "Dashboard", icon: Home, path: "/app" },
    { label: "Movies & TV", icon: Film, path: "/app/movies" },
    { label: "Music", icon: Music, path: "/app/music" },
    { label: "Books", icon: BookOpen, path: "/app/books" },
    { label: "Games", icon: Gamepad2, path: "/app/games" },
    ...(isAdmin
      ? [{ label: "Admin", icon: ShieldCheck, path: "/app/admin" }]
      : []),
    { label: "Settings", icon: Settings, path: "/app/settings" },
  ];

  const handleNavClick = (path: string) => {
    void navigate(path);
    setShowMobileMenu(false);
  };

  const handleSignOut = () => {
    void signOut();
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen focus:outline-none"
    >
      {/* Mobile Header - Only visible on mobile */}
      <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6 text-gray-900 dark:text-white" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
            )}
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-[80vh] overflow-y-auto">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {displayName}
                </span>
              </div>

              {/* Navigation */}
              <nav className="py-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/app" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* Page Header - Desktop styling */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-30 hidden md:block">
        <div className="container mx-auto px-6 py-4">
          {/* Title and Description */}
          <div className="mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-300">{description}</p>
            )}
          </div>

          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <nav
              className="flex gap-4 border-b border-gray-200 dark:border-gray-700 -mb-px"
              role="tablist"
              aria-label={`${title} sections`}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                      isActive
                        ? "text-primary dark:text-primary-light border-primary dark:border-primary-light"
                        : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${tab.id}-panel`}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Page Content */}
      <div className="container mx-auto px-6 py-8" role="main">
        {children}
      </div>
    </main>
  );
};

export default ContentLayout;
