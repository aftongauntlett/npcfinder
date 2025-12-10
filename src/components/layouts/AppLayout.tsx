import React from "react";
import { Menu } from "lucide-react";
import MainLayout from "./MainLayout";
import { Footer, Tabs } from "@/components/shared";
import type { Tab } from "@/components/shared";
import { useSidebar } from "@/contexts/SidebarContext";

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
  const { toggleSidebar } = useSidebar();

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
            {tabs && tabs.length > 0 && onTabChange && (
              <Tabs
                tabs={tabs}
                activeTabId={activeTab}
                onTabChange={onTabChange}
                onTabClose={onTabClose}
                ariaLabel={`${title} sections`}
              />
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
