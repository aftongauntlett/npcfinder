import React, { useState } from "react";
import { Lightbulb, Play, Check, List } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import MoviesSuggestions from "./MoviesSuggestions";
import { useWatchlist } from "../../../hooks/useWatchlistQueries";
import { useMovieStats } from "../../../hooks/useMovieQueries";
import PersonalWatchList from "../../media/PersonalWatchList";
import PersonalMediaLists from "../../media/PersonalMediaLists";
import MediaListDetail from "../../media/MediaListDetail";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { TabPanel } from "@/components/shared";

type TabId = "watching" | "watched" | "recommendations" | "lists" | "list-detail";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Movies & TV",
  description:
    "Track what you're watching and discover new content from friends",
  noIndex: true,
};

/**
 * Movies & TV Page
 *
 * Three tabs: Watching, Watched, Recommendations
 * Uses unified AppLayout for consistent spacing and footer
 */
const MoviesPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  const [activeTab, setActiveTab] = useState<TabId>("watching");
  const [activeList, setActiveList] = useState<{ id: string; title: string } | null>(null);

  // Fetch data for badge counts
  const { data: watchlist = [] } = useWatchlist();
  const { data: quickStats } = useMovieStats();

  const tabs = [
    {
      id: "watching" as TabId,
      label: "Queue",
      icon: Play,
      badge: watchlist.filter((item) => !item.watched).length,
    },
    {
      id: "watched" as TabId,
      label: "Completed",
      icon: Check,
      badge: watchlist.filter((item) => item.watched).length,
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
      title="Movies & TV"
      description="Track what you're watching and discover new content from friends"
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
        <h2 className="sr-only">
          {activeTab === "watching" && "Queue"}
          {activeTab === "watched" && "Completed"}
          {activeTab === "recommendations" && "Recommendations"}
          {activeTab === "lists" && "Lists"}
          {activeTab === "list-detail" && (activeList?.title || "List")}
        </h2>
        {activeTab === "watching" && (
          <PersonalWatchList initialFilter="to-watch" />
        )}
        {activeTab === "watched" && (
          <PersonalWatchList initialFilter="watched" />
        )}
        {activeTab === "recommendations" && <MoviesSuggestions embedded />}
        {activeTab === "lists" && (
          <PersonalMediaLists
            domain="movies-tv"
            onOpenList={(list) => {
              setActiveList(list);
              setActiveTab("list-detail");
            }}
          />
        )}
        {activeTab === "list-detail" && activeList && (
          <MediaListDetail domain="movies-tv" listId={activeList.id} />
        )}
      </TabPanel>
    </AppLayout>
  );
};

export default MoviesPage;
