import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Send,
  Music as MusicIcon,
  ThumbsUp,
  ThumbsDown,
  User,
  Headphones,
  Video,
} from "lucide-react";
import SendMusicModal from "./media/SendMusicModal";

interface MusicRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  title: string;
  artist: string | null;
  album: string | null;
  media_type: string;
  year: number | null;
  poster_url: string | null;
  status: "pending" | "listened" | "hit" | "miss";
  recommendation_type: "listen" | "watch";
  sent_message: string | null;
  comment: string | null;
  sent_at: string;
  listened_at: string | null;
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
 * Music Recommendations Dashboard
 * Calm, friend-based music sharing - no pressure, just recommendations
 */
const Music: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [friendsWithRecs, setFriendsWithRecs] = useState<FriendSummary[]>([]);
  const [selectedView, setSelectedView] = useState<
    "overview" | "friend" | "hits" | "misses" | "sent"
  >("overview");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MusicRecommendation[]>(
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
        .from("music_recommendations")
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
        let query = supabase.from("music_recommendations").select("*");

        if (view === "friend" && friendId) {
          // Show all recs from this friend
          query = query
            .eq("to_user_id", user.id)
            .eq("from_user_id", friendId)
            .order("sent_at", { ascending: false });
        } else if (view === "hits") {
          // Show all hits from any friend
          query = query
            .eq("to_user_id", user.id)
            .eq("status", "hit")
            .order("listened_at", { ascending: false });
        } else if (view === "misses") {
          // Show all misses from any friend
          query = query
            .eq("to_user_id", user.id)
            .eq("status", "miss")
            .order("listened_at", { ascending: false });
        } else if (view === "sent") {
          // Show all recs sent by this user
          query = query
            .eq("from_user_id", user.id)
            .order("sent_at", { ascending: false });
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

  // Initial load
  useEffect(() => {
    void loadFriendsWithRecommendations();
  }, [loadFriendsWithRecommendations]);

  // Handle view changes
  const handleViewChange = (
    view: "overview" | "friend" | "hits" | "misses" | "sent",
    friendId?: string
  ) => {
    setSelectedView(view);
    setSelectedFriendId(friendId || null);

    if (view !== "overview") {
      void loadRecommendations(view, friendId);
    }
  };

  // Mark a recommendation as listened/hit/miss
  const updateRecommendationStatus = async (
    recId: string,
    status: "listened" | "hit" | "miss",
    comment?: string
  ) => {
    try {
      const updates: any = {
        status,
        listened_at: new Date().toISOString(),
      };

      if (comment) {
        updates.comment = comment;
      }

      const { error } = await supabase
        .from("music_recommendations")
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

  // Render overview (default view)
  const renderOverview = () => (
    <div className="space-y-8">
      {/* From Friends Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            From Friends
            {friendsWithRecs.reduce((sum, f) => sum + f.pending_count, 0) >
              0 && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({friendsWithRecs.reduce((sum, f) => sum + f.pending_count, 0)}{" "}
                new)
              </span>
            )}
          </h2>
        </div>

        {friendsWithRecs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <MusicIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              No recommendations yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              When friends send you music, it'll show up here
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleViewChange("hits")}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {friendsWithRecs.reduce((sum, f) => sum + f.hit_count, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Hits
          </div>
        </button>

        <button
          onClick={() => handleViewChange("misses")}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
            {friendsWithRecs.reduce((sum, f) => sum + f.miss_count, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Misses
          </div>
        </button>

        <button
          onClick={() => handleViewChange("sent")}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {/* TODO: Load sent count */}-
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Sent
          </div>
        </button>

        <button className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
            {friendsWithRecs.reduce((sum, f) => sum + f.pending_count, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Listening Queue
          </div>
        </button>
      </div>
    </div>
  );

  // Render recommendation list (for friend/hits/misses/sent views)
  const renderRecommendationList = () => {
    const title =
      selectedView === "friend"
        ? `From ${
            friendsWithRecs.find((f) => f.user_id === selectedFriendId)
              ?.display_name || "Friend"
          }`
        : selectedView === "hits"
        ? "Your Hits"
        : selectedView === "misses"
        ? "Your Misses"
        : "Your Sent";

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => handleViewChange("overview")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Music
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {title}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No recommendations here yet
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {recommendations.map((rec, index) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Track Number */}
                  <div className="w-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    {index + 1}
                  </div>

                  {/* Album Art */}
                  {rec.poster_url ? (
                    <img
                      src={rec.poster_url}
                      alt={rec.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <MusicIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {rec.title}
                      </div>
                      {rec.recommendation_type === "watch" && (
                        <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                          <Video className="w-3 h-3" />
                          Watch
                        </span>
                      )}
                      {rec.recommendation_type === "listen" && (
                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                          <Headphones className="w-3 h-3" />
                          Listen
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {rec.artist}
                      {rec.album && ` • ${rec.album}`}
                      {rec.year && ` • ${rec.year}`}
                    </div>
                    {rec.sent_message && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
                        "{rec.sent_message}"
                      </div>
                    )}
                    {rec.comment && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Your note: {rec.comment}
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    {rec.status === "pending" ? (
                      <>
                        <button
                          onClick={() =>
                            updateRecommendationStatus(rec.id, "listened")
                          }
                          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          Mark Listened
                        </button>
                        <button
                          onClick={() =>
                            updateRecommendationStatus(rec.id, "hit")
                          }
                          className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Hit
                        </button>
                        <button
                          onClick={() =>
                            updateRecommendationStatus(rec.id, "miss")
                          }
                          className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          Miss
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        {rec.status === "hit" && (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            Hit
                          </span>
                        )}
                        {rec.status === "miss" && (
                          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <ThumbsDown className="w-4 h-4" />
                            Miss
                          </span>
                        )}
                        {rec.status === "listened" && (
                          <span className="text-blue-600 dark:text-blue-400">
                            Listened
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Music
          </h1>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Send size={20} />
            Send Music
          </button>
        </div>

        {/* Content */}
        {loading && selectedView === "overview" ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              Loading your music...
            </div>
          </div>
        ) : selectedView === "overview" ? (
          renderOverview()
        ) : (
          renderRecommendationList()
        )}
      </div>

      {/* Send Music Modal */}
      <SendMusicModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSent={() => {
          // Refresh the data after sending
          void loadFriendsWithRecommendations();
          if (selectedView !== "overview") {
            void loadRecommendations(
              selectedView,
              selectedFriendId || undefined
            );
          }
        }}
      />
    </div>
  );
};

export default Music;
