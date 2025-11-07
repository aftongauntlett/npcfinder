import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import AppLayout from "../layouts/AppLayout";
import { DashboardContent } from "../dashboard/DashboardContent";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { useTheme } from "../../hooks/useTheme";
import {
  TrendingUpDown,
  Clock,
  Lightbulb,
  Film,
  Music,
  BookOpen,
  Gamepad2,
  UserPlus,
  Sparkles,
} from "lucide-react";
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
  const navigate = useNavigate();
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
      {/* Compact Navigation Grid - All equal size 1x1 */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Movies & TV */}
          <motion.button
            onClick={() => void navigate("/app/movies")}
            className="group relative p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 text-left overflow-hidden"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex flex-col gap-2">
              <motion.div
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 w-fit group-hover:bg-blue-500/10 transition-colors duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Film className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors duration-300" />
              </motion.div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-500 transition-colors duration-300">
                  Movies & TV
                </div>
                <motion.div
                  className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                >
                  {stats?.moviesAndTvCount || 0} items
                </motion.div>
              </div>
            </div>
          </motion.button>

          {/* Music */}
          <motion.button
            onClick={() => void navigate("/app/music")}
            className="group relative p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 text-left overflow-hidden"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex flex-col gap-2">
              <motion.div
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 w-fit group-hover:bg-emerald-500/10 transition-colors duration-300"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Music className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-emerald-500 transition-colors duration-300" />
              </motion.div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-emerald-500 transition-colors duration-300">
                  Music
                </div>
                <motion.div
                  className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                >
                  Library
                </motion.div>
              </div>
            </div>
          </motion.button>

          {/* Books */}
          <motion.button
            onClick={() => void navigate("/app/books")}
            className="group relative p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 text-left overflow-hidden"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex flex-col gap-2">
              <motion.div
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 w-fit group-hover:bg-amber-500/10 transition-colors duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <BookOpen className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-amber-500 transition-colors duration-300" />
              </motion.div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-amber-500 transition-colors duration-300">
                  Books
                </div>
                <motion.div
                  className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                >
                  {stats?.booksCount || 0} books
                </motion.div>
              </div>
            </div>
          </motion.button>

          {/* Games */}
          <motion.button
            onClick={() => void navigate("/app/games")}
            className="group relative p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 text-left overflow-hidden"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex flex-col gap-2">
              <motion.div
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 w-fit group-hover:bg-purple-500/10 transition-colors duration-300"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Gamepad2 className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-purple-500 transition-colors duration-300" />
              </motion.div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-purple-500 transition-colors duration-300">
                  Games
                </div>
                <motion.div
                  className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                >
                  Backlog
                </motion.div>
              </div>
            </div>
          </motion.button>

          {/* Find Friends */}
          <motion.button
            onClick={() => setShowFriendSearch(true)}
            className="group relative p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 text-left overflow-hidden"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex flex-col gap-2">
              <motion.div
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 w-fit group-hover:bg-pink-500/10 transition-colors duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <UserPlus className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-pink-500 transition-colors duration-300" />
              </motion.div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-pink-500 transition-colors duration-300">
                  Find Friends
                </div>
                <motion.div
                  className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                >
                  {stats?.friendsCount || 0} friends
                </motion.div>
              </div>
            </div>
          </motion.button>

          {/* Suggestions */}
          <motion.button
            onClick={() => void navigate("/app/suggestions")}
            className="group relative p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 text-left overflow-hidden"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex flex-col gap-2">
              <motion.div
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 w-fit group-hover:bg-violet-500/10 transition-colors duration-300"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Sparkles className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-violet-500 transition-colors duration-300" />
              </motion.div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-violet-500 transition-colors duration-300">
                  Suggestions
                </div>
                <motion.div
                  className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                >
                  Vote
                </motion.div>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Main Content - Activity/Trending/Recommendations */}
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
