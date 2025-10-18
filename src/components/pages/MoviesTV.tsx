import React, { useState, useMemo } from "react";
import { Film, Tv as TvIcon, Send, ListVideo, Lightbulb } from "lucide-react";
import SendMediaModal from "../shared/SendMediaModal";
import { searchMoviesAndTV } from "../../utils/mediaSearchAdapters";
import MediaRecommendationCard from "../shared/MediaRecommendationCard";
import {
  MediaRecommendationsLayout,
  BaseRecommendation,
} from "../shared/MediaRecommendationsLayout";
import PersonalWatchList from "../media/PersonalWatchList";
import MediaPageTemplate from "../layouts/MediaPageTemplate";
import {
  useFriendsWithMovieRecs,
  useMovieStats,
  useMovieRecommendations,
  useUpdateMovieRecommendationStatus,
  useDeleteMovieRecommendation,
} from "../../hooks/useMovieQueries";

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
  // Tab state
  const [activeTab, setActiveTab] = useState<"watchlist" | "suggestions">(
    "watchlist"
  );

  const [selectedView, setSelectedView] = useState<
    "overview" | "friend" | "hits" | "misses" | "sent"
  >("overview");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);

  // TanStack Query hooks - automatic loading, caching, refetching
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithMovieRecs();

  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useMovieStats();

  const { data: rawRecommendations = [], isLoading: recsLoading } =
    useMovieRecommendations(selectedView, selectedFriendId || undefined);

  // Derive loading state
  const loading = friendsLoading || recsLoading;

  // Map raw recommendations to MovieRecommendation format with useMemo
  const recommendations = useMemo<MovieRecommendation[]>(() => {
    return rawRecommendations.map((rec) => ({
      ...rec,
      sent_message: rec.sent_message || null,
      comment: rec.recipient_note || null,
      sender_comment: rec.sender_note || null,
      sent_at: rec.created_at,
      poster_url: rec.poster_url || null,
      watched_at: rec.consumed_at || null,
      overview: null,
      release_date: rec.year ? `${rec.year}` : null,
      media_type: rec.media_type as "movie" | "tv",
      status:
        rec.status === "consumed"
          ? "watched"
          : (rec.status as "pending" | "watched" | "hit" | "miss"),
    }));
  }, [rawRecommendations]);

  // TanStack Query mutations
  const updateStatusMutation = useUpdateMovieRecommendationStatus();
  const deleteRecMutation = useDeleteMovieRecommendation();

  // Handle view changes
  const handleViewChange = (
    view: "overview" | "friend" | "hits" | "misses" | "sent",
    friendId?: string
  ) => {
    setSelectedView(view);
    setSelectedFriendId(friendId || null);
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

      await updateStatusMutation.mutateAsync({
        recId,
        status: dbStatus,
        comment,
      });
    } catch (error) {
      console.error("Error updating recommendation:", error);
    }
  };

  // Delete (unsend) a recommendation
  const deleteRecommendation = async (recId: string) => {
    try {
      await deleteRecMutation.mutateAsync(recId);
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
        renderMediaArt={(r) => {
          const movieRec = r as unknown as MovieRecommendation;
          return movieRec.poster_url ? (
            <img
              src={movieRec.poster_url}
              alt={movieRec.title}
              className="w-12 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <MediaIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(r) => {
          const movieRec = r as unknown as MovieRecommendation;
          return (
            <>
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {movieRec.title}
                </div>
                {movieRec.media_type === "tv" && (
                  <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                    <TvIcon className="w-3 h-3" />
                    TV
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {movieRec.release_date}
              </div>
              {movieRec.overview && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {movieRec.overview}
                </div>
              )}
            </>
          );
        }}
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
          // TanStack Query will auto-invalidate and refresh after mutation
          setShowSendModal(false);
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
