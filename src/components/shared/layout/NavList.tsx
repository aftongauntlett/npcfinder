import React, { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { ChevronDown } from "lucide-react";
import {
  prefetchMoviesData,
  prefetchTasksData,
  prefetchBooksData,
  prefetchGamesData,
  prefetchMusicData,
  debouncedPrefetch,
} from "../../../utils/queryPrefetch";
import { BTN_PAD_DEFAULT } from "../../../styles/ui";
import type { UserRole } from "../../../contexts/AdminContext";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  requiredRole?: "admin" | "super_admin";
  subItems?: NavItem[];
}

interface NavListProps {
  items: NavItem[];
  currentPath: string;
  isCollapsed: boolean;
  role: UserRole;
  onNavigate: (path: string) => void;
}

const NavList: React.FC<NavListProps> = ({
  items,
  currentPath,
  isCollapsed,
  role,
  onNavigate,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Prefetch handlers for each section
  const handlePrefetch = useCallback(
    (itemId: string) => {
      const userId = user?.id;
      if (!userId) return;

      const prefetchMap: Record<string, () => Promise<void>> = {
        movies: () => prefetchMoviesData(queryClient, userId),
        tasks: () => prefetchTasksData(queryClient, userId),
        books: () => prefetchBooksData(queryClient, userId),
        games: () => prefetchGamesData(queryClient, userId),
        music: () => prefetchMusicData(queryClient, userId),
      };

      const prefetchFn = prefetchMap[itemId];
      if (prefetchFn) {
        const debounced = debouncedPrefetch(prefetchFn, 300);
        debounced();
      }
    },
    [queryClient, user?.id]
  );

  // Check if user has access based on required role
  const hasAccess = (item: NavItem) => {
    if (!item.requiredRole) return true;
    if (item.requiredRole === "admin")
      return ["admin", "super_admin"].includes(role);
    if (item.requiredRole === "super_admin") return role === "super_admin";
    return false;
  };

  // Determine if a path is active based on current location
  const isActive = (itemPath: string) => {
    if (itemPath === "/app") {
      return currentPath === "/app";
    }
    return currentPath.startsWith(itemPath);
  };

  return (
    <ul className="space-y-1 px-2">
      {items.filter(hasAccess).map((item) => {
        const Icon = item.icon;
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const active =
          isActive(item.path) ||
          (hasSubItems && item.subItems!.some((sub) => isActive(sub.path)));

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onNavigate(item.path)}
              onMouseEnter={() => handlePrefetch(item.id)}
              className={`w-full flex items-center gap-3 ${BTN_PAD_DEFAULT} rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
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
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && hasSubItems && (
                <ChevronDown
                  className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                    active ? "rotate-0" : "-rotate-90"
                  }`}
                />
              )}
            </button>

            {hasSubItems && active && (
              <div className="border-b border-gray-300 dark:border-gray-600 mx-2 my-1" />
            )}

            {/* Render sub-items if they exist and parent is active */}
            {hasSubItems && active && (
              <ul className={`mt-1 ${isCollapsed ? "" : "ml-6"} space-y-1`}>
                {item.subItems!.filter(hasAccess).map((subItem) => {
                  const SubIcon = subItem.icon;
                  // Check if this sub-item is active (exact path match only)
                  const subActive =
                    currentPath === subItem.path ||
                    currentPath === subItem.path.split("?")[0];
                  const hasNestedSubItems =
                    subItem.subItems && subItem.subItems.length > 0;

                  return (
                    <li key={subItem.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate(subItem.path)}
                        className={`w-full flex items-center ${
                          isCollapsed
                            ? "justify-center px-3 py-2 gap-0"
                            : "gap-2 px-3 py-2"
                        } rounded-lg text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
                          subActive
                            ? "bg-primary/20 text-primary font-medium"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        aria-label={subItem.label}
                        aria-current={subActive ? "page" : undefined}
                      >
                        <SubIcon
                          className="w-5 h-5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        {!isCollapsed && (
                          <span className="truncate">{subItem.label}</span>
                        )}
                      </button>

                      {/* Render nested sub-items (3rd level) */}
                      {hasNestedSubItems && subActive && (
                        <ul className="mt-1 ml-6 space-y-1">
                          {subItem.subItems!.map((nestedSubItem) => {
                            const NestedIcon = nestedSubItem.icon;
                            const nestedActive =
                              currentPath.startsWith(
                                subItem.path.split("?")[0]
                              ) &&
                              (nestedSubItem.path.split("?")[1]
                                ? currentPath.includes(
                                    nestedSubItem.path.split("?")[1]
                                  )
                                : false);

                            return (
                              <li key={nestedSubItem.id}>
                                <button
                                  type="button"
                                  onClick={() => onNavigate(nestedSubItem.path)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
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
  );
};

export default NavList;
