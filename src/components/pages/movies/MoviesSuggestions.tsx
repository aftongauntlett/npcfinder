import React, { useState, useMemo } from "react";
import { Film, Tv as TvIcon } from "lucide-react";
import SendMediaModal from "../../shared/SendMediaModal";
import { searchMoviesAndTV } from "../../../utils/mediaSearchAdapters";
import MediaRecommendationCard from "../../shared/MediaRecommendationCard";
import {
  MediaRecommendationsLayout,
  BaseRecommendation,
} from "../../shared/MediaRecommendationsLayout";
import ContentLayout from "../../layouts/ContentLayout";
import MainLayout from "../../layouts/MainLayout";
import {
  useFriendsWithMovieRecs,
  useMovieStats,
  useMovieRecommendations,
  useUpdateMovieRecommendationStatus,
  useDeleteMovieRecommendation,
} from "../../../hooks/useMovieQueries";

// Extend BaseRecommendation with movie-specific fields
interface MovieRecommendation extends BaseRecommendation {
  media_type: "movie" | "tv";
  release_date: string | null;
  overview: string | null;
  poster_url: string | null;
  status: "pending" | "watched" | "hit" | "miss";
  watched_at: string | null;
  created_at: string;
  sender_comment: string | null;
}

/**
 * Movies & TV Suggestions Page
 * View and manage movie/TV show recommendations from friends
 */
const MoviesSuggestions: React.FC = () => {
  const [selectedView, setSelectedView] = useState<
    "overview" | "friend" | "hits" | "misses" | "sent"
  >("overview");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);

  // TanStack Query hooks
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithMovieRecs();
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useMovieStats();
  const { data: rawRecommendations = [], isLoading: recsLoading } =
    useMovieRecommendations(selectedView, selectedFriendId || undefined);

  const loading = friendsLoading || recsLoading;

  // Map raw recommendations to MovieRecommendation format
  const recommendations = useMemo<MovieRecommendation[]>(() => {
    return rawRecommendations.map((rec) => ({
      ...rec,
      sent_message: rec.sent_message || null,
      comment: rec.recipient_note || null,
      sender_comment: rec.sender_note || null,
      sent_at: rec.created_at,
      poster_url: rec.poster_url || null,
      watched_at: rec.watched_at || null,
      overview: rec.overview || null,
      release_date: rec.year ? `${rec.year}` : null,
      media_type: rec.media_type as "movie" | "tv",
      status:
        rec.status === "consumed" || rec.status === "watched"
          ? "watched"
          : rec.status,
    }));
  }, [rawRecommendations]);

  // Mutations
  const updateStatusMutation = useUpdateMovieRecommendationStatus();
  const deleteRecMutation = useDeleteMovieRecommendation();

  const handleViewChange = (
    view: "overview" | "friend" | "hits" | "misses" | "sent",
    friendId?: string
  ) => {
    setSelectedView(view);
    setSelectedFriendId(friendId || null);
  };

  const updateRecommendationStatus = async (
    recId: string,
    status: string,
    comment?: string
  ) => {
    try {
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

  const deleteRecommendation = async (recId: string) => {
    try {
      await deleteRecMutation.mutateAsync(recId);
    } catch (error) {
      console.error("Error deleting recommendation:", error);
    }
  };

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
    <MainLayout>
      <ContentLayout
        title="Suggestions"
        description="Discover movies and TV shows recommended by your friends."
      >
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
      </ContentLayout>

      {/* Send Movie/TV Modal */}
      <SendMediaModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSent={() => {
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
    </MainLayout>
  );
};

export default MoviesSuggestions;
