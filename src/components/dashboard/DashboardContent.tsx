import React from "react";
import { X } from "lucide-react";
import { DashboardRecommendations } from "./DashboardRecommendations";
import { DashboardUpcomingTasks } from "./DashboardUpcomingTasks";
import { UserSearch, Button } from "@/components/shared";
import { useAllAccessibleCollections } from "@/hooks/useCollectionsQueries";
import { useNavigate } from "react-router-dom";

interface DashboardContentProps {
  activeTab: string;
  handleTabChange: (tabId: string) => void;
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
  showGettingStarted,
  setShowGettingStarted,
}) => {
  const navigate = useNavigate();
  const { data: collections = [], isLoading: collectionsLoading } =
    useAllAccessibleCollections();

  const recentCollections = [...collections]
    .sort((a, b) =>
      (b.updated_at || b.created_at).localeCompare(
        a.updated_at || a.created_at,
      ),
    )
    .slice(0, 5);

  return (
    <div className="container mx-auto px-6">
      {/* Tab Panels */}
      <div role="tabpanel" id={`${activeTab}-panel`}>
        {/* Dashboard Tab - Media-first */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recently Updated Collections
                </h2>
                <Button
                  variant="subtle"
                  onClick={() => void navigate("/app/media")}
                >
                  View Media
                </Button>
              </div>

              {collectionsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading collections...
                </p>
              ) : recentCollections.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No collections yet. Start building your media space in the
                  Media tab.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCollections.map((collection) => (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() =>
                        void navigate(`/app/media/${collection.id}`)
                      }
                      className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {collection.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {collection.owner_display_name} •{" "}
                        {collection.item_count} items
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DashboardUpcomingTasks />
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Recent Activity
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                No recent activity yet. Start by connecting with friends and
                sharing recommendations!
              </p>
            </div>

            {/* Trending Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Trending Content
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Check back later to see what's popular with your friends!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Getting Started - Only show on Dashboard tab */}
      {activeTab === "dashboard" && showGettingStarted && (
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
