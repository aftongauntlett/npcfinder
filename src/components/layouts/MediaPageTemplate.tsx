import React from "react";
import TabNav, { Tab } from "./TabNav";
import Button from "../shared/Button";

export interface PrimaryAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "outline";
}

interface MediaPageTemplateProps {
  // Page identity
  pageTitle: string;
  pageDescription?: string;

  // Tabs (optional)
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  // Content
  children: React.ReactNode;

  // Actions (optional)
  primaryAction?: PrimaryAction;
}

/**
 * Reusable template for media pages (Movies, Music, Books, Games)
 * Provides consistent layout with header, optional tabs, and actions
 *
 * Usage:
 * ```tsx
 * <MediaPageTemplate
 *   pageTitle="Movies & TV"
 *   pageDescription="Discover, track and recommend movies & tv shows."
 *   tabs={[
 *     { id: 'watchlist', label: 'Watch List', icon: <ListVideo /> },
 *     { id: 'suggestions', label: 'Suggestions', icon: <Lightbulb /> }
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   primaryAction={{
 *     label: 'Send Recommendation',
 *     icon: <Send />,
 *     onClick: () => setShowModal(true)
 *   }}
 * >
 *   {activeTab === 'watchlist' ? <WatchList /> : <Suggestions />}
 * </MediaPageTemplate>
 * ```
 */
const MediaPageTemplate: React.FC<MediaPageTemplateProps> = ({
  pageTitle,
  pageDescription,
  tabs,
  activeTab,
  onTabChange,
  children,
  primaryAction,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {pageTitle}
            </h1>
            {pageDescription && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {pageDescription}
              </p>
            )}
          </div>

          {/* Primary Action Button */}
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant || "primary"}
              icon={primaryAction.icon}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && activeTab && onTabChange && (
          <TabNav
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            className="mb-8"
          />
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default MediaPageTemplate;
