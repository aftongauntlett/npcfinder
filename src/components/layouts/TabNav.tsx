import React from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Reusable tab navigation component
 * Supports icons and theme-consistent styling
 */
const TabNav: React.FC<TabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}) => {
  return (
    <div
      className={`border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent"
            }`}
            style={
              activeTab === tab.id
                ? { borderColor: "var(--color-primary)" }
                : undefined
            }
          >
            {tab.icon && (
              <span className="inline-block w-4 h-4 mr-2 align-text-bottom">
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNav;
