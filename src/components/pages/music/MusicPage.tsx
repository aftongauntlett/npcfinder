import React, { useState } from "react";
import { Lightbulb, Headphones, Check } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalMusicLibrary from "./PersonalMusicLibrary";
import MusicSuggestions from "./MusicSuggestions";
import { useMusicLibraryStats } from "../../../hooks/useMusicLibraryQueries";
import { useMusicStats } from "../../../hooks/useMusicQueries";

type TabId = "listening" | "listened" | "recommendations";

/**
 * Music Page
 *
 * Three tabs: Listening, Listened, Recommendations
 * Uses unified AppLayout for consistent spacing and footer
 */
const MusicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("listening");

  // Fetch data for badge counts
  const { data: libraryStats } = useMusicLibraryStats();
  const { data: quickStats } = useMusicStats();

  const tabs = [
    {
      id: "listening" as TabId,
      label: "Listening",
      icon: Headphones,
      badge: libraryStats?.listening || 0,
    },
    {
      id: "listened" as TabId,
      label: "Listened",
      icon: Check,
      badge: libraryStats?.listened || 0,
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
      title="Music"
      description="Track what you're listening to and discover new music from friends"
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
        {activeTab === "listening" && (
          <PersonalMusicLibrary initialFilter="listening" />
        )}
        {activeTab === "listened" && (
          <PersonalMusicLibrary initialFilter="listened" />
        )}
        {activeTab === "recommendations" && <MusicSuggestions embedded />}
      </div>
    </AppLayout>
  );
};

export default MusicPage;
