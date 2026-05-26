import React from "react";
import MainLayout from "./MainLayout";
import { Footer, Tabs } from "@/components/shared";
import type { Tab } from "@/components/shared";

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
            {/* Page title and description */}
            <div className="mb-6">
              <div className="mb-2">
                <h1 className="flex-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-heading">
                  {title}
                </h1>
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
        <div className="pt-4 sm:pt-6 pb-8 flex-1 flex flex-col" role="main">
          {children}
        </div>

        {/* Footer - Always Present */}
        <Footer />
      </main>
    </MainLayout>
  );
};

export default AppLayout;
