import React from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  adminOnly?: boolean;
  subItems?: NavItem[];
}

interface NavListProps {
  items: NavItem[];
  currentPath: string;
  isCollapsed: boolean;
  isAdmin: boolean;
  onNavigate: (path: string) => void;
  isActive: (path: string) => boolean;
}

const NavList: React.FC<NavListProps> = ({
  items,
  currentPath,
  isCollapsed,
  isAdmin,
  onNavigate,
  isActive,
}) => {
  return (
    <ul className="space-y-1 px-2">
      {items
        .filter((item) => (item.adminOnly ? isAdmin : true))
        .map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
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
              </button>

              {/* Render sub-items if they exist and sidebar is not collapsed and parent is active */}
              {!isCollapsed && hasSubItems && active && (
                <ul className="mt-1 ml-8 space-y-1">
                  {item
                    .subItems!.filter((subItem) =>
                      subItem.adminOnly ? isAdmin : true
                    )
                    .map((subItem) => {
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
                            onClick={() => onNavigate(subItem.path)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
                              subActive
                                ? "bg-blue-500/20 text-blue-400 dark:bg-blue-500/30 dark:text-blue-300 font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            aria-label={subItem.label}
                            aria-current={subActive ? "page" : undefined}
                          >
                            <SubIcon
                              className="w-4 h-4 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">{subItem.label}</span>
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
                                      onClick={() =>
                                        onNavigate(nestedSubItem.path)
                                      }
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
