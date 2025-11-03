import React, { useState, useMemo } from "react";
import { Clapperboard, Tv as TvIcon } from "lucide-react";
import SendMediaModal from "../../shared/SendMediaModal";
import { searchMoviesAndTV } from "../../../utils/mediaSearchAdapters";
import MediaRecommendationCard from "../../shared/MediaRecommendationCard";
import GroupedSentMediaCard from "../../shared/GroupedSentMediaCard";
import {
  InlineRecommendationsLayout,
  BaseRecommendation,
} from "../../shared/InlineRecommendationsLayout";
import ContentLayout from "../../layouts/ContentLayout";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../../contexts/AuthContext";
import {
  useFriendsWithMovieRecs,
  useMovieStats,
  useMovieRecommendations,
  useUpdateMovieRecommendationStatus,
  useDeleteMovieRecommendation,
  useUpdateSenderNote,
  useUpdateRecipientNote,
} from "../../../hooks/useMovieQueries";
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
  const { user } = useAuth();

  // TanStack Query hooks
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithMovieRecs();
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useMovieStats();

  // Fetch all recommendation types
  const { data: hitsData = [] } = useMovieRecommendations("hits");
  const { data: missesData = [] } = useMovieRecommendations("misses");
  const { data: sentData = [] } = useMovieRecommendations("sent");
  const { data: pendingData = [] } = useMovieRecommendations("queue");

  const loading = friendsLoading;

  // Create name lookup map from all data sources
  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();

    // Add senders from friends list
    friendsWithRecs.forEach((friend) => {
      map.set(friend.user_id, friend.display_name);
    });

    // Add names from hits data (sender_name)
    hitsData.forEach((rec: any) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add names from misses data (sender_name)
    missesData.forEach((rec: any) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add names from pending data (sender_name)
    pendingData.forEach((rec: any) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add recipients from sent data (recipient_name)
    sentData.forEach((rec: any) => {
      if (rec.recipient_name && rec.to_user_id) {
        map.set(rec.to_user_id, rec.recipient_name);
      }
    });

    return map;
  }, [friendsWithRecs, hitsData, missesData, pendingData, sentData]);

  // Filter out self from friends list
  const filteredFriendsWithRecs = useMemo(() => {
    if (!user) return friendsWithRecs;
    return friendsWithRecs.filter((friend) => friend.user_id !== user.id);
  }, [friendsWithRecs, user]);

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

  const renderGroupedSentCard = (
    mediaItem: MovieRecommendation,
    _recipients: Array<{ name: string; recId: string; status: string }>,
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

  // Transform data for inline layout
  const hits: MovieRecommendation[] = (hitsData || []).map((rec: any) => ({
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
    status: "hit" as const,
  }));

  const misses: MovieRecommendation[] = (missesData || []).map((rec: any) => ({
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
    status: "miss" as const,
  }));

  const sent: MovieRecommendation[] = (sentData || []).map((rec: any) => ({
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

  // Build friend recommendations map from pending data
  const friendRecommendations = new Map<string, MovieRecommendation[]>();

  // Transform pending data
  const pendingRecs: MovieRecommendation[] = (pendingData || []).map(
    (rec: any) => ({
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
      status: "pending" as const,
    })
  );

  // Group by sender
  pendingRecs.forEach((rec) => {
    const senderId = rec.from_user_id;
    if (!friendRecommendations.has(senderId)) {
      friendRecommendations.set(senderId, []);
    }
    friendRecommendations.get(senderId)!.push(rec);
  });

  const content = (
    <>
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
    </>
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
