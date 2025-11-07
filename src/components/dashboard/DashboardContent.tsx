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
  stats: _stats,
  statsLoading: _statsLoading,
  showGettingStarted,
  setShowGettingStarted,
}) => {
  return (
    <>
      {/* Friend Search Modal */}
      <FriendSearchModal
        isOpen={showFriendSearch}
        onClose={() => setShowFriendSearch(false)}
      />

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
