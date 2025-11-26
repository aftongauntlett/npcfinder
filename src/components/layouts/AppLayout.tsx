import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import MainLayout from "./MainLayout";
import { Footer } from "@/components/shared";

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
  panelId?: string; // Optional explicit panel ID for aria-controls
  closeable?: boolean; // Can this tab be closed?
}

interface AppLayoutProps {
  title: string;
  description?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
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
  onTabClose,
  children,
}) => {
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const prevActiveTabRef = useRef<string | undefined>(activeTab);

  // Scroll active tab into view and flash when it changes (especially for board tabs)
  useEffect(() => {
    if (activeTab && activeTab !== prevActiveTabRef.current) {
      prevActiveTabRef.current = activeTab;

      // Scroll to active tab
      if (activeTabRef.current) {
        activeTabRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTab]);

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
                    <div key={tab.id} className="flex items-center">
                      <motion.button
                        ref={isActive ? activeTabRef : null}
                        type="button"
                        onClick={() => onTabChange?.(tab.id)}
                        onKeyDown={(e) => handleTabKeyDown(e, index)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                          isActive
                            ? "text-primary dark:text-primary-light border-primary dark:border-primary-light"
                            : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                        } ${tab.closeable ? "pr-2" : ""}`}
                        role="tab"
                        aria-selected={isActive || isFirstAndNoActive}
                        aria-controls={panelId}
                        tabIndex={shouldBeFocusable ? 0 : -1}
                        animate={{
                          backgroundColor: isActive
                            ? [
                                "rgba(0, 0, 0, 0)",
                                "var(--color-primary-pale)",
                                "rgba(0, 0, 0, 0)",
                              ]
                            : "rgba(0, 0, 0, 0)",
                        }}
                        transition={{
                          backgroundColor: {
                            duration: 0.6,
                            times: [0, 0.5, 1],
                            ease: "easeInOut",
                          },
                        }}
                      >
                        {Icon && (
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        )}
                        <span>{tab.label}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <span
                            className="flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                            aria-label={`${tab.badge} items`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </motion.button>
                      {tab.closeable && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTabClose?.(tab.id);
                          }}
                          className={`ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                            isActive
                              ? "text-primary dark:text-primary-light"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                          aria-label={`Close ${tab.label}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </nav>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="pt-6 pb-8 flex-1 flex flex-col" role="main">
          {children}
        </div>

        {/* Footer - Always Present */}
        <Footer />
      </main>
    </MainLayout>
  );
};

export default AppLayout;
