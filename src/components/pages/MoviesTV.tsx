import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Film, Tv as TvIcon, Send, ListVideo, Lightbulb } from "lucide-react";
import SendMediaModal from "../shared/SendMediaModal";
import { searchMoviesAndTV } from "../../utils/mediaSearchAdapters";
import MediaRecommendationCard from "../shared/MediaRecommendationCard";
import {
  MediaRecommendationsLayout,
  BaseRecommendation,
  FriendSummary,
} from "../shared/MediaRecommendationsLayout";
import * as recommendationsService from "../../services/recommendationsService";
import type { Recommendation } from "../../data/mockData";
import PersonalWatchList from "../media/PersonalWatchList";
import MediaPageTemplate from "../layouts/MediaPageTemplate";

// Extend BaseRecommendation with movie-specific fields
interface MovieRecommendation extends BaseRecommendation {
  media_type: "movie" | "tv";
  release_date: string | null;
  overview: string | null;
  poster_url: string | null;
  // Override with movie-specific status types
  status: "pending" | "watched" | "hit" | "miss";
  watched_at: string | null; // Movie-specific timestamp field (maps to consumed_at)
  created_at: string;
  sender_comment: string | null; // Required by MediaRecommendationCard
}

/**
 * Movies & TV Recommendations Dashboard
 * Discover great movies and shows through trusted friend recommendations
 */
const MoviesTV: React.FC = () => {
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<"watchlist" | "suggestions">(
    "watchlist"
  );

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

      // Use service layer to get friends with stats (movie + tv)
      const friends =
        await recommendationsService.getFriendsWithRecommendations("movie");
      setFriendsWithRecs(friends);

      // Get quick stats
      const stats = await recommendationsService.getQuickStats("movie");
      setQuickStats(stats);
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
        let data: Recommendation[] = [];

        if (view === "friend" && friendId) {
          // Show all recs from this friend
          data = await recommendationsService.getRecommendationsFromFriend(
            friendId,
            "movie"
          );
        } else if (view === "hits") {
          // Show all hits from any friend
          data = await recommendationsService.getRecommendations({
            direction: "received",
            status: "hit",
            mediaType: "movie",
          });
        } else if (view === "misses") {
          // Show all misses from any friend
          data = await recommendationsService.getRecommendations({
            direction: "received",
            status: "miss",
            mediaType: "movie",
          });
        } else if (view === "sent") {
          // Show all recs sent by this user
          data = await recommendationsService.getRecommendations({
            direction: "sent",
            mediaType: "movie",
          });
        }

        // Map mock data to MovieRecommendation format
        const mappedData: MovieRecommendation[] = data.map((rec) => ({
          ...rec,
          // Map mockData fields to component fields
          sent_message: rec.sent_message || null,
          comment: rec.recipient_note || null,
          sender_comment: rec.sender_note || null,
          sent_at: rec.created_at,
          poster_url: rec.poster_url || null,
          watched_at: rec.consumed_at || null,
          // These fields aren't in mockData yet - will add later
          overview: null,
          release_date: rec.year ? `${rec.year}` : null,
          // Filter only movie/tv types
          media_type: rec.media_type as "movie" | "tv",
          // Map 'consumed' status to 'watched' for movies
          status:
            rec.status === "consumed"
              ? "watched"
              : (rec.status as "pending" | "watched" | "hit" | "miss"),
        }));

        setRecommendations(mappedData);
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
      // Optimistic update - update local state immediately
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === recId
            ? {
                ...rec,
                status: status as MovieRecommendation["status"],
                comment: comment || rec.comment,
              }
            : rec
        )
      );

      // Map 'consumed' back to 'watched' for movies
      const dbStatus = status === "consumed" ? "watched" : status;

      await recommendationsService.updateRecommendationStatus(
        recId,
        dbStatus as "pending" | "consumed" | "hit" | "miss",
        comment
      );

      // Refresh friend counts in background (don't await to avoid flicker)
      void loadFriendsWithRecommendations();
    } catch (error) {
      console.error("Error updating recommendation:", error);
      // On error, reload to get correct state
      if (selectedView === "friend" && selectedFriendId) {
        await loadRecommendations("friend", selectedFriendId);
      } else {
        await loadRecommendations(selectedView);
      }
    }
  };

  // Delete (unsend) a recommendation
  const deleteRecommendation = async (recId: string) => {
    try {
      await recommendationsService.deleteRecommendation(recId);

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
      <MediaPageTemplate
        pageTitle="Movies & TV"
        pageDescription="Discover, track and recommend movies & tv shows."
        tabs={[
          {
            id: "watchlist",
            label: "Watch List",
            icon: <ListVideo className="w-4 h-4" />,
          },
          {
            id: "suggestions",
            label: "Suggestions",
            icon: <Lightbulb className="w-4 h-4" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) =>
          setActiveTab(tabId as "watchlist" | "suggestions")
        }
        primaryAction={{
          label: "Recommend",
          icon: <Send className="w-4 h-4" />,
          onClick: () => setShowSendModal(true),
          variant: "outline" as const,
        }}
      >
        {/* Tab Content */}
        {activeTab === "watchlist" ? (
          <PersonalWatchList />
        ) : (
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
            onSendClick={undefined}
            onStatusUpdate={updateRecommendationStatus}
            onDelete={deleteRecommendation}
            renderRecommendationCard={renderRecommendationCard}
          />
        )}
      </MediaPageTemplate>

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
