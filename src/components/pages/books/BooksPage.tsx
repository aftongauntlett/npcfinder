import React, { useState } from "react";
import { Lightbulb, BookOpen, Check } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import ContentLayout from "../../layouts/ContentLayout";
import PersonalReadingList from "./PersonalReadingList";
import BooksSuggestions from "./BooksSuggestions";
import { useReadingList } from "../../../hooks/useReadingListQueries";
import { useBookStats } from "../../../hooks/useBookQueries";

type TabId = "reading" | "read" | "recommendations";

/**
 * Consolidated Books Page
 *
 * Three main tabs:
 * - Reading: Books currently reading (not finished)
 * - Read: Complete archive of read books
 * - Recommendations: Friend suggestions and your sent items
 *
 * Features:
 * - Tabbed navigation (no nested routes)
 * - Badge counts on tabs
 * - Mobile-optimized layout
 * - Keyboard accessible
 * - Reusable pattern from Movies/TV
 */
const BooksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("reading");

  // Fetch data for badge counts
  const { data: readingList = [] } = useReadingList();
  const { data: quickStats } = useBookStats();

  // Calculate counts
  const readingCount = readingList.filter((item) => !item.read).length;
  const readCount = readingList.filter((item) => item.read).length;
  const recsCount = quickStats?.queue || 0;

  const tabs = [
    {
      id: "reading" as TabId,
      label: "Reading",
      icon: BookOpen,
      count: readingCount,
    },
    {
      id: "read" as TabId,
      label: "Read",
      icon: Check,
      count: readCount,
    },
    {
      id: "recommendations" as TabId,
      label: "Recommendations",
      icon: Lightbulb,
      count: recsCount,
    },
  ];

  return (
    <MainLayout>
      <ContentLayout
        title="Books"
        description="Track what you're reading and discover new books from friends"
      >
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav
            className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide -mb-px"
            role="tablist"
            aria-label="Books sections"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-medium whitespace-nowrap transition-colors border-b-2 focus:outline-none ${
                    isActive
                      ? "text-primary dark:text-primary-light border-b-primary dark:border-b-primary-light"
                      : "text-gray-600 dark:text-gray-400 border-b-transparent hover:text-gray-900 dark:hover:text-white hover:border-b-gray-300 dark:hover:border-b-gray-600"
                  }`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${tab.id}-panel`}
                  tabIndex={isActive ? 0 : -1}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isActive
                          ? "bg-primary/20 text-primary dark:text-primary-light"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                      aria-label={`${tab.count} items`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Panels */}
        <div
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={activeTab}
        >
          {activeTab === "reading" && (
            <PersonalReadingList initialFilter="to-read" />
          )}
          {activeTab === "read" && <PersonalReadingList initialFilter="read" />}
          {activeTab === "recommendations" && <BooksSuggestions embedded />}
        </div>
      </ContentLayout>
    </MainLayout>
  );
};

export default BooksPage;
