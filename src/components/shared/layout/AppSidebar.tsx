import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListMusic,
  Settings,
  ShieldCheck,
  Film,
  Book,
  Music2,
  Gamepad2,
  LogOut,
  Menu,
  X,
  UserCircle2,
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { TRACKER_SCOPES } from "@/data/trackerScopes";
import { signOut } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface AppSidebarProps {
  currentUser: { id: string; email?: string } | null;
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

const BASE_ITEMS: SidebarItem[] = [
  {
    id: "tracker",
    label: "Tracker",
    path: TRACKER_SCOPES["movies-tv"].path,
    icon: LayoutDashboard,
    children: [
      {
        id: "tracker-movies-tv",
        label: TRACKER_SCOPES["movies-tv"].navLabel,
        path: TRACKER_SCOPES["movies-tv"].path,
        icon: Film,
      },
      {
        id: "tracker-books",
        label: TRACKER_SCOPES.books.navLabel,
        path: TRACKER_SCOPES.books.path,
        icon: Book,
      },
      {
        id: "tracker-music",
        label: TRACKER_SCOPES.music.navLabel,
        path: TRACKER_SCOPES.music.path,
        icon: Music2,
      },
      {
        id: "tracker-games",
        label: TRACKER_SCOPES.games.navLabel,
        path: TRACKER_SCOPES.games.path,
        icon: Gamepad2,
      },
    ],
  },
  {
    id: "playlists",
    label: "Playlists",
    path: "/app/playlists",
    icon: ListMusic,
  },
  { id: "settings", label: "Settings", path: "/app/settings", icon: Settings },
];

export default function AppSidebar({ currentUser }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAdmin();

  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navItems = useMemo(() => {
    const items = [...BASE_ITEMS];

    if (role === "admin" || role === "super_admin") {
      items.push({
        id: "admin",
        label: "Admin",
        path: "/app/admin",
        icon: ShieldCheck,
      });
    }

    return items;
  }, [role]);

  const displayName = useMemo(() => {
    const email = currentUser?.email;
    if (!email) return "Account";
    return email.split("@")[0] || "Account";
  }, [currentUser?.email]);

  const isActive = (path: string) => {
    if (path.startsWith("/app/tracker")) {
      return location.pathname.startsWith("/app/tracker");
    }

    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      logger.error("Failed to sign out", { error });
    } finally {
      setIsSigningOut(false);
    }
  };

  const navigateAndClose = (path: string) => {
    void navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <div className="md:hidden sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link
            to={TRACKER_SCOPES["movies-tv"].path}
            className="font-semibold text-gray-900 dark:text-white"
          >
            NPC Finder
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-lg p-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
            aria-label="Toggle sidebar"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen w-60 z-40
          border-r border-gray-200 dark:border-gray-700
          bg-white/95 dark:bg-gray-900/95 backdrop-blur
          transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigateAndClose(TRACKER_SCOPES["movies-tv"].path)}
              className="flex items-center gap-2 text-left"
            >
              <img src="/quest-marker.svg" alt="" className="w-6 h-6" />
              <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                NPC Finder
              </span>
            </button>
          </div>

          <nav className="p-3 space-y-1" aria-label="App navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const parentActive = isActive(item.path);

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => navigateAndClose(item.path)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      parentActive
                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>

                  {item.children && (
                    <div className="pl-5 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = location.pathname === child.path;

                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => navigateAndClose(child.path)}
                            className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                              childActive
                                ? "bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-light"
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
            })}
          </nav>

          <div className="mt-auto p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600 dark:text-gray-300">
              <UserCircle2 className="w-4 h-4" />
              <span className="truncate">{displayName}</span>
            </div>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
            >
              <LogOut className="w-4 h-4" />
              <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          aria-label="Close sidebar overlay"
        />
      )}
    </>
  );
}
