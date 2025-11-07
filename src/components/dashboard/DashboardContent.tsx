import React from "react";
import { UserPlus, X } from "lucide-react";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { DashboardRecommendations } from "./DashboardRecommendations";
import { FriendSearchModal } from "../shared/FriendSearchModal";
import Button from "../shared/Button";

interface DashboardContentProps {
  showFriendSearch: boolean;
  setShowFriendSearch: (show: boolean) => void;
  activeTab: string;
  handleTabChange: (tabId: string) => void;
  stats: ReturnType<typeof useDashboardStats>["data"];
  statsLoading: boolean;
  showGettingStarted: boolean;
  setShowGettingStarted: (show: boolean) => void;
}

/**
 * Dashboard Content Component
 *
 * Extracted from HomePage to keep components focused (<200 lines per guidelines)
 * Handles stats, tabs, and activity feeds
 */
export const DashboardContent: React.FC<DashboardContentProps> = ({
  showFriendSearch,
  setShowFriendSearch,
  activeTab,
  stats,
  statsLoading,
  showGettingStarted,
  setShowGettingStarted,
}) => {
  return (
    <>
      {/* Quick Actions - Find Friends */}
      <div className="mb-8">
        <button
          onClick={() => setShowFriendSearch(true)}
          className="w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-all text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
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

      {/* Stats Bar */}
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
              Trending content will appear here. Check back later to see what's
              popular with your friends!
            </p>
          </div>
        )}
      </div>

      {/* Getting Started */}
      {showGettingStarted && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 relative mt-6">
          <Button
            onClick={() => {
              setShowGettingStarted(false);
              localStorage.setItem("hideGettingStarted", "true");
            }}
            variant="subtle"
            size="icon"
            icon={<X className="w-5 h-5" />}
            className="absolute top-4 right-4"
            aria-label="Dismiss getting started"
          />
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
                  Browse Movies & TV, Music, Books, or Games and add items to
                  your watchlist
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
    </>
  );
};
