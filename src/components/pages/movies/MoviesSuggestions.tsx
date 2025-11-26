import React, { useState } from "react";
import { Clapperboard, Tv as TvIcon } from "lucide-react";
import {
  SendMediaModal,
  MediaRecommendationCard,
  GroupedSentMediaCard,
  InlineRecommendationsLayout,
  type BaseRecommendation,
} from "@/components/shared";
import { searchMoviesAndTV } from "../../../utils/mediaSearchAdapters";
import ContentLayout from "../../layouts/ContentLayout";
import MainLayout from "../../layouts/MainLayout";
import {
  useUpdateMovieRecommendationStatus,
  useDeleteMovieRecommendation,
  useUpdateSenderNote,
  useUpdateRecipientNote,
} from "../../../hooks/useMovieQueries";
import { useMovieRecommendationsData } from "../../../hooks/useMovieRecommendationsData";
import MovieDiscoveryCard from "../../media/MovieDiscoveryCard";

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
 *
 * @param embedded - When true, hides outer MainLayout/ContentLayout (used in tabbed view)
 */
interface MoviesSuggestionsProps {
  embedded?: boolean;
}

const MoviesSuggestions: React.FC<MoviesSuggestionsProps> = ({
  embedded = false,
}) => {
  const [showSendModal, setShowSendModal] = useState(false);

  // Use data transformation hook - returns fully-shaped data ready for rendering
  const {
    hits,
    misses,
    sent,
    friendRecommendations,
    friendsWithRecs: filteredFriendsWithRecs,
    quickStats,
    userNameMap,
    loading,
  } = useMovieRecommendationsData();

  // Mutations
  const updateStatusMutation = useUpdateMovieRecommendationStatus();
  const deleteRecMutation = useDeleteMovieRecommendation();
  const updateSenderNoteMutation = useUpdateSenderNote();
  const updateRecipientNoteMutation = useUpdateRecipientNote();

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
      });

      // If comment is provided, update recipient's note
      if (comment !== undefined) {
        await updateRecipientNoteMutation.mutateAsync({
          recId,
          note: comment,
        });
      }
    } catch (error) {
      console.error("Error updating recommendation:", error);
    }
  };

  const updateSenderComment = async (recId: string, senderComment: string) => {
    try {
      await updateSenderNoteMutation.mutateAsync({
        recId,
        note: senderComment,
      });
    } catch (error) {
      console.error("Error updating sender comment:", error);
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
    isReceived: boolean,
    index = 0
  ) => {
    const MediaIcon = rec.media_type === "tv" ? TvIcon : Clapperboard;

    // Get the appropriate user name based on direction
    const senderName = isReceived
      ? userNameMap.get(rec.from_user_id) || "Unknown User"
      : userNameMap.get(rec.to_user_id) || "Unknown User";

    return (
      <MediaRecommendationCard
        key={rec.id}
        rec={rec}
        index={index}
        isReceived={isReceived}
        senderName={senderName}
        onStatusUpdate={updateRecommendationStatus}
        onDelete={deleteRecommendation}
        onUpdateSenderComment={updateSenderComment}
        renderMediaArt={(r: MovieRecommendation) => {
          return r.poster_url ? (
            <img
              src={r.poster_url}
              alt={r.title}
              className="w-12 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <MediaIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(r: MovieRecommendation) => {
          return (
            <>
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {r.title}
                </div>
                {r.media_type === "tv" ? (
                  <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                    <TvIcon className="w-3 h-3" />
                    TV
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                    <Clapperboard className="w-3 h-3" />
                    Movie
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {r.release_date}
              </div>
              {r.overview && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {r.overview}
                </div>
              )}
            </>
          );
        }}
      />
    );
  };

  const renderGroupedSentCard = (
    mediaItem: MovieRecommendation,
    index: number
  ) => {
    const MediaIcon = mediaItem.media_type === "tv" ? TvIcon : Clapperboard;

    // Find all sent items with the same external_id to get all recipients
    const allRecipients = sent
      .filter((rec) => rec.external_id === mediaItem.external_id)
      .map((rec) => ({
        name: userNameMap.get(rec.to_user_id) || "Unknown User",
        recId: rec.id,
        status: rec.status,
      }));

    return (
      <GroupedSentMediaCard
        key={`grouped-${mediaItem.external_id}`}
        mediaItem={mediaItem}
        recipients={allRecipients}
        index={index}
        onDelete={deleteRecommendation}
        renderMediaArt={(item) => {
          const movieRec = item;
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
        renderMediaInfo={(item) => {
          const movieRec = item;
          return (
            <>
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {movieRec.title}
                </div>
                {movieRec.media_type === "tv" ? (
                  <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                    <TvIcon className="w-3 h-3" />
                    TV
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                    <Clapperboard className="w-3 h-3" />
                    Movie
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

  const content = (
    <div className="container mx-auto px-6">
      <div className="space-y-6">
        <InlineRecommendationsLayout
          mediaType="Movies & TV"
          mediaIcon={Clapperboard}
          emptyMessage="No recommendations yet"
          emptySubMessage="When friends recommend movies or TV shows, they'll show up here"
          loading={loading}
          friendsWithRecs={filteredFriendsWithRecs}
          quickStats={quickStats}
          hits={hits}
          misses={misses}
          sent={sent}
          friendRecommendations={friendRecommendations}
          renderRecommendationCard={renderRecommendationCard}
          renderGroupedSentCard={renderGroupedSentCard}
        />

        <MovieDiscoveryCard />
      </div>

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
    </div>
  );

  // If embedded, return content without layouts
  if (embedded) {
    return content;
  }

  // Otherwise, wrap in full page layout
  return (
    <MainLayout>
      <ContentLayout
        title="Suggestions"
        description="Discover movies and TV shows recommended by your friends."
      >
        {content}
      </ContentLayout>
    </MainLayout>
  );
};

export default MoviesSuggestions;
