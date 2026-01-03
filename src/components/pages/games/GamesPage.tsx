import React, { useState } from "react";
import { Play, Check, List } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalGameLibrary from "./PersonalGameLibrary";
import { useGameLibrary } from "../../../hooks/useGameLibraryQueries";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { TabPanel } from "@/components/shared";
import PersonalMediaLists from "../../media/PersonalMediaLists";
import MediaListDetail from "../../media/MediaListDetail";

type TabId = "playing" | "played" | "lists" | "list-detail";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Games",
  description: "Track your game library and discover new titles",
  noIndex: true,
};

/**
 * Games Page
 *
 * Two tabs: Queue, Completed (plus Lists)
 * Uses unified AppLayout for consistent spacing and footer
 */
const GamesPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  const [activeTab, setActiveTab] = useState<TabId>("playing");
  const [activeList, setActiveList] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Fetch data for badge counts
  const { data: gameLibrary = [] } = useGameLibrary();
  const tabs = [
    {
      id: "playing" as TabId,
      label: "Queue",
      icon: Play,
      badge: gameLibrary.filter((item) => !item.played).length,
    },
    {
      id: "played" as TabId,
      label: "Completed",
      icon: Check,
      badge: gameLibrary.filter((item) => item.played).length,
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
      title="Games"
      description="Track games you're playing and discover new ones"
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
        {activeTab === "playing" && (
          <PersonalGameLibrary initialFilter="to-play" />
        )}
        {activeTab === "played" && (
          <PersonalGameLibrary initialFilter="played" />
        )}
        {activeTab === "lists" && (
          <PersonalMediaLists
            domain="games"
            onOpenList={(list) => {
              setActiveList(list);
              setActiveTab("list-detail");
            }}
          />
        )}
        {activeTab === "list-detail" && activeList && (
          <MediaListDetail domain="games" listId={activeList.id} />
        )}
      </TabPanel>
    </AppLayout>
  );
};

export default GamesPage;
