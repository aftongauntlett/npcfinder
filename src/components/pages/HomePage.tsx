import React, { useState } from "react";
import type { User } from "@supabase/supabase-js";
import DashboardHeader from "../dashboard/DashboardHeader";
import Footer from "../shared/Footer";
import MainLayout from "../layouts/MainLayout";
import SimpleLayout from "../layouts/SimpleLayout";
import { useProfileQuery } from "../../hooks/useProfileQuery";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { useTheme } from "../../hooks/useTheme";
import { UserPlus, TrendingUpDown, Clock, Lightbulb, X } from "lucide-react";
import { DashboardRecommendations } from "../dashboard/DashboardRecommendations";
import { useMarkMovieRecommendationsAsOpened } from "../../hooks/useMovieQueries";
import { FriendSearchModal } from "../shared/FriendSearchModal";

interface HomePageProps {
  user: User;
}

type TabId = "recent" | "recommendations" | "trending";

const HomePage: React.FC<HomePageProps> = () => {
  const { changeThemeColor } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>("recent");
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    return localStorage.getItem("hideGettingStarted") !== "true";
  });

  // Fetch user profile with TanStack Query (automatic caching, shared with Navigation)
  const { data: profile, isLoading } = useProfileQuery();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  // Mutation to mark recommendations as opened
  const markAsOpened = useMarkMovieRecommendationsAsOpened();

  // Handle tab change - mark recommendations as opened when tab is clicked
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);

    // Mark all pending recommendations as opened when Recommendations tab is clicked
    if (
      tabId === "recommendations" &&
      stats &&
      stats.pendingRecommendations > 0
    ) {
      markAsOpened.mutate();
    }
  };

  // Apply theme color when profile loads
  const themeColorApplied = React.useRef(false);
  React.useEffect(() => {
    if (profile?.theme_color && !themeColorApplied.current) {
      changeThemeColor(profile.theme_color);
      themeColorApplied.current = true;
    }
  }, [profile?.theme_color, changeThemeColor]);

  const displayName = profile?.display_name || null;

  if (isLoading) {
    return (
      <MainLayout>
        <SimpleLayout>
          <div className="text-center text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </div>
        </SimpleLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SimpleLayout>
        <div className="flex-1">
          {/* Greeting Header */}
          <DashboardHeader displayName={displayName || undefined} />

          {/* Quick Actions - Just Find Friends */}
          <div className="mb-8">
            <button
              onClick={() => setShowFriendSearch(true)}
              className="w-full bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-500/10 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                  <UserPlus className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white font-heading text-lg">
                    Find Friends
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Search for users and connect with friends
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Friend Search Modal */}
          <FriendSearchModal
            isOpen={showFriendSearch}
            onClose={() => setShowFriendSearch(false)}
          />

          {/* Stats Bar - Compact */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-8 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-heading">
                  {statsLoading ? "..." : stats?.moviesAndTvCount || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Movies & TV
                </p>
              </div>
              <div className="text-center opacity-50">
                <p className="text-2xl font-bold text-gray-400 dark:text-gray-600 font-heading">
                  —
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Music
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-heading">
                  {statsLoading ? "..." : stats?.booksCount || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Books
                </p>
              </div>
              <div className="text-center opacity-50">
                <p className="text-2xl font-bold text-gray-400 dark:text-gray-600 font-heading">
                  —
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Games
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-heading">
                  {statsLoading ? "..." : stats?.friendsCount || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Connections
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav
              className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide -mb-px"
              role="tablist"
              aria-label="Dashboard sections"
            >
              <button
                onClick={() => handleTabChange("recent")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-medium whitespace-nowrap transition-colors border-b-2 focus:outline-none ${
                  activeTab === "recent"
                    ? "text-primary dark:text-primary-light border-b-primary dark:border-b-primary-light"
                    : "text-gray-600 dark:text-gray-400 border-b-transparent hover:text-gray-900 dark:hover:text-white hover:border-b-gray-300 dark:hover:border-b-gray-600"
                }`}
                role="tab"
                aria-selected={activeTab === "recent"}
                aria-controls="recent-panel"
              >
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm sm:text-base">Recent Activity</span>
              </button>

              <button
                onClick={() => handleTabChange("trending")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-medium whitespace-nowrap transition-colors border-b-2 focus:outline-none ${
                  activeTab === "trending"
                    ? "text-primary dark:text-primary-light border-b-primary dark:border-b-primary-light"
                    : "text-gray-600 dark:text-gray-400 border-b-transparent hover:text-gray-900 dark:hover:text-white hover:border-b-gray-300 dark:hover:border-b-gray-600"
                }`}
                role="tab"
                aria-selected={activeTab === "trending"}
                aria-controls="trending-panel"
              >
                <TrendingUpDown className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm sm:text-base">Trending</span>
              </button>

              <button
                onClick={() => handleTabChange("recommendations")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-medium whitespace-nowrap transition-colors border-b-2 focus:outline-none ${
                  activeTab === "recommendations"
                    ? "text-primary dark:text-primary-light border-b-primary dark:border-b-primary-light"
                    : "text-gray-600 dark:text-gray-400 border-b-transparent hover:text-gray-900 dark:hover:text-white hover:border-b-gray-300 dark:hover:border-b-gray-600"
                }`}
                role="tab"
                aria-selected={activeTab === "recommendations"}
                aria-controls="recommendations-panel"
              >
                <Lightbulb className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm sm:text-base">Recommendations</span>
                {stats && stats.pendingRecommendations > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      activeTab === "recommendations"
                        ? "bg-primary/20 text-primary dark:text-primary-light"
                        : "bg-red-500 text-white"
                    }`}
                    aria-label={`${stats.pendingRecommendations} new recommendations`}
                  >
                    {stats.pendingRecommendations}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Panels */}
          <div role="tabpanel" id={`${activeTab}-panel`}>
            {activeTab === "recent" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  No recent activity yet. Start by connecting with friends and
                  sharing recommendations!
                </p>
              </div>
            )}

            {activeTab === "recommendations" && <DashboardRecommendations />}

            {activeTab === "trending" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Trending content will appear here. Check back later to see
                  what's popular with your friends!
                </p>
              </div>
            )}
          </div>

          {/* Getting Started */}
          {showGettingStarted && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 relative mt-6">
              <button
                onClick={() => {
                  setShowGettingStarted(false);
                  localStorage.setItem("hideGettingStarted", "true");
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 p-1"
                aria-label="Dismiss getting started"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pr-8 font-heading">
                Getting Started
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary dark:text-primary-light font-bold mt-0.5">
                    1.
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Start tracking content
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Browse Movies & TV, Music, Books, or Games and add items
                      to your watchlist
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary dark:text-primary-light font-bold mt-0.5">
                    2.
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Rate what you've enjoyed
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Give ratings to help us understand your taste
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary dark:text-primary-light font-bold mt-0.5">
                    3.
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Connect with friends
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      See what your friends are watching and get recommendations
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer />
      </SimpleLayout>
    </MainLayout>
  );
};

export default HomePage;
