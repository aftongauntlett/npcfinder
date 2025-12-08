import React, { useState } from "react";
import { Lightbulb, BookOpen, Check } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalReadingList from "./PersonalReadingList";
import BooksSuggestions from "./BooksSuggestions";
import { useReadingList } from "../../../hooks/useReadingListQueries";
import { useBookStats } from "../../../hooks/useBookQueries";
import { usePageMeta } from "../../../hooks/usePageMeta";

type TabId = "reading" | "read" | "recommendations";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Books",
  description: "Track your reading list and discover new books",
  noIndex: true,
};

/**
 * Books Page
 *
 * Three tabs: Reading, Read, Recommendations
 * Uses unified AppLayout for consistent spacing and footer
 */
const BooksPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

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
      badge: readingCount,
    },
    {
      id: "read" as TabId,
      label: "Read",
      icon: Check,
      badge: readCount,
    },
    {
      id: "recommendations" as TabId,
      label: "Recommendations",
      icon: Lightbulb,
      badge: recsCount,
    },
  ];

  return (
    <AppLayout
      title="Books"
      description="Track what you're reading and discover new books from friends"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as TabId)}
    >
      {/* Tab Content */}
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
    </AppLayout>
  );
};

export default BooksPage;
