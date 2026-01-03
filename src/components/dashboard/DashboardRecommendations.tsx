import React from "react";
import { Clapperboard, Tv as TvIcon } from "lucide-react";
import {
  MediaRecommendationCard,
  InlineRecommendationsLayout,
  type BaseRecommendation,
} from "@/components/shared";
import { logger } from "@/lib/logger";
import {
  useUpdateMovieRecommendationStatus,
  useDeleteMovieRecommendation,
  useUpdateSenderNote,
  useUpdateRecipientNote,
} from "../../hooks/useMovieQueries";
import { useMovieRecommendationsData } from "../../hooks/useMovieRecommendationsData";

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

function DashboardRecommendationsComponent() {
  // Use data transformation hook - returns fully-shaped data ready for rendering
  const {
    hits,
    misses,
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
      logger.error("Failed to update movie recommendation", error);
    }
  };

  const updateSenderComment = async (recId: string, senderComment: string) => {
    try {
      await updateSenderNoteMutation.mutateAsync({
        recId,
        note: senderComment,
      });
    } catch (error) {
      logger.error("Failed to update sender comment", error);
    }
  };

  const deleteRecommendation = async (recId: string) => {
    try {
      await deleteRecMutation.mutateAsync(recId);
    } catch (error) {
      logger.error("Failed to delete movie recommendation", error);
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
              loading="lazy"
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
                  <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded whitespace-nowrap">
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

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="space-y-4 sm:space-y-6">
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
          sent={[]}
          showSent={false}
          friendRecommendations={friendRecommendations}
          renderRecommendationCard={renderRecommendationCard}
        />
      </div>
    </div>
  );
}

export const DashboardRecommendations = React.memo(
  DashboardRecommendationsComponent
);
