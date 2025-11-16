import { useState, useMemo } from "react";
import { Music as MusicIcon, Headphones, Video } from "lucide-react";
import {
  SendMediaModal,
  MediaRecommendationCard,
  MediaRecommendationsLayout,
} from "@/components/shared";
import { searchMusic } from "../../utils/mediaSearchAdapters";
import type { BaseRecommendation } from "../shared/types";
import {
  useFriendsWithMusicRecs,
  useMusicStats,
  useMusicRecommendations,
  useUpdateRecommendationStatus,
  useDeleteRecommendation,
  useUpdateSenderNote,
} from "../../hooks/useMusicQueries";

// Music-specific recommendation type extending base
interface MusicRecommendation extends BaseRecommendation {
  artist: string;
  album?: string;
  year?: number;
  media_type: "song" | "album";
  recommendation_type: "listen" | "watch" | "rewatch" | "relisten" | "study";
  status: "pending" | "listened" | "hit" | "miss";
  sender_comment: string | null;
}

// Calm, friend-based music sharing - discover new music through trusted recommendations
const Music = () => {
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

  // Transform raw recommendations to music-specific format
  const recommendations: MusicRecommendation[] = useMemo(() => {
    return rawRecommendations.map((rec) => {
      return {
        ...rec,
        sent_message: rec.sent_message || null,
        comment: rec.recipient_note || null,
        sender_comment: rec.sender_note || null,
        sent_at: rec.created_at,
        artist: rec.artist || "",
        album: rec.album,
        year: rec.year,
        poster_url: rec.poster_url || null,
        consumed_at: rec.watched_at || null,
        opened_at: rec.opened_at || null,
        media_type: rec.media_type || "song",
        status:
          rec.status === "consumed" || rec.status === "watched"
            ? ("listened" as const)
            : rec.status,
      };
    });
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
        renderMediaArt={(r: MusicRecommendation) => {
          return r.poster_url ? (
            <img
              src={r.poster_url}
              alt={r.title}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <MusicIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(r: MusicRecommendation) => {
          return (
            <>
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {r.title}
                </div>
                {r.recommendation_type === "watch" && (
                  <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                    <Video className="w-3 h-3" />
                    Watch
                  </span>
                )}
                {r.recommendation_type === "listen" && (
                  <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded whitespace-nowrap">
                    <Headphones className="w-3 h-3" />
                    Listen
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {r.artist}
                {r.album && ` • ${r.album}`}
                {r.year && ` • ${r.year}`}
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
