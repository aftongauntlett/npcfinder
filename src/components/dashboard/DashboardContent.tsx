import React from "react";
import { X } from "lucide-react";
import { DashboardRecommendations } from "./DashboardRecommendations";
import { DashboardUpcomingTasks } from "./DashboardUpcomingTasks";
import { UserSearch, Button } from "@/components/shared";
import { useAllAccessibleCollections } from "@/hooks/useCollectionsQueries";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardContentProps {
  activeTab: string;
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
  const { user } = useAuth();
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

  const { data: unreadByCollection = {} } = useQuery({
    queryKey: [
      "dashboard",
      "unread-recs-by-collection",
      user?.id,
      recentCollections.map((c) => c.id).join(","),
    ],
    enabled: !!user?.id && recentCollections.length > 0,
    queryFn: async () => {
      const collectionIds = recentCollections.map((c) => c.id);
      const userId = user?.id;
      if (!userId || collectionIds.length === 0)
        return {} as Record<string, number>;

      const { data: connections, error: connectionsError } = await supabase
        .from("connections")
        .select("user_id, friend_id")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (connectionsError) throw connectionsError;

      const friendIds = new Set<string>();
      (connections || []).forEach((conn) => {
        const peerId = conn.user_id === userId ? conn.friend_id : conn.user_id;
        if (peerId) friendIds.add(String(peerId));
      });

      if (friendIds.size === 0) return {} as Record<string, number>;

      const pendingSelect = "external_id, from_user_id";
      const friendIdList = Array.from(friendIds);

      const [movieRecs, bookRecs, musicRecs, gameRecs] = await Promise.all([
        supabase
          .from("movie_recommendations")
          .select(pendingSelect)
          .eq("to_user_id", userId)
          .eq("status", "pending")
          .is("opened_at", null)
          .in("from_user_id", friendIdList),
        supabase
          .from("book_recommendations")
          .select(pendingSelect)
          .eq("to_user_id", userId)
          .eq("status", "pending")
          .is("opened_at", null)
          .in("from_user_id", friendIdList),
        supabase
          .from("music_recommendations")
          .select(pendingSelect)
          .eq("to_user_id", userId)
          .eq("status", "pending")
          .is("opened_at", null)
          .in("from_user_id", friendIdList),
        supabase
          .from("game_recommendations")
          .select(pendingSelect)
          .eq("to_user_id", userId)
          .eq("status", "pending")
          .is("opened_at", null)
          .in("from_user_id", friendIdList),
      ]);

      if (movieRecs.error) throw movieRecs.error;
      if (bookRecs.error) throw bookRecs.error;
      if (musicRecs.error) throw musicRecs.error;
      if (gameRecs.error) throw gameRecs.error;

      const recommendedIds = new Set<string>();
      [
        ...(movieRecs.data || []),
        ...(bookRecs.data || []),
        ...(musicRecs.data || []),
        ...(gameRecs.data || []),
      ].forEach((row) => {
        if (row.external_id) recommendedIds.add(String(row.external_id));
      });

      if (recommendedIds.size === 0) return {} as Record<string, number>;

      const { data: matchingItems, error: matchingItemsError } = await supabase
        .from("media_list_items")
        .select("list_id, external_id")
        .in("list_id", collectionIds)
        .in("external_id", Array.from(recommendedIds));

      if (matchingItemsError) throw matchingItemsError;

      const counts: Record<string, number> = {};
      (matchingItems || []).forEach((item) => {
        counts[item.list_id] = (counts[item.list_id] || 0) + 1;
      });

      return counts;
    },
  });

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
                        {(unreadByCollection[collection.id] || 0) > 0 && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                            {unreadByCollection[collection.id]} unread recs
                          </span>
                        )}
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
                  Create collections for Movies & TV, Music, Books, and Games to
                  organize what you want to revisit and share
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
