import React, { useState, useEffect } from "react";
import { Button, Footer } from "@/components/shared";
import { debounce } from "@/utils/debounce";

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
  children: React.ReactNode;
}

/**
 * ContentLayout - Reusable layout for content pages
 * Provides consistent header with title, description, and tabs
 */
const ContentLayout: React.FC<ContentLayoutProps> = ({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for header background with debouncing
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 0);
      });
    };

    const debouncedHandleScroll = debounce(handleScroll, 150);

    window.addEventListener("scroll", debouncedHandleScroll);
    return () => window.removeEventListener("scroll", debouncedHandleScroll);
  }, []);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen focus:outline-none flex flex-col"
    >
      {/* Page Header */}
      <header
        className={`z-30 transition-colors duration-200 ${
          isScrolled ? "bg-background/80 backdrop-blur-sm" : ""
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
          {/* Title and Description */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 font-heading">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>

          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <nav
              className="flex gap-0 border-b border-gray-200 dark:border-gray-700 -mb-px overflow-x-auto"
              role="tablist"
              aria-label={`${title} sections`}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <Button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    variant={isActive ? "primary" : "subtle"}
                    icon={
                      Icon ? (
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      ) : undefined
                    }
                    className={`px-4 py-3 font-medium border-b-2 rounded-none ${
                      isActive
                        ? "border-primary dark:border-primary-light"
                        : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${tab.id}-panel`}
                    tabIndex={isActive ? 0 : -1}
                  >
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Page Content */}
      <div className="flex-1 container mx-auto px-4 sm:px-6 pb-8" role="main">
        {children}
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default ContentLayout;
