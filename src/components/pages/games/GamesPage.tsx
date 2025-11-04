import React, { useState } from "react";
import { Lightbulb, Play, Check } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalGameLibrary from "./PersonalGameLibrary";
import GamesSuggestions from "./GamesSuggestions";
import { useGameLibrary } from "../../../hooks/useGameLibraryQueries";
import { useGameStats } from "../../../hooks/useGameQueries";

type TabId = "playing" | "played" | "recommendations";

/**
 * Games Page
 *
 * Three tabs: Playing, Played, Recommendations
 * Uses unified AppLayout for consistent spacing and footer
 */
const GamesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("playing");

  // Fetch data for badge counts
  const { data: gameLibrary = [] } = useGameLibrary();
  const { data: quickStats } = useGameStats();

  const tabs = [
    {
      id: "playing" as TabId,
      label: "Playing",
      icon: Play,
      badge: gameLibrary.filter((item) => !item.played).length,
    },
    {
      id: "played" as TabId,
      label: "Played",
      icon: Check,
      badge: gameLibrary.filter((item) => item.played).length,
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
      title="Games"
      description="Track games you're playing and discover recommendations from friends"
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
        {activeTab === "playing" && (
          <PersonalGameLibrary initialFilter="to-play" />
        )}
        {activeTab === "played" && (
          <PersonalGameLibrary initialFilter="played" />
        )}
        {activeTab === "recommendations" && <GamesSuggestions embedded />}
      </div>
    </AppLayout>
  );
};

export default GamesPage;
