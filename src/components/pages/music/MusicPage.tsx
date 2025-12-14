import React, { useState } from "react";
import { Lightbulb, Headphones, Check, List } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalMusicLibrary from "./PersonalMusicLibrary";
import MusicSuggestions from "./MusicSuggestions";
import { useMusicLibraryStats } from "../../../hooks/useMusicLibraryQueries";
import { useMusicStats } from "../../../hooks/useMusicQueries";
import { usePageMeta } from "../../../hooks/usePageMeta";
import PersonalMediaLists from "../../media/PersonalMediaLists";
import MediaListDetail from "../../media/MediaListDetail";
import { TabPanel } from "@/components/shared";

type TabId = "listening" | "listened" | "recommendations" | "lists" | "list-detail";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Music",
  description: "Organize your music library and discover new albums",
  noIndex: true,
};

/**
 * Music Page
 *
 * Three tabs: Listening, Listened, Recommendations
 * Uses unified AppLayout for consistent spacing and footer
 */
const MusicPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  const [activeTab, setActiveTab] = useState<TabId>("listening");
  const [activeList, setActiveList] = useState<{ id: string; title: string } | null>(null);

  // Fetch data for badge counts
  const { data: libraryStats } = useMusicLibraryStats();
  const { data: quickStats } = useMusicStats();

  const tabs = [
    {
      id: "listening" as TabId,
      label: "Queue",
      icon: Headphones,
      badge: libraryStats?.listening || 0,
    },
    {
      id: "listened" as TabId,
      label: "Completed",
      icon: Check,
      badge: libraryStats?.listened || 0,
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
    {
      id: "recommendations" as TabId,
      label: "Recommendations",
      icon: Lightbulb,
      badge: quickStats?.queue || 0,
    },
  ];

  return (
    <AppLayout
      title="Music"
      description="Track what you're listening to and discover new music from friends"
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
        {activeTab === "listening" && (
          <PersonalMusicLibrary initialFilter="listening" />
        )}
        {activeTab === "listened" && (
          <PersonalMusicLibrary initialFilter="listened" />
        )}
        {activeTab === "recommendations" && <MusicSuggestions embedded />}
        {activeTab === "lists" && (
          <PersonalMediaLists
            domain="music"
            onOpenList={(list) => {
              setActiveList(list);
              setActiveTab("list-detail");
            }}
          />
        )}
        {activeTab === "list-detail" && activeList && (
          <MediaListDetail domain="music" listId={activeList.id} />
        )}
      </TabPanel>
    </AppLayout>
  );
};

export default MusicPage;
