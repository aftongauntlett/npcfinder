import React, { useState, useMemo } from "react";
import { Music as MusicIcon, Headphones, Video } from "lucide-react";
import SendMediaModal from "../shared/SendMediaModal";
import { searchMusic } from "../../utils/mediaSearchAdapters";
import MediaRecommendationCard from "../shared/MediaRecommendationCard";
import {
  MediaRecommendationsLayout,
  BaseRecommendation,
} from "../shared/MediaRecommendationsLayout";
import {
  useFriendsWithMusicRecs,
  useMusicStats,
  useMusicRecommendations,
  useUpdateRecommendationStatus,
  useDeleteRecommendation,
  useUpdateSenderNote,
} from "../../hooks/useMusicQueries";

// Extend BaseRecommendation with music-specific fields
interface MusicRecommendation extends BaseRecommendation {
  artist: string | null;
  album?: string | null;
  media_type: string;
  year: number | null;
  recommendation_type: "listen" | "watch" | "rewatch" | "relisten" | "study";
  poster_url: string | null;
  // Override with music-specific status types
  status: "pending" | "listened" | "hit" | "miss";
  consumed_at?: string | null; // Music-specific timestamp field
  opened_at: string | null; // When recipient first viewed this recommendation
  sender_note: string | null; // Sender's own note about this recommendation
  recipient_note: string | null; // Recipient's note
  sender_comment: string | null; // Required by MediaRecommendationCard
}

/**
 * Music Recommendations Dashboard
 * Calm, friend-based music sharing - discover new music through trusted recommendations
 */
const Music: React.FC = () => {
  // Local UI state (must be declared before using in hooks)
  const [selectedView, setSelectedView] = useState<
    "overview" | "friend" | "hits" | "misses" | "sent"
  >("overview");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);

  // TanStack Query hooks for data fetching
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithMusicRecs();
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useMusicStats();
  const { data: rawRecommendations = [], isLoading: recsLoading } =
    useMusicRecommendations(selectedView, selectedFriendId ?? undefined);

  // TanStack Query mutations
  const updateStatusMutation = useUpdateRecommendationStatus();
  const deleteRecMutation = useDeleteRecommendation();
  const updateSenderNoteMutation = useUpdateSenderNote();

  // Transform raw recommendations to component format with useMemo
  const recommendations: MusicRecommendation[] = useMemo(() => {
    return rawRecommendations.map((rec) => ({
      ...rec,
      sent_message: rec.sent_message || null,
      comment: rec.recipient_note || null,
      sender_comment: rec.sender_note || null,
      sender_note: rec.sender_note || null,
      recipient_note: rec.recipient_note || null,
      sent_at: rec.created_at,
      artist: rec.artist || null,
      album: rec.album || null,
      year: rec.year || null,
      poster_url: rec.poster_url || null,
      consumed_at: rec.watched_at || null,
      opened_at: rec.opened_at || null,
      status:
        rec.status === "consumed" || rec.status === "watched"
          ? "listened"
          : rec.status,
    }));
  }, [rawRecommendations]);

  const loading = friendsLoading || recsLoading;

  // Handle view changes
  const handleViewChange = (
    view: "overview" | "friend" | "hits" | "misses" | "sent",
    friendId?: string
  ) => {
    setSelectedView(view);
    setSelectedFriendId(friendId || null);
  };

  // Mark a recommendation as listened/hit/miss using mutation
  const updateRecommendationStatus = async (
    recId: string,
    status: string,
    _comment?: string
  ) => {
    await updateStatusMutation.mutateAsync({ recId, status });
  };

  // Delete (unsend) a recommendation using mutation
  const deleteRecommendation = async (recId: string) => {
    await deleteRecMutation.mutateAsync(recId);
  };

  // Update sender note using mutation
  const updateSenderComment = async (recId: string, senderComment: string) => {
    await updateSenderNoteMutation.mutateAsync({ recId, note: senderComment });
  };

  // Render a music recommendation card
  const renderRecommendationCard = (
    rec: MusicRecommendation,
    isReceived: boolean
  ) => {
    const index = recommendations.indexOf(rec);

    return (
      <MediaRecommendationCard
        key={rec.id}
        rec={rec}
        index={index}
        isReceived={isReceived}
        onStatusUpdate={updateRecommendationStatus}
        onDelete={deleteRecommendation}
        onUpdateSenderComment={updateSenderComment}
        getCopyText={(r) => {
          const musicRec = r as unknown as MusicRecommendation;
          return `${musicRec.title} - ${musicRec.artist}`;
        }}
        renderMediaArt={(r) => {
          const musicRec = r as unknown as MusicRecommendation;
          return musicRec.poster_url ? (
            <img
              src={musicRec.poster_url}
              alt={musicRec.title}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <MusicIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(r) => {
          const musicRec = r as unknown as MusicRecommendation;
          return (
            <>
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {musicRec.title}
                </div>
                {musicRec.recommendation_type === "watch" && (
                  <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                    <Video className="w-3 h-3" />
                    Watch
                  </span>
                )}
                {musicRec.recommendation_type === "listen" && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                    <Headphones className="w-3 h-3" />
                    Listen
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {musicRec.artist}
                {musicRec.album && ` • ${musicRec.album}`}
                {musicRec.year && ` • ${musicRec.year}`}
              </div>
            </>
          );
        }}
      />
    );
  };

  return (
    <>
      <MediaRecommendationsLayout
        mediaType="Music"
        mediaIcon={MusicIcon}
        emptyMessage="No music recommendations yet"
        emptySubMessage="When friends share music with you, it'll show up here"
        queueLabel="Listening Queue"
        consumedLabel="Listened"
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

      {/* Send Music Modal */}
      <SendMediaModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSent={() => {
          // TanStack Query auto-invalidates and refetches data
        }}
        mediaType="music"
        tableName="music_recommendations"
        searchPlaceholder="Search for songs, albums, or artists..."
        searchFunction={searchMusic}
        recommendationTypes={[
          { value: "listen", label: "Listen" },
          { value: "watch", label: "Watch" },
        ]}
        defaultRecommendationType="listen"
      />
    </>
  );
};

export default Music;
