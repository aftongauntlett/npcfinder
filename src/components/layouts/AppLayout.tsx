import React, { useEffect, useRef, useState } from "react";
import { X, Menu, Check } from "lucide-react";
import { motion } from "framer-motion";
import MainLayout from "./MainLayout";
import { Footer } from "@/components/shared";
import { useSidebar } from "@/contexts/SidebarContext";

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
  const { toggleSidebar } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <MainLayout>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen flex flex-col focus:outline-none"
      >
        {/* Page Header */}
        <header>
          <div className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
            {/* Mobile menu button and Title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="flex-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-heading">
                  {title}
                </h1>

                {/* Mobile hamburger menu */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="md:hidden p-2 mr-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
              {description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>

            {/* Tabs Navigation */}
            {tabs && tabs.length > 0 && (
              <>
                {/* Mobile Tab Dropdown - Matches FilterSortMenu style */}
                <div ref={mobileMenuRef} className="sm:hidden mb-6 relative">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isMobileMenuOpen
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    aria-label="Select tab"
                    aria-expanded={isMobileMenuOpen}
                  >
                    <span>
                      {tabs.find((t) => t.id === activeTab)?.label ||
                        tabs[0]?.label}
                      {(() => {
                        const tab =
                          tabs.find((t) => t.id === activeTab) || tabs[0];
                        return tab?.badge !== undefined && tab.badge > 0
                          ? ` (${tab.badge})`
                          : "";
                      })()}
                    </span>
                    <Check
                      className={`w-5 h-5 transition-opacity ${
                        isMobileMenuOpen ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isMobileMenuOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[400px] overflow-y-auto">
                      {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              onTabChange?.(tab.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            <span>
                              {tab.label}
                              {tab.badge !== undefined && tab.badge > 0
                                ? ` (${tab.badge})`
                                : ""}
                            </span>
                            {isActive && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Desktop Tabs */}
                <nav
                  className="hidden sm:flex gap-0 border-b border-gray-200 dark:border-gray-700 -mb-px overflow-x-auto"
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
                          id={tab.id}
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
                              className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
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
              </>
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
