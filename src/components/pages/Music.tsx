import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Music as MusicIcon, Headphones, Video } from "lucide-react";
import SendMediaModal from "../shared/SendMediaModal";
import { searchMusic } from "../../utils/mediaSearchAdapters";
import MediaRecommendationCard from "../shared/MediaRecommendationCard";
import {
  MediaRecommendationsLayout,
  BaseRecommendation,
  FriendSummary,
} from "../shared/MediaRecommendationsLayout";
import * as recommendationsService from "../../services/recommendationsService";
import type { Recommendation } from "../../data/mockData";

// Extend BaseRecommendation with music-specific fields
interface MusicRecommendation extends BaseRecommendation {
  artist: string | null;
  album: string | null;
  media_type: string;
  year: number | null;
  recommendation_type: "listen" | "watch" | "rewatch" | "relisten";
  poster_url: string | null;
  // Override with music-specific status types
  status: "pending" | "listened" | "hit" | "miss";
  consumed_at: string | null; // Music-specific timestamp field
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [friendsWithRecs, setFriendsWithRecs] = useState<FriendSummary[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, string>>(
    new Map()
  ); // user_id -> display_name
  const [selectedView, setSelectedView] = useState<
    "overview" | "friend" | "hits" | "misses" | "sent"
  >("overview");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MusicRecommendation[]>(
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

      // Use service layer to get friends with stats
      const friends =
        await recommendationsService.getFriendsWithRecommendations("song");
      setFriendsWithRecs(friends);

      // Get quick stats
      const stats = await recommendationsService.getQuickStats("song");
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
            "song"
          );
        } else if (view === "hits") {
          // Show all hits from any friend
          data = await recommendationsService.getRecommendations({
            direction: "received",
            status: "hit",
            mediaType: "song",
          });
        } else if (view === "misses") {
          // Show all misses from any friend
          data = await recommendationsService.getRecommendations({
            direction: "received",
            status: "miss",
            mediaType: "song",
          });
        } else if (view === "sent") {
          // Show all recs sent by this user
          data = await recommendationsService.getRecommendations({
            direction: "sent",
            mediaType: "song",
          });
        }

        // Map mock data to Music component's expected format
        const mappedData: MusicRecommendation[] = data.map((rec) => ({
          ...rec,
          // Map mockData fields to component fields
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
          consumed_at: rec.consumed_at || null,
          opened_at: rec.opened_at || null,
          // Map 'consumed' status to 'listened' for music
          status: rec.status === "consumed" ? "listened" : rec.status,
        }));

        setRecommendations(mappedData);

        // Load user profiles for senders (when viewing received items)
        if (
          data.length > 0 &&
          (view === "friend" || view === "hits" || view === "misses")
        ) {
          const senderIds = [
            ...new Set(data.map((rec: Recommendation) => rec.from_user_id)),
          ];
          const profileMap = recommendationsService.getUserProfiles(senderIds);
          setUserProfiles(profileMap);
        }

        // Mark as opened when viewing friend recommendations (received items)
        if (view === "friend" && friendId && data.length > 0) {
          const currentUserId = recommendationsService.getCurrentUserId();
          const unopenedIds = data
            .filter(
              (rec: Recommendation) =>
                !rec.opened_at && rec.to_user_id === currentUserId
            )
            .map((rec: Recommendation) => rec.id);

          if (unopenedIds.length > 0) {
            // Mark as opened (fire and forget - don't wait)
            void recommendationsService.markRecommendationsAsOpened(
              unopenedIds
            );
          }
        }
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

  // Mark a recommendation as listened/hit/miss
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
                status: status as MusicRecommendation["status"],
                comment: comment || rec.comment,
              }
            : rec
        )
      );

      // Update status and optionally add recipient note
      await recommendationsService.updateRecommendationStatus(
        recId,
        status as "pending" | "consumed" | "hit" | "miss",
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

      console.log("✅ [Music] Delete successful, refreshing data...");

      // Refresh friend counts AND quick stats
      await loadFriendsWithRecommendations();

      // Refresh the current view
      if (selectedView === "friend" && selectedFriendId) {
        await loadRecommendations("friend", selectedFriendId);
      } else {
        await loadRecommendations(selectedView);
      }

      console.log("✅ [Music] Data refreshed after delete");
    } catch (error) {
      console.error("❌ [Music] Error deleting recommendation:", error);
    }
  };

  const updateSenderComment = async (recId: string, senderComment: string) => {
    try {
      console.log("💾 [Music] Updating sender comment", {
        recId,
        senderComment,
      });

      await recommendationsService.updateSenderNote(recId, senderComment);

      console.log("✅ [Music] Sender comment updated successfully");

      // Update local state
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === recId
            ? {
                ...rec,
                sender_note: senderComment,
                sender_comment: senderComment,
              }
            : rec
        )
      );
    } catch (error) {
      console.error("❌ [Music] Error updating sender comment:", error);
    }
  };

  // Render a music recommendation card
  const renderRecommendationCard = (
    rec: MusicRecommendation,
    isReceived: boolean
  ) => {
    const index = recommendations.indexOf(rec);
    const senderName = isReceived
      ? userProfiles.get(rec.from_user_id) || "Friend"
      : undefined;

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
        mediaIcon={
          <MusicIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        }
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
          // Refresh the data after sending
          void loadFriendsWithRecommendations();
          if (selectedView !== "overview") {
            void loadRecommendations(
              selectedView,
              selectedFriendId || undefined
            );
          }
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
