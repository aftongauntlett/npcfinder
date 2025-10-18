import React from "react";
import WeatherWidget from "../shared/WeatherWidget";

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
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * ContentLayout - Reusable layout for content pages
 * Provides consistent header with title, description, tabs, and action buttons
 * Used by: Movies, Music, Books, Games, Admin, etc.
 */
const ContentLayout: React.FC<ContentLayoutProps> = ({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  actions,
  children,
}) => {
  return (
    <main className="min-h-screen">
      {/* Page Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4">
          {/* Top row: Title and Weather */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h1>
              {description && (
                <p className="text-gray-600 dark:text-gray-300">
                  {description}
                </p>
              )}
            </div>

            {/* Weather Widget - Top Right */}
            <div className="flex-shrink-0">
              <WeatherWidget />
            </div>
          </div>

          {/* Action Buttons */}
          {actions && (
            <div className="flex items-center gap-2 mb-4">{actions}</div>
          )}

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
