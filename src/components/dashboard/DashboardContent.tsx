import React from "react";
import { X } from "lucide-react";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { DashboardRecommendations } from "./DashboardRecommendations";
import { UserSearch, Button } from "@/components/shared";

interface DashboardContentProps {
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
  activeTab,
  stats: _stats,
  statsLoading: _statsLoading,
  showGettingStarted,
  setShowGettingStarted,
}) => {
  return (
    <div className="container mx-auto px-6">
      {/* Tab Panels */}
      <div role="tabpanel" id={`${activeTab}-panel`}>
        {activeTab === "dashboard" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Your dashboard stats are shown above. More widgets coming soon!
            </p>
          </div>
        )}

        {activeTab === "friends" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Find Friends
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Search for friends to connect with and share recommendations!
            </p>
            <UserSearch />
          </div>
        )}

        {activeTab === "recommendations" && <DashboardRecommendations />}

        {activeTab === "trending" && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                No recent activity yet. Start by connecting with friends and
                sharing recommendations!
              </p>
            </div>

            {/* Trending Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Trending Content
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Check back later to see what's popular with your friends!
              </p>
            </div>
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
    </div>
  );
};
