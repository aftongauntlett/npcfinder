import React from "react";
import { LogOut } from "lucide-react";
import type { NavItem } from "./NavList";
import { DROPDOWN_ITEM_PAD } from "../../../styles/ui";

interface UserMenuDropdownProps {
  isOpen: boolean;
  isCollapsed: boolean;
  displayName: string;
  items: NavItem[];
  isAdmin: boolean;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}

/**
 * UserMenuDropdown - Dropdown menu for user actions (Settings, Admin, Sign Out)
 * Renders differently based on sidebar collapsed state:
 * - Expanded: dropdown below the user button
 * - Collapsed: dropdown to the right of the sidebar with user name header
 */
const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  isOpen,
  isCollapsed,
  displayName,
  items,
  isAdmin,
  onNavigate,
  onSignOut,
}) => {
  if (!isOpen) return null;

  // Filter items based on admin status
  const visibleItems = items.filter((item) =>
    item.adminOnly ? isAdmin : true
  );

  // Expanded state: dropdown above user button
  if (!isCollapsed) {
    return (
      <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[80vh] overflow-y-auto">
        {/* Menu Items */}
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 ${DROPDOWN_ITEM_PAD} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

        {/* Sign Out */}
        <button
          type="button"
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 ${DROPDOWN_ITEM_PAD} text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset`}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    );
  }

  // Collapsed state: dropdown to the right above the button
  return (
    <div className="absolute left-full bottom-0 ml-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[80vh] overflow-y-auto">
      {/* User Name Header */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm font-bold text-gray-900 dark:text-white truncate font-heading">
          {displayName}
        </p>
      </div>

      {/* Menu Items */}
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center gap-3 ${DROPDOWN_ITEM_PAD} text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Divider */}
      <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

      {/* Sign Out */}
      <button
        type="button"
        onClick={onSignOut}
        className={`w-full flex items-center gap-3 ${DROPDOWN_ITEM_PAD} text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset`}
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

export default UserMenuDropdown;
