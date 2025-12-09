import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import AppLayout from "../layouts/AppLayout";
import { DashboardContent } from "../dashboard/DashboardContent";
import { SkeletonCard } from "@/components/shared";
import { StatCard } from "../dashboard/StatCard";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { useTheme } from "../../hooks/useTheme";
import { STATUS_MAP } from "../../utils/mediaStatus";
import {
  TrendingUpDown,
  Clock,
  Lightbulb,
  Film,
  Music,
  BookOpen,
  Gamepad2,
  UserPlus,
} from "lucide-react";
import { useMarkMovieRecommendationsAsOpened } from "../../hooks/useMovieQueries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { usePageMeta } from "../../hooks/usePageMeta";

interface HomePageProps {
  user: User;
}

type TabId = "dashboard" | "friends" | "trending" | "recommendations";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Dashboard",
  description: "Your personal dashboard for everything that matters",
  noIndex: true,
};

/**
 * Dashboard / Home Page
 *
 * Personal greeting, stats, and activity feeds
 * Uses unified AppLayout for consistent spacing and footer
 */
const HomePage: React.FC<HomePageProps> = () => {
  usePageMeta(pageMetaOptions);

  const { changeThemeColor } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
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
      id: "dashboard" as TabId,
      label: "Dashboard",
      icon: Clock,
    },
    {
      id: "friends" as TabId,
      label: "Find Friends",
      icon: UserPlus,
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
      {/* Stats Grid - Only on Dashboard Tab */}
      {activeTab === "dashboard" &&
        (statsLoading ? (
          <div className="container mx-auto px-4 sm:px-6 mb-4 sm:mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SkeletonCard variant="stat" />
              <SkeletonCard variant="stat" />
              <SkeletonCard variant="stat" />
              <SkeletonCard variant="stat" />
            </div>
          </div>
        ) : stats ? (
          <div className="container mx-auto px-4 sm:px-6 mb-4 sm:mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                title="Movies"
                count={stats?.moviesWatched || 0}
                hoverCount={stats?.moviesToWatch || 0}
                icon={Film}
                accentColor="blue"
                label={STATUS_MAP["watched"].label}
                hoverLabel={STATUS_MAP["to-watch"].label}
              />
              <StatCard
                title="Music"
                count={stats?.musicCount || 0}
                hoverCount={0}
                icon={Music}
                accentColor="emerald"
                label={STATUS_MAP["to-listen"].label}
                hoverLabel={STATUS_MAP["to-listen"].label}
              />
              <StatCard
                title="Books"
                count={stats?.booksRead || 0}
                hoverCount={stats?.booksReading || 0}
                icon={BookOpen}
                accentColor="amber"
                label={STATUS_MAP["read"].label}
                hoverLabel={STATUS_MAP["to-read"].label}
              />
              <StatCard
                title="Games"
                count={stats?.gamesPlayed || 0}
                hoverCount={stats?.gamesToPlay || 0}
                icon={Gamepad2}
                accentColor="purple"
                label={STATUS_MAP["played"].label}
                hoverLabel={STATUS_MAP["to-play"].label}
              />
            </div>
          </div>
        ) : null)}

      {/* Main Content - Activity/Trending/Find Friends */}
      <DashboardContent
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
