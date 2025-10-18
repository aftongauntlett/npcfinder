import React, { useState, useEffect, useRef } from "react";
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
  Activity,
  UserPlus,
} from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { useProfileQuery } from "../hooks/useProfileQuery";
import ConfirmationModal from "./shared/ConfirmationModal";
import { signOut } from "../lib/auth";

interface SidebarProps {
  currentUser: { id: string; email?: string } | null;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  adminOnly?: boolean;
  subItems?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/app" },
  { id: "movies", label: "Movies & TV", icon: Film, path: "/app/movies" },
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
    subItems: [
      {
        id: "admin-overview",
        label: "Overview",
        icon: Activity,
        path: "/app/admin?tab=overview",
      },
      {
        id: "admin-invites",
        label: "Invite Codes",
        icon: UserPlus,
        path: "/app/admin?tab=invite-codes",
      },
    ],
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
  const { data: profile } = useProfileQuery();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = profile?.display_name || currentUser?.email || "User";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        // No dropdown to close anymore
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Get initial collapsed state from localStorage, default to false on desktop, true on mobile
  const getInitialCollapsed = () => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      return saved === "true";
    }
    // Default: collapsed on mobile, expanded on desktop
    return window.innerWidth < 768;
  };

  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
  }, [isCollapsed]);

  // Auto-collapse on mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  const handleNavigation = (path: string) => {
    void navigate(path);
    // Auto-collapse on mobile after navigation
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
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
      {!isCollapsed && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-40 flex flex-col overflow-hidden ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        aria-label="Main sidebar navigation"
      >
        {/* App Title/Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          {isCollapsed ? (
            <button
              onClick={() => void navigate("/app")}
              className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"
              aria-label="Go to dashboard"
            >
              <Home className="w-5 h-5 text-primary" aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={() => void navigate("/app")}
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary-light transition-colors font-heading whitespace-nowrap"
            >
              NPC Finder
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4" role="navigation">
          <ul className="space-y-1 px-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        active ? "text-primary dark:text-primary-light" : ""
                      }`}
                      aria-hidden="true"
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>

                  {/* Render sub-items if they exist and sidebar is not collapsed */}
                  {!isCollapsed && hasSubItems && active && (
                    <ul className="mt-1 ml-8 space-y-1">
                      {item
                        .subItems!.filter((subItem) =>
                          subItem.adminOnly ? isAdmin : true
                        )
                        .map((subItem) => {
                          const SubIcon = subItem.icon;
                          const subActive =
                            location.pathname === subItem.path.split("?")[0] ||
                            (location.pathname.startsWith(item.path) &&
                              location.search.includes(
                                subItem.path.split("?")[1] || ""
                              ));
                          const hasNestedSubItems =
                            subItem.subItems && subItem.subItems.length > 0;

                          return (
                            <li key={subItem.id}>
                              <button
                                onClick={() => handleNavigation(subItem.path)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                  subActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-medium"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                                aria-label={subItem.label}
                              >
                                <SubIcon
                                  className="w-4 h-4 flex-shrink-0"
                                  aria-hidden="true"
                                />
                                <span className="truncate">
                                  {subItem.label}
                                </span>
                              </button>

                              {/* Render nested sub-items (3rd level) */}
                              {hasNestedSubItems && subActive && (
                                <ul className="mt-1 ml-6 space-y-1">
                                  {subItem.subItems!.map((nestedSubItem) => {
                                    const NestedIcon = nestedSubItem.icon;
                                    const nestedActive =
                                      location.pathname.startsWith(
                                        subItem.path.split("?")[0]
                                      ) &&
                                      location.search.includes(
                                        nestedSubItem.path.split("?")[1] || ""
                                      );

                                    return (
                                      <li key={nestedSubItem.id}>
                                        <button
                                          onClick={() =>
                                            handleNavigation(nestedSubItem.path)
                                          }
                                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                                            nestedActive
                                              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-medium"
                                              : "text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                          }`}
                                          aria-label={nestedSubItem.label}
                                        >
                                          <NestedIcon
                                            className="w-3 h-3 flex-shrink-0"
                                            aria-hidden="true"
                                          />
                                          <span className="truncate">
                                            {nestedSubItem.label}
                                          </span>
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
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
              {USER_MENU_ITEMS.filter((item) =>
                item.adminOnly ? isAdmin : true
              ).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                        active
                          ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          active ? "text-primary dark:text-primary-light" : ""
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </button>

                    {/* Render sub-items if they exist and item is active */}
                    {hasSubItems && active && (
                      <div className="mt-1 ml-6 space-y-1">
                        {item.subItems!.map((subItem) => {
                          const SubIcon = subItem.icon;
                          // Check if this specific sub-item is active
                          const subActive = location.search
                            ? location.search.includes(
                                subItem.path.split("?")[1] || ""
                              )
                            : false;

                          return (
                            <button
                              key={subItem.id}
                              onClick={() => handleNavigation(subItem.path)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                                subActive
                                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-medium"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                              }`}
                              aria-label={subItem.label}
                              aria-current={subActive ? "page" : undefined}
                            >
                              <SubIcon
                                className="w-3 h-3 flex-shrink-0"
                                aria-hidden="true"
                              />
                              <span className="truncate">{subItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Divider */}
              <div className="my-2 border-t border-gray-200 dark:border-gray-700 w-3/4 mx-auto" />

              {/* Sign Out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
              className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
        variant="warning"
        isLoading={isSigningOut}
      />
    </>
  );
};

export default Sidebar;
