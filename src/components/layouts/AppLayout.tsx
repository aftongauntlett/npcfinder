import React from "react";
import MainLayout from "./MainLayout";
import { Footer } from "@/components/shared";

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
  panelId?: string; // Optional explicit panel ID for aria-controls
}

interface AppLayoutProps {
  title: string;
  description?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
}

/**
 * AppLayout - Unified layout for all authenticated pages
 *
 * Provides consistent structure:
 * - Page header (title + description)
 * - Optional tabs navigation
 * - Content area
 * - Footer (always present)
 *
 * Ensures spacing consistency across all pages per copilot guidelines.
 */
const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  // Handle keyboard navigation for tabs (left/right arrow keys)
  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    if (!tabs || tabs.length === 0) return;

    let newIndex = currentIndex;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    } else {
      return;
    }

    // Focus the new tab and trigger change
    const newTab = tabs[newIndex];
    onTabChange?.(newTab.id);

    // Focus will be handled by React re-render with updated tabIndex
  };

  return (
    <MainLayout>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen flex flex-col focus:outline-none"
      >
        {/* Page Header */}
        <header>
          <div className="container mx-auto px-6 pt-12">
            {/* Title and Description */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
                {title}
              </h1>
              {description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>

            {/* Tabs Navigation */}
            {tabs && tabs.length > 0 && (
              <nav
                className="flex gap-4 border-b border-gray-200 dark:border-gray-700 -mb-px overflow-x-auto"
                role="tablist"
                aria-label={`${title} sections`}
              >
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  // Default to first tab if no activeTab provided
                  const isFirstAndNoActive = !activeTab && index === 0;
                  const shouldBeFocusable = isActive || isFirstAndNoActive;
                  // Use explicit panelId if provided, otherwise default to ${tab.id}-panel
                  const panelId = tab.panelId || `${tab.id}-panel`;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange?.(tab.id)}
                      onKeyDown={(e) => handleTabKeyDown(e, index)}
                      className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                        isActive
                          ? "text-primary dark:text-primary-light border-primary dark:border-primary-light"
                          : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      role="tab"
                      aria-selected={isActive || isFirstAndNoActive}
                      aria-controls={panelId}
                      tabIndex={shouldBeFocusable ? 0 : -1}
                    >
                      {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span
                          className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary dark:bg-primary-light/20 dark:text-primary-light"
                          aria-label={`${tab.badge} items`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div
          className="container mx-auto px-6 pt-6 pb-8 flex-1 flex flex-col"
          role="main"
        >
          {children}
        </div>

        {/* Footer - Always Present */}
        <Footer />
      </main>
    </MainLayout>
  );
};

export default AppLayout;
