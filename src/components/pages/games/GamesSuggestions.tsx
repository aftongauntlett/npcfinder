import React, { useState, useMemo } from "react";
import { Gamepad2 } from "lucide-react";
import {
  SendMediaModal,
  MediaRecommendationCard,
  GroupedSentMediaCard,
  InlineRecommendationsLayout,
  type BaseRecommendation,
} from "@/components/shared";
import { searchGames } from "../../../utils/mediaSearchAdapters";
import ContentLayout from "../../layouts/ContentLayout";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../../contexts/AuthContext";
import {
  useFriendsWithGameRecs,
  useGameStats,
  useGameRecommendations,
  useUpdateGameRecommendationStatus,
  useDeleteGameRecommendation,
  useUpdateSenderNote,
  useUpdateRecipientNote,
} from "../../../hooks/useGameQueries";

// Extend BaseRecommendation with game-specific fields
interface GameRecommendation extends BaseRecommendation {
  name: string;
  slug: string | null;
  platforms: string | null;
  genres: string | null;
  released: string | null;
  background_image: string | null;
  rating: number | null;
  metacritic: number | null;
  playtime: number | null;
  status: "pending" | "played" | "hit" | "miss";
  played_at: string | null;
  created_at: string;
  sender_comment: string | null;
}

/**
 * Games Suggestions Page
 * View and manage game recommendations from friends
 *
 * @param embedded - When true, hides outer MainLayout/ContentLayout (used in tabbed view)
 */
interface GamesSuggestionsProps {
  embedded?: boolean;
}

const GamesSuggestions: React.FC<GamesSuggestionsProps> = ({
  embedded = false,
}) => {
  const [showSendModal, setShowSendModal] = useState(false);
  const { user } = useAuth();

  // TanStack Query hooks
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithGameRecs();
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useGameStats();

  // Fetch all recommendation types
  const { data: hitsData = [] } = useGameRecommendations("hits");
  const { data: missesData = [] } = useGameRecommendations("misses");
  const { data: sentData = [] } = useGameRecommendations("sent");
  const { data: pendingData = [] } = useGameRecommendations("queue");

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
  const updateStatusMutation = useUpdateGameRecommendationStatus();
  const deleteRecMutation = useDeleteGameRecommendation();
  const updateSenderNoteMutation = useUpdateSenderNote();
  const updateRecipientNoteMutation = useUpdateRecipientNote();

  const updateRecommendationStatus = async (
    recId: string,
    status: string,
    comment?: string
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        recId,
        status,
      });

      // If comment is provided and not whitespace-only, update recipient's note
      if (typeof comment === "string" && comment.trim().length > 0) {
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

  // Type guard to ensure name exists
  function hasName<T extends { name?: string }>(
    r: T
  ): r is T & { name: string } {
    return !!r.name;
  }

  // Transform data to GameRecommendation format
  const hits = (hitsData || []).filter(hasName).map((rec) => ({
    ...rec,
    name: rec.name,
    slug: rec.slug ?? null,
    platforms: rec.platforms ?? null,
    genres: rec.genres ?? null,
    released: rec.released ?? null,
    background_image: rec.background_image ?? null,
    rating: rec.rating ?? null,
    metacritic: rec.metacritic ?? null,
    playtime: rec.playtime ?? null,
    played_at: rec.played_at ?? null,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sender_note: rec.sender_note ?? null,
    recipient_note: rec.recipient_note ?? null,
    sent_at: rec.created_at,
    status: (rec.status === "consumed"
      ? "played"
      : rec.status) as GameRecommendation["status"],
  }));

  const misses = (missesData || []).filter(hasName).map((rec) => ({
    ...rec,
    name: rec.name,
    slug: rec.slug ?? null,
    platforms: rec.platforms ?? null,
    genres: rec.genres ?? null,
    released: rec.released ?? null,
    background_image: rec.background_image ?? null,
    rating: rec.rating ?? null,
    metacritic: rec.metacritic ?? null,
    playtime: rec.playtime ?? null,
    played_at: rec.played_at ?? null,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sender_note: rec.sender_note ?? null,
    recipient_note: rec.recipient_note ?? null,
    sent_at: rec.created_at,
    status: (rec.status === "consumed"
      ? "played"
      : rec.status) as GameRecommendation["status"],
  }));

  const sent = (sentData || []).filter(hasName).map((rec) => ({
    ...rec,
    name: rec.name,
    slug: rec.slug ?? null,
    platforms: rec.platforms ?? null,
    genres: rec.genres ?? null,
    released: rec.released ?? null,
    background_image: rec.background_image ?? null,
    rating: rec.rating ?? null,
    metacritic: rec.metacritic ?? null,
    playtime: rec.playtime ?? null,
    played_at: rec.played_at ?? null,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sender_note: rec.sender_note ?? null,
    recipient_note: rec.recipient_note ?? null,
    sent_at: rec.created_at,
    status: (rec.status === "consumed"
      ? "played"
      : rec.status) as GameRecommendation["status"],
  }));

  // Build friend recommendations map from pending data
  const friendRecommendations = new Map<string, GameRecommendation[]>();

  // Transform pending data
  const pendingRecs = (pendingData || []).filter(hasName).map((rec) => ({
    ...rec,
    name: rec.name,
    slug: rec.slug ?? null,
    platforms: rec.platforms ?? null,
    genres: rec.genres ?? null,
    released: rec.released ?? null,
    background_image: rec.background_image ?? null,
    rating: rec.rating ?? null,
    metacritic: rec.metacritic ?? null,
    playtime: rec.playtime ?? null,
    played_at: rec.played_at ?? null,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sender_note: rec.sender_note ?? null,
    recipient_note: rec.recipient_note ?? null,
    sent_at: rec.created_at,
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
    rec: GameRecommendation,
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
        renderMediaArt={(r: GameRecommendation) => {
          return r.background_image ? (
            <img
              src={r.background_image}
              alt={r.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <Gamepad2 className="w-12 h-12 text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(r: GameRecommendation) => {
          return (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {r.platforms || "Game"}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {r.title}
              </h3>
              {r.released && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(r.released).getFullYear()}
                </div>
              )}
            </>
          );
        }}
      />
    );
  };

  const renderGroupedSentCard = (
    mediaItem: GameRecommendation,
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
          return item.background_image ? (
            <img
              src={item.background_image}
              alt={item.title}
              className="w-20 h-20 rounded object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(item) => {
          return (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {item.platforms || "Game"}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {item.title}
              </h3>
              {item.released && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(item.released).getFullYear()}
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
      <InlineRecommendationsLayout
        mediaType="Games"
        mediaIcon={Gamepad2}
        emptyMessage="No game recommendations yet"
        emptySubMessage="When friends recommend games, they'll show up here"
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
  );

  return (
    <>
      {embedded ? (
        content
      ) : (
        <MainLayout>
          <ContentLayout
            title="Game Recommendations"
            description="Share and receive game recommendations with friends"
          >
            {content}
          </ContentLayout>
        </MainLayout>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <SendMediaModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSent={() => setShowSendModal(false)}
          mediaType="games"
          tableName="game_recommendations"
          searchPlaceholder="Search for games..."
          searchFunction={searchGames}
          recommendationTypes={[
            { value: "play", label: "Play" },
            { value: "replay", label: "Replay" },
          ]}
          defaultRecommendationType="play"
        />
      )}
    </>
  );
};

export default GamesSuggestions;
