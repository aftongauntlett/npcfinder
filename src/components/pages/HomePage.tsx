import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import AppLayout from "../layouts/AppLayout";
import { DashboardContent } from "../dashboard/DashboardContent";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { useTheme } from "../../hooks/useTheme";
import { TrendingUpDown, Clock, Lightbulb } from "lucide-react";
import { useMarkMovieRecommendationsAsOpened } from "../../hooks/useMovieQueries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";

interface HomePageProps {
  user: User;
}

type TabId = "recent" | "recommendations" | "trending";

/**
 * Dashboard / Home Page
 *
 * Personal greeting, stats, and activity feeds
 * Uses unified AppLayout for consistent spacing and footer
 */
const HomePage: React.FC<HomePageProps> = () => {
  const { changeThemeColor } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("recent");
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    return localStorage.getItem("hideGettingStarted") !== "true";
  });

  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfileQuery();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const markAsOpened = useMarkMovieRecommendationsAsOpened();

  // Handle tab change
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    if (
      tabId === "recommendations" &&
      stats &&
      stats.pendingRecommendations > 0
    ) {
      markAsOpened.mutate();
    }
  };

  // Refetch recommendations when tab becomes active
  useEffect(() => {
    if (activeTab === "recommendations") {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
    }
  }, [activeTab, queryClient]);

  // Apply theme color
  const themeColorApplied = React.useRef(false);
  React.useEffect(() => {
    if (profile?.theme_color && !themeColorApplied.current) {
      changeThemeColor(profile.theme_color);
      themeColorApplied.current = true;
    }
  }, [profile?.theme_color, changeThemeColor]);

  const displayName = profile?.display_name || "there";
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const tabs = [
    {
      id: "recent" as TabId,
      label: "Recent Activity",
      icon: Clock,
    },
    {
      id: "trending" as TabId,
      label: "Trending",
      icon: TrendingUpDown,
    },
    {
      id: "recommendations" as TabId,
      label: "Recommendations",
      icon: Lightbulb,
      badge: stats?.pendingRecommendations || 0,
    },
  ];

  if (isLoading) {
    return (
      <AppLayout title="Loading..." description="Preparing your dashboard">
        <div className="text-center text-gray-600 dark:text-gray-400 py-12">
          Loading your dashboard...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`${greeting}, ${displayName}`}
      description="Your personal dashboard for everything that matters"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => handleTabChange(tabId as TabId)}
    >
      <DashboardContent
        showFriendSearch={showFriendSearch}
        setShowFriendSearch={setShowFriendSearch}
        activeTab={activeTab}
        handleTabChange={(tabId) => handleTabChange(tabId as TabId)}
        stats={stats}
        statsLoading={statsLoading}
        showGettingStarted={showGettingStarted}
        setShowGettingStarted={setShowGettingStarted}
      />
    </AppLayout>
  );
};

export default HomePage;
