import React, { useState } from "react";
import { BookOpen, Check, List } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalReadingList from "./PersonalReadingList";
import { useReadingList } from "../../../hooks/useReadingListQueries";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { TabPanel } from "@/components/shared";
import PersonalMediaLists from "../../media/PersonalMediaLists";
import MediaListDetail from "../../media/MediaListDetail";

type TabId = "reading" | "read" | "lists" | "list-detail";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Books",
  description: "Track your reading list and discover new books",
  noIndex: true,
};

/**
 * Books Page
 *
 * Two tabs: Queue, Completed (plus Lists)
 * Uses unified AppLayout for consistent spacing and footer
 */
const BooksPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  const [activeTab, setActiveTab] = useState<TabId>("reading");
  const [activeList, setActiveList] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Fetch data for badge counts
  const { data: readingList = [] } = useReadingList();
  // Calculate counts
  const readingCount = readingList.filter((item) => !item.read).length;
  const readCount = readingList.filter((item) => item.read).length;

  const tabs = [
    {
      id: "reading" as TabId,
      label: "Queue",
      icon: BookOpen,
      badge: readingCount,
    },
    {
      id: "read" as TabId,
      label: "Completed",
      icon: Check,
      badge: readCount,
    },
    {
      id: "lists" as TabId,
      label: "Lists",
      icon: List,
    },
    ...(activeList
      ? [
          {
            id: "list-detail" as TabId,
            label: activeList.title,
            icon: List,
          },
        ]
      : []),
  ];

  return (
    <AppLayout
      title="Books"
      description="Track what you're reading and discover new books from friends"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => {
        const nextTab = tabId as TabId;
        setActiveTab(nextTab);
        if (nextTab !== "list-detail") {
          setActiveList(null);
        }
      }}
    >
      {/* Tab Content */}
      <TabPanel id={`${activeTab}-panel`} tabId={`${activeTab}-tab`}>
        {activeTab === "reading" && (
          <PersonalReadingList initialFilter="to-read" />
        )}
        {activeTab === "read" && <PersonalReadingList initialFilter="read" />}
        {activeTab === "lists" && (
          <PersonalMediaLists
            domain="books"
            onOpenList={(list) => {
              setActiveList(list);
              setActiveTab("list-detail");
            }}
          />
        )}
        {activeTab === "list-detail" && activeList && (
          <MediaListDetail domain="books" listId={activeList.id} />
        )}
      </TabPanel>
    </AppLayout>
  );
};

export default BooksPage;
