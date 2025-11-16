import React, { useState, useMemo } from "react";
import { Music as MusicIcon } from "lucide-react";
import {
  SendMediaModal,
  MediaRecommendationCard,
  GroupedSentMediaCard,
  InlineRecommendationsLayout,
  type BaseRecommendation,
} from "@/components/shared";
import { searchMusic } from "../../../utils/mediaSearchAdapters";
import ContentLayout from "../../layouts/ContentLayout";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../../contexts/AuthContext";
import {
  useFriendsWithMusicRecs,
  useMusicStats,
  useMusicRecommendations,
  useUpdateRecommendationStatus,
  useDeleteRecommendation,
  useUpdateSenderNote,
} from "../../../hooks/useMusicQueries";

// Extend BaseRecommendation with music-specific fields
interface MusicRecommendation extends BaseRecommendation {
  artist: string | null;
  album: string | null;
  media_type: "song" | "album" | "playlist";
  release_date: string | null;
  preview_url: string | null;
  poster_url?: string | null;
  status: "pending" | "listened" | "hit" | "miss";
  consumed_at: string | null;
  created_at: string;
  sender_note: string | null;
  recipient_note: string | null;
  sender_comment: string | null;
}

/**
 * Music Suggestions Component
 * Shows music recommendations from friends


/**
 * Music Suggestions Component
 * Shows music recommendations from friends
 * Matches pattern from BooksSuggestions
 */
interface MusicSuggestionsProps {
  embedded?: boolean;
}

const MusicSuggestions: React.FC<MusicSuggestionsProps> = ({
  embedded = false,
}) => {
  const [showSendModal, setShowSendModal] = useState(false);
  const { user } = useAuth();

  // TanStack Query hooks
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithMusicRecs();
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useMusicStats();

  // Fetch all recommendation types
  const { data: hitsData = [] } = useMusicRecommendations("hits");
  const { data: missesData = [] } = useMusicRecommendations("misses");
  const { data: sentData = [] } = useMusicRecommendations("sent");
  const { data: pendingData = [] } = useMusicRecommendations("queue");

  const loading = friendsLoading;

  // Create name lookup map from all data sources
  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();

    // Add senders from friends list
    friendsWithRecs.forEach((friend) => {
      map.set(friend.user_id, friend.display_name);
    });

    // Add names from all rec data
    [...hitsData, ...missesData, ...pendingData].forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add recipients from sent data
    sentData.forEach((rec) => {
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
  const updateStatusMutation = useUpdateRecommendationStatus();
  const deleteRecMutation = useDeleteRecommendation();
  const updateSenderNoteMutation = useUpdateSenderNote();

  const updateRecommendationStatus = async (
    recId: string,
    status: string,
    _comment?: string
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        recId,
        status,
      });
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

  // Transform data to MusicRecommendation format (add UI-required fields)
  const hits: MusicRecommendation[] = (hitsData || []).map((rec) => ({
    ...rec,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sender_note: rec.sender_note ?? null,
    recipient_note: rec.recipient_note ?? null,
    sent_at: rec.created_at,
    artist: rec.artist ?? null,
    album: rec.album ?? null,
    media_type: rec.media_type || "song",
    release_date: rec.release_date ?? null,
    preview_url: null, // Not provided by service
    consumed_at: rec.watched_at ?? null,
    status:
      rec.status === "consumed" || rec.status === "watched"
        ? "listened"
        : rec.status,
  }));

  const misses: MusicRecommendation[] = (missesData || []).map((rec) => ({
    ...rec,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sender_note: rec.sender_note ?? null,
    recipient_note: rec.recipient_note ?? null,
    sent_at: rec.created_at,
    artist: rec.artist ?? null,
    album: rec.album ?? null,
    media_type: rec.media_type || "song",
    release_date: rec.release_date ?? null,
    preview_url: null,
    consumed_at: rec.watched_at ?? null,
    status:
      rec.status === "consumed" || rec.status === "watched"
        ? "listened"
        : rec.status,
  }));

  const sent: MusicRecommendation[] = (sentData || []).map((rec) => ({
    ...rec,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sender_note: rec.sender_note ?? null,
    recipient_note: rec.recipient_note ?? null,
    sent_at: rec.created_at,
    artist: rec.artist ?? null,
    album: rec.album ?? null,
    media_type: rec.media_type || "song",
    release_date: rec.release_date ?? null,
    preview_url: null,
    consumed_at: rec.watched_at ?? null,
    status:
      rec.status === "consumed" || rec.status === "watched"
        ? "listened"
        : rec.status,
  }));

  // Build friend recommendations map from pending data
  const friendRecommendations = new Map<string, MusicRecommendation[]>();

  // Transform pending data
  const pendingRecs: MusicRecommendation[] = (pendingData || []).map((rec) => ({
    ...rec,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sender_note: rec.sender_note ?? null,
    recipient_note: rec.recipient_note ?? null,
    sent_at: rec.created_at,
    artist: rec.artist ?? null,
    album: rec.album ?? null,
    media_type: rec.media_type || "song",
    release_date: rec.release_date ?? null,
    preview_url: null,
    consumed_at: rec.watched_at ?? null,
    status: "pending" as const,
  }));

  // Group by sender
  pendingRecs.forEach((rec) => {
    const senderId = rec.from_user_id;
    if (!friendRecommendations.has(senderId)) {
      friendRecommendations.set(senderId, []);
    }
    friendRecommendations.get(senderId)!.push(rec);
  });

  const renderRecommendationCard = (
    rec: MusicRecommendation,
    isReceived: boolean,
    index = 0
  ) => {
    const senderName = userNameMap.get(rec.from_user_id) || "Unknown";

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
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {r.title}
              </div>
              {r.artist && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {r.artist}
                </div>
              )}
              {r.album && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {r.album}
                </div>
              )}
              {r.release_date && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(r.release_date).getFullYear()}
                </div>
              )}
            </>
          );
        }}
      />
    );
  };

  const renderGroupedSentCard = (
    mediaItem: MusicRecommendation,
    index: number
  ) => {
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
          const musicRec = item;
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
        renderMediaInfo={(item) => {
          const musicRec = item;
          return (
            <>
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {musicRec.title}
              </div>
              {musicRec.artist && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {musicRec.artist}
                </div>
              )}
              {musicRec.album && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {musicRec.album}
                </div>
              )}
              {musicRec.release_date && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(musicRec.release_date).getFullYear()}
                </div>
              )}
            </>
          );
        }}
      />
    );
  };

  const content = (
    <>
      <div className="space-y-6">
        <InlineRecommendationsLayout
          mediaType="Music"
          mediaIcon={MusicIcon}
          emptyMessage="No recommendations yet"
          emptySubMessage="When friends recommend music, it'll show up here"
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
      </div>

      {/* Send Music Modal */}
      <SendMediaModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSent={() => {
          setShowSendModal(false);
        }}
        mediaType="music"
        tableName="music_recommendations"
        searchPlaceholder="Search for songs or albums..."
        searchFunction={searchMusic}
        recommendationTypes={[
          { value: "listen", label: "Listen" },
          { value: "watch", label: "Watch" },
          { value: "study", label: "Study" },
        ]}
        defaultRecommendationType="listen"
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
      <ContentLayout title="Music Recommendations">{content}</ContentLayout>
    </MainLayout>
  );
};

export default MusicSuggestions;
