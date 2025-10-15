import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Send,
  Film,
  Tv,
  ThumbsUp,
  ThumbsDown,
  User,
} from "lucide-react";
import SendMovieModal from "./media/SendMovieModal";

interface MovieRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  title: string;
  media_type: "movie" | "tv";
  poster_url: string | null;
  release_date: string | null;
  overview: string | null;
  status: "pending" | "watched" | "hit" | "miss";
  recommendation_type: "watch" | "rewatch";
  sent_message: string | null;
  created_at: string;
  watched_at: string | null;
}

interface FriendSummary {
  user_id: string;
  display_name: string;
  pending_count: number;
  total_count: number;
  hit_count: number;
  miss_count: number;
}

/**
 * Movies & TV Recommendations Dashboard
 * Calm, friend-based movie/TV sharing - similar to Music page
 */
const MoviesTV: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [friendsWithRecs, setFriendsWithRecs] = useState<FriendSummary[]>([]);
  const [selectedView, setSelectedView] = useState<
    "overview" | "friend" | "watchlist" | "archive"
  >("overview");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>(
    []
  );
  const [showSendModal, setShowSendModal] = useState(false);

  // Load friends who have sent recommendations
  const loadFriendsWithRecommendations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all recommendations sent to this user, grouped by sender
      const { data: recs, error } = await supabase
        .from("movie_recommendations")
        .select("from_user_id, status")
        .eq("to_user_id", user.id);

      if (error) throw error;

      // Group by sender and count statuses
      const friendMap = new Map<
        string,
        { pending: number; total: number; hits: number; misses: number }
      >();

      recs?.forEach((rec) => {
        const existing = friendMap.get(rec.from_user_id) || {
          pending: 0,
          total: 0,
          hits: 0,
          misses: 0,
        };
        existing.total++;
        if (rec.status === "pending") existing.pending++;
        if (rec.status === "hit") existing.hits++;
        if (rec.status === "miss") existing.misses++;
        friendMap.set(rec.from_user_id, existing);
      });

      // Get display names for all friends
      const friendIds = Array.from(friendMap.keys());
      if (friendIds.length === 0) {
        setFriendsWithRecs([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", friendIds);

      if (profileError) throw profileError;

      const friends: FriendSummary[] =
        profiles?.map((profile) => {
          const stats = friendMap.get(profile.user_id)!;
          return {
            user_id: profile.user_id,
            display_name: profile.display_name || "Anonymous",
            pending_count: stats.pending,
            total_count: stats.total,
            hit_count: stats.hits,
            miss_count: stats.misses,
          };
        }) || [];

      // Sort by pending count (most new recs first)
      friends.sort((a, b) => b.pending_count - a.pending_count);

      setFriendsWithRecs(friends);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load recommendations for a specific view
  const loadRecommendations = useCallback(
    async (view: string, friendId?: string) => {
      if (!user) return;

      try {
        setLoading(true);
        let query = supabase.from("movie_recommendations").select("*");

        if (view === "friend" && friendId) {
          // Show all recs from this friend
          query = query
            .eq("to_user_id", user.id)
            .eq("from_user_id", friendId)
            .order("created_at", { ascending: false });
        } else if (view === "watchlist") {
          // Placeholder for watchlist view
          setRecommendations([]);
          setLoading(false);
          return;
        } else if (view === "archive") {
          // Placeholder for archive view
          setRecommendations([]);
          setLoading(false);
          return;
        }

        const { data, error } = await query;

        if (error) throw error;

        setRecommendations(data || []);
      } catch (error) {
        console.error("Error loading recommendations:", error);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Handle view changes
  const handleViewChange = (view: string, friendId?: string) => {
    setSelectedView(view as any);
    setSelectedFriendId(friendId || null);
    if (view !== "overview") {
      void loadRecommendations(view, friendId);
    }
  };

  // Update recommendation status
  const updateRecommendationStatus = async (
    recId: string,
    status: "watched" | "hit" | "miss"
  ) => {
    try {
      const updates: any = {
        status,
        watched_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("movie_recommendations")
        .update(updates)
        .eq("id", recId);

      if (error) throw error;

      // Refresh the current view
      if (selectedView === "friend" && selectedFriendId) {
        await loadRecommendations("friend", selectedFriendId);
      } else {
        await loadRecommendations(selectedView);
      }

      // Refresh friend counts
      await loadFriendsWithRecommendations();
    } catch (error) {
      console.error("Error updating recommendation:", error);
    }
  };

  useEffect(() => {
    void loadFriendsWithRecommendations();
  }, [loadFriendsWithRecommendations]);

  // Render overview (default view)
  const renderOverview = () => {
    const pendingCount = friendsWithRecs.reduce(
      (sum, f) => sum + f.pending_count,
      0
    );
    const hitCount = friendsWithRecs.reduce((sum, f) => sum + f.hit_count, 0);
    const missCount = friendsWithRecs.reduce(
      (sum, f) => sum + f.miss_count,
      0
    );

    return (
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {hitCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Your Hits
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
              {missCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Your Misses
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              {pendingCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Watching Queue
            </div>
          </div>
        </div>

        {/* From Friends Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              From Friends
              {pendingCount > 0 && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({pendingCount} new)
                </span>
              )}
            </h2>
          </div>

          {friendsWithRecs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <Film className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No recommendations yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                When friends send you movies or TV shows, they'll show up here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friendsWithRecs.map((friend) => (
                <button
                  key={friend.user_id}
                  onClick={() => handleViewChange("friend", friend.user_id)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {friend.display_name}
                      </div>
                      {friend.pending_count > 0 && (
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          {friend.pending_count} new
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{friend.total_count} total</span>
                    {friend.hit_count > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {friend.hit_count}
                      </span>
                    )}
                    {friend.miss_count > 0 && (
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" />
                        {friend.miss_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render friend's recommendations
  const renderFriendView = () => {
    const friend = friendsWithRecs.find((f) => f.user_id === selectedFriendId);
    if (!friend) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleViewChange("overview")}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            From {friend.display_name}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No recommendations yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 flex gap-4"
              >
                {/* Poster */}
                {rec.poster_url ? (
                  <img
                    src={rec.poster_url}
                    alt={rec.title}
                    className="w-24 h-36 object-cover rounded"
                  />
                ) : (
                  <div className="w-24 h-36 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    {rec.media_type === "movie" ? (
                      <Film size={32} className="text-gray-400" />
                    ) : (
                      <Tv size={32} className="text-gray-400" />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {rec.title}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {rec.media_type === "movie" ? "Movie" : "TV Show"}
                        {rec.release_date &&
                          ` • ${rec.release_date.split("-")[0]}`}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rec.status === "pending"
                          ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                          : rec.status === "watched"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : rec.status === "hit"
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {rec.status === "pending" && "To Watch"}
                      {rec.status === "watched" && "Watched"}
                      {rec.status === "hit" && "Loved It!"}
                      {rec.status === "miss" && "Not For Me"}
                    </span>
                  </div>

                  {rec.recommendation_type && (
                    <div className="mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          rec.recommendation_type === "watch"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            : "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                        }`}
                      >
                        {rec.recommendation_type === "watch" ? (
                          <>
                            <Film size={12} />
                            Watch
                          </>
                        ) : (
                          <>
                            <Tv size={12} />
                            Rewatch
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {rec.sent_message && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 italic">
                      "{rec.sent_message}"
                    </p>
                  )}

                  {rec.overview && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {rec.overview}
                    </p>
                  )}

                  {/* Action Buttons */}
                  {rec.status === "pending" && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          updateRecommendationStatus(rec.id, "watched")
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Mark as Watched
                      </button>
                      <button
                        onClick={() =>
                          updateRecommendationStatus(rec.id, "hit")
                        }
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        <ThumbsUp size={16} />
                        Loved It
                      </button>
                      <button
                        onClick={() =>
                          updateRecommendationStatus(rec.id, "miss")
                        }
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        <ThumbsDown size={16} />
                        Not For Me
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render watchlist placeholder
  const renderWatchlistView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleViewChange("overview")}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          My Watchlist
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
        <Film className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Watchlist coming soon!
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Personal watchlist with drag-and-drop ordering and public/private
          settings
        </p>
      </div>
    </div>
  );

  // Render archive placeholder
  const renderArchiveView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleViewChange("overview")}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Watched Archive
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
        <Tv className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Archive coming soon!
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          View all watched movies/TV with your ratings and reviews
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Movies & TV
            </h1>
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Send size={20} />
              Send Recommendation
            </button>
          </div>

          {/* Render current view */}
          {selectedView === "overview" && renderOverview()}
          {selectedView === "friend" && renderFriendView()}
          {selectedView === "watchlist" && renderWatchlistView()}
          {selectedView === "archive" && renderArchiveView()}
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <SendMovieModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSent={async () => {
            setShowSendModal(false);
            await loadFriendsWithRecommendations();
          }}
        />
      )}
    </>
  );
};

export default MoviesTV;
