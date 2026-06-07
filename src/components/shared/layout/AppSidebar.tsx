import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LayoutDashboard,
  ListMusic,
  Settings,
  ShieldCheck,
  Film,
  Tv,
  Book,
  Music2,
  Gamepad2,
  Menu,
  X,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { TRACKER_SCOPES } from "@/data/trackerScopes";
import { useProfileQuery } from "@/hooks/useProfileQuery";

interface AppSidebarProps {
  currentUser?: { id: string; email?: string } | null;
}

interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  children?: Array<{
    id: string;
    label: string;
    path: string;
    icon: typeof LayoutDashboard;
  }>;
}

export default function AppSidebar({
  currentUser: _currentUser,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAdmin();
  const { data: profile } = useProfileQuery();
  const isTrackerRoute = location.pathname.startsWith("/app/tracker");

  const [isOpen, setIsOpen] = useState(false);
  const [isTrackerExpanded, setIsTrackerExpanded] = useState(isTrackerRoute);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    // Collapse tracker submenu when user navigates away from tracker pages.
    if (!isTrackerRoute) {
      setIsTrackerExpanded(false);
    }
  }, [isTrackerRoute]);

  useEffect(() => {
    // Always close mobile menu when route changes.
    setIsOpen(false);
  }, [location.pathname]);

  const profilePath = profile?.username
    ? `/app/profile/${profile.username}`
    : "/app/profile";

  const navItems = useMemo(() => {
    const items: SidebarItem[] = [
      {
        id: "tracker",
        label: "Tracker",
        path: TRACKER_SCOPES.movies.path,
        icon: LayoutDashboard,
        children: [
          {
            id: "tracker-movies",
            label: TRACKER_SCOPES.movies.navLabel,
            path: TRACKER_SCOPES.movies.path,
            icon: Film,
          },
          {
            id: "tracker-tv",
            label: TRACKER_SCOPES.tv.navLabel,
            path: TRACKER_SCOPES.tv.path,
            icon: Tv,
          },
          {
            id: "tracker-books",
            label: TRACKER_SCOPES.books.navLabel,
            path: TRACKER_SCOPES.books.path,
            icon: Book,
          },
          {
            id: "tracker-games",
            label: TRACKER_SCOPES.games.navLabel,
            path: TRACKER_SCOPES.games.path,
            icon: Gamepad2,
          },
          {
            id: "tracker-music",
            label: TRACKER_SCOPES.music.navLabel,
            path: TRACKER_SCOPES.music.path,
            icon: Music2,
          },
        ],
      },
      {
        id: "playlists",
        label: "Playlists",
        path: "/app/playlists",
        icon: ListMusic,
      },
      {
        id: "social",
        label: "Social",
        path: profilePath,
        icon: Users,
      },
      {
        id: "import",
        label: "Import",
        path: "/app/import",
        icon: Upload,
      },
      {
        id: "settings",
        label: "Settings",
        path: "/app/settings",
        icon: Settings,
      },
    ];

    if (role === "admin" || role === "super_admin") {
      items.push({
        id: "admin",
        label: "Admin",
        path: "/app/admin",
        icon: ShieldCheck,
      });
    }

    return items;
  }, [profilePath, role]);

  const isActive = (path: string) => {
    if (path.startsWith("/app/tracker")) {
      return location.pathname.startsWith(path);
    }

    if (path.startsWith("/app/playlists")) {
      return location.pathname.startsWith("/app/playlists");
    }

    if (path.startsWith("/app/profile")) {
      return (
        location.pathname.startsWith("/app/profile") ||
        location.pathname.startsWith("/app/friends") ||
        location.pathname.startsWith("/app/social")
      );
    }

    return location.pathname.startsWith(path);
  };

  const navigateAndClose = (path: string) => {
    void navigate(path);
    setIsOpen(false);
  };

  const renderNavItems = ({
    isCompact,
    idPrefix,
  }: {
    isCompact: boolean;
    idPrefix: string;
  }) =>
    navItems.map((item) => {
      const Icon = item.icon;
      const parentActive = item.children
        ? item.children.some((child) => isActive(child.path))
        : isActive(item.path);
      const isCollapsibleGroup = !!item.children && item.id === "tracker";
      const isGroupExpanded =
        !isCompact && item.id === "tracker" ? isTrackerExpanded : false;
      const childContainerId = `${idPrefix}-${item.id}-children`;

      return (
        <div key={`${idPrefix}-${item.id}`} className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              if (isCompact) {
                navigateAndClose(item.path);
                return;
              }

              if (isCollapsibleGroup) {
                if (item.id === "tracker") {
                  setIsTrackerExpanded((prev) => !prev);
                }
                return;
              }

              navigateAndClose(item.path);
            }}
            aria-expanded={
              isCollapsibleGroup && !isCompact ? isGroupExpanded : undefined
            }
            aria-controls={
              isCollapsibleGroup && !isCompact ? childContainerId : undefined
            }
            title={isCompact ? item.label : undefined}
            className={`w-full flex items-center rounded-lg py-2 text-sm transition-colors ${
              isCompact ? "justify-center px-0" : "justify-between px-3"
            } ${
              parentActive
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span
              className={`inline-flex items-center ${isCompact ? "" : "gap-3"}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCompact && <span>{item.label}</span>}
            </span>
            {isCollapsibleGroup && !isCompact && (
              <ChevronDown
                className={`w-4 h-4 transition-transform shrink-0 ${
                  isGroupExpanded ? "rotate-180" : "rotate-0"
                }`}
              />
            )}
          </button>

          {!isCompact &&
            item.children &&
            (!isCollapsibleGroup || isGroupExpanded) && (
              <div id={childContainerId} className="pl-5 space-y-0.5">
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const childActive = isActive(child.path);

                  return (
                    <button
                      key={`${idPrefix}-${child.id}`}
                      type="button"
                      onClick={() => navigateAndClose(child.path)}
                      className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        childActive
                          ? "bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-light font-semibold"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <ChildIcon className="w-3.5 h-3.5" />
                      <span>{child.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
        </div>
      );
    });

  return (
    <>
      <div className="md:hidden sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link
            to={TRACKER_SCOPES.movies.path}
            className="flex items-center gap-2 min-w-0 text-gray-900 dark:text-white"
          >
            <img src="/quest-marker.svg" alt="" className="w-5 h-5 shrink-0" />
            <span className="font-semibold truncate">NPC Finder</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-lg p-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
            aria-label={
              isOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={isOpen}
            aria-controls="mobile-app-menu"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <aside
        className={`
          hidden md:block md:sticky md:top-0 md:h-screen md:z-40
          border-r border-gray-200/60 dark:border-white/5
          bg-white/95 dark:bg-gray-900/95 backdrop-blur
          transition-all duration-200
          ${isCollapsed ? "w-16" : "w-48"}
        `}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header / Logo */}
          <div
            className={`py-5 border-b border-gray-200 dark:border-gray-700 flex items-center ${
              isCollapsed ? "justify-center px-0" : "px-4"
            }`}
          >
            <button
              type="button"
              onClick={() => navigateAndClose(TRACKER_SCOPES.movies.path)}
              className="flex items-center gap-2 text-left min-w-0"
              title="NPC Finder"
            >
              <img
                src="/quest-marker.svg"
                alt=""
                className="w-6 h-6 shrink-0"
              />
              {!isCollapsed && (
                <span className="font-heading font-bold text-lg text-gray-900 dark:text-white truncate">
                  NPC Finder
                </span>
              )}
            </button>
          </div>

          {/* Nav */}
          <nav
            className="p-2 space-y-1 flex-1 overflow-y-auto"
            aria-label="App navigation"
          >
            {renderNavItems({ isCompact: isCollapsed, idPrefix: "desktop" })}
          </nav>

          {/* Footer — collapse toggle only */}
          <div className="p-2 border-t border-gray-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={toggleCollapsed}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`hidden md:flex w-full items-center rounded-lg py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                isCollapsed ? "justify-center px-0" : "gap-3 px-3"
              }`}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 top-14 bg-black/20 z-30"
            aria-label="Close navigation menu overlay"
          />

          <div
            id="mobile-app-menu"
            className="md:hidden fixed top-14 inset-x-0 z-40 border-b border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur max-h-[calc(100vh-3.5rem)] overflow-y-auto"
          >
            <nav className="p-2 space-y-1" aria-label="Mobile app navigation">
              {renderNavItems({ isCompact: false, idPrefix: "mobile" })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
