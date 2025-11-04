import React, { useState } from "react";
import { Lightbulb, Play, Check } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import MoviesSuggestions from "./MoviesSuggestions";
import { useWatchlist } from "../../../hooks/useWatchlistQueries";
import { useMovieStats } from "../../../hooks/useMovieQueries";
import PersonalWatchList from "../../media/PersonalWatchList";

type TabId = "watching" | "watched" | "recommendations";

/**
 * Movies & TV Page
 *
 * Three tabs: Watching, Watched, Recommendations
 * Uses unified AppLayout for consistent spacing and footer
 */
const MoviesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("watching");

  // Fetch data for badge counts
  const { data: watchlist = [] } = useWatchlist();
  const { data: quickStats } = useMovieStats();

  const tabs = [
    {
      id: "watching" as TabId,
      label: "Watching",
      icon: Play,
      badge: watchlist.filter((item) => !item.watched).length,
    },
    {
      id: "watched" as TabId,
      label: "Watched",
      icon: Check,
      badge: watchlist.filter((item) => item.watched).length,
    },
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
      onTabChange={(tabId) => setActiveTab(tabId as TabId)}
    >
      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`${activeTab}-panel`}
        aria-labelledby={activeTab}
      >
        {activeTab === "watching" && (
          <PersonalWatchList initialFilter="to-watch" />
        )}
        {activeTab === "watched" && (
          <PersonalWatchList initialFilter="watched" />
        )}
        {activeTab === "recommendations" && <MoviesSuggestions embedded />}
      </div>
    </AppLayout>
  );
};

export default MoviesPage;
