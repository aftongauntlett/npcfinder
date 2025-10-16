import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Film, Tv as TvIcon } from "lucide-react";
import SendMediaModal from "./shared/SendMediaModal";
import { searchMoviesAndTV } from "../utils/mediaSearchAdapters";
import MediaRecommendationCard from "./shared/MediaRecommendationCard";
import {
  MediaRecommendationsLayout,
  BaseRecommendation,
  FriendSummary,
} from "./shared/MediaRecommendationsLayout";

// Extend BaseRecommendation with movie-specific fields
interface MovieRecommendation
  extends Omit<BaseRecommendation, "status" | "consumed_at"> {
  media_type: "movie" | "tv";
  release_date: string | null;
  overview: string | null;
  // Override with movie-specific status types
  status: "pending" | "watched" | "hit" | "miss";
  watched_at: string | null; // Movie-specific timestamp field
  created_at: string;
}

/**
 * Movies & TV Recommendations Dashboard
 * Discover great movies and shows through trusted friend recommendations
 */
const MoviesTV: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [friendsWithRecs, setFriendsWithRecs] = useState<FriendSummary[]>([]);
  const [selectedView, setSelectedView] = useState<
    "overview" | "friend" | "hits" | "misses" | "sent"
  >("overview");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>(
    []
  );
  const [showSendModal, setShowSendModal] = useState(false);
  const [quickStats, setQuickStats] = useState({
    hits: 0,
    misses: 0,
    queue: 0,
    sent: 0,
  });

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

      // Calculate quick stats from received recommendations
      const allHits = recs?.filter((r) => r.status === "hit").length || 0;
      const allMisses = recs?.filter((r) => r.status === "miss").length || 0;
      const allQueue = recs?.filter((r) => r.status === "pending").length || 0;

      // Get sent count (ALWAYS do this, even if no received recommendations)
      const { count: sentCount } = await supabase
        .from("movie_recommendations")
        .select("*", { count: "exact", head: true })
        .eq("from_user_id", user.id);

      setQuickStats({
        hits: allHits,
        misses: allMisses,
        queue: allQueue,
        sent: sentCount || 0,
      });

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

      // Combine data
      const friends: FriendSummary[] =
        profiles?.map((profile) => {
          const stats = friendMap.get(profile.user_id)!;
          return {
            user_id: profile.user_id,
            display_name: profile.display_name,
            pending_count: stats.pending,
            total_count: stats.total,
            hit_count: stats.hits,
            miss_count: stats.misses,
          };
        }) || [];

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
        } else if (view === "hits") {
          // Show all hits from any friend
          query = query
            .eq("to_user_id", user.id)
            .eq("status", "hit")
            .order("watched_at", { ascending: false });
        } else if (view === "misses") {
          // Show all misses from any friend
          query = query
            .eq("to_user_id", user.id)
            .eq("status", "miss")
            .order("watched_at", { ascending: false });
        } else if (view === "sent") {
          // Show all recs sent by this user
          query = query
            .eq("from_user_id", user.id)
            .order("created_at", { ascending: false });
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

  // Mark a recommendation as watched/hit/miss
  const updateRecommendationStatus = async (
    recId: string,
    status: string,
    comment?: string
  ) => {
    try {
      // Map 'consumed' back to 'watched' for movies
      const dbStatus = status === "consumed" ? "watched" : status;

      const updates: Record<string, string | null> = {
        status: dbStatus,
      };

      // Only update watched_at if status is being set (not when just adding comment)
      if (dbStatus !== "pending") {
        updates.watched_at = new Date().toISOString();
      }

      if (comment !== undefined) {
        updates.comment = comment;
      }

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

  // Delete (unsend) a recommendation
  const deleteRecommendation = async (recId: string) => {
    try {
      const { error } = await supabase
        .from("movie_recommendations")
        .delete()
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
      console.error("Error deleting recommendation:", error);
    }
  };

  // Render a movie recommendation card
  const renderRecommendationCard = (
    rec: MovieRecommendation,
    isReceived: boolean
  ) => {
    const index = recommendations.indexOf(rec);
    const MediaIcon = rec.media_type === "tv" ? TvIcon : Film;

    return (
      <MediaRecommendationCard
        key={rec.id}
        rec={rec}
        index={index}
        isReceived={isReceived}
        onStatusUpdate={updateRecommendationStatus}
        onDelete={deleteRecommendation}
        renderMediaArt={(rec) =>
          rec.poster_url ? (
            <img
              src={rec.poster_url}
              alt={rec.title}
              className="w-12 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <MediaIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          )
        }
        renderMediaInfo={(rec) => (
          <>
            <div className="flex items-center gap-2">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {rec.title}
              </div>
              {rec.media_type === "tv" && (
                <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                  <TvIcon className="w-3 h-3" />
                  TV
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {rec.release_date}
            </div>
            {rec.overview && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {rec.overview}
              </div>
            )}
          </>
        )}
      />
    );
  };

  return (
    <>
      <MediaRecommendationsLayout
        mediaType="Movies & TV"
        mediaIcon={
          <Film className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        }
        emptyMessage="No recommendations yet"
        emptySubMessage="When friends recommend movies or TV shows, they'll show up here"
        queueLabel="Watching Queue"
        consumedLabel="Watched"
        loading={loading}
        friendsWithRecs={friendsWithRecs}
        recommendations={recommendations}
        quickStats={quickStats}
        selectedView={selectedView}
        selectedFriendId={selectedFriendId}
        onViewChange={handleViewChange}
        onSendClick={() => setShowSendModal(true)}
        onStatusUpdate={updateRecommendationStatus}
        onDelete={deleteRecommendation}
        renderRecommendationCard={renderRecommendationCard}
      />

      {/* Send Movie/TV Modal */}
      <SendMediaModal
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
        mediaType="movies"
        tableName="movie_recommendations"
        searchPlaceholder="Search for movies or TV shows..."
        searchFunction={searchMoviesAndTV}
        recommendationTypes={[
          { value: "watch", label: "Watch" },
          { value: "rewatch", label: "Rewatch" },
        ]}
        defaultRecommendationType="watch"
      />
    </>
  );
};

export default MoviesTV;
