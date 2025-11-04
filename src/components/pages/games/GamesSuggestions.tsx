import React, { useState, useMemo } from "react";
import { Gamepad2 } from "lucide-react";
import SendMediaModal from "../../shared/SendMediaModal";
import { searchGames } from "../../../utils/mediaSearchAdapters";
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
  useFriendsWithGameRecs,
  useGameStats,
  useGameRecommendations,
  useUpdateGameRecommendationStatus,
  useDeleteGameRecommendation,
  useUpdateSenderNote,
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
    [...hitsData, ...missesData, ...pendingData].forEach((rec: any) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add recipients from sent data
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
  const updateStatusMutation = useUpdateGameRecommendationStatus();
  const deleteRecMutation = useDeleteGameRecommendation();
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

  // Transform data to GameRecommendation format
  const hits: GameRecommendation[] = (hitsData || []).map((rec: any) => ({
    ...rec,
    sent_message: rec.sent_message || null,
    comment: rec.recipient_note || null,
    sender_comment: rec.sender_note || null,
    sender_note: rec.sender_note || null,
    recipient_note: rec.recipient_note || null,
    sent_at: rec.created_at,
    status: rec.status === "consumed" ? "played" : rec.status,
  }));

  const misses: GameRecommendation[] = (missesData || []).map((rec: any) => ({
    ...rec,
    sent_message: rec.sent_message || null,
    comment: rec.recipient_note || null,
    sender_comment: rec.sender_note || null,
    sender_note: rec.sender_note || null,
    recipient_note: rec.recipient_note || null,
    sent_at: rec.created_at,
    status: rec.status === "consumed" ? "played" : rec.status,
  }));

  const sent: GameRecommendation[] = (sentData || []).map((rec: any) => ({
    ...rec,
    sent_message: rec.sent_message || null,
    comment: rec.recipient_note || null,
    sender_comment: rec.sender_note || null,
    sender_note: rec.sender_note || null,
    recipient_note: rec.recipient_note || null,
    sent_at: rec.created_at,
    status: rec.status === "consumed" ? "played" : rec.status,
  }));

  // Build friend recommendations map from pending data
  const friendRecommendations = new Map<string, GameRecommendation[]>();

  // Transform pending data
  const pendingRecs: GameRecommendation[] = (pendingData || []).map(
    (rec: any) => ({
      ...rec,
      sent_message: rec.sent_message || null,
      comment: rec.recipient_note || null,
      sender_comment: rec.sender_note || null,
      sender_note: rec.sender_note || null,
      recipient_note: rec.recipient_note || null,
      sent_at: rec.created_at,
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

  const renderRecommendationCard = (
    rec: BaseRecommendation,
    isReceived: boolean,
    index = 0
  ) => {
    const gameRec = rec as unknown as GameRecommendation;
    const senderName = userNameMap.get(gameRec.from_user_id) || "Unknown";

    return (
      <MediaRecommendationCard
        key={gameRec.id}
        rec={gameRec}
        index={index}
        isReceived={isReceived}
        senderName={senderName}
        onStatusUpdate={updateRecommendationStatus}
        onDelete={deleteRecommendation}
        onUpdateSenderComment={updateSenderComment}
        renderMediaArt={(r) => {
          const rec = r as unknown as GameRecommendation;
          return rec.background_image ? (
            <img
              src={rec.background_image}
              alt={rec.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <Gamepad2 className="w-12 h-12 text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(r) => {
          const rec = r as unknown as GameRecommendation;
          return (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {rec.platforms || "Game"}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {rec.title}
              </h3>
              {rec.released && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(rec.released).getFullYear()}
                </div>
              )}
            </>
          );
        }}
      />
    );
  };

  const renderGroupedSentCard = (
    mediaItem: BaseRecommendation,
    _recipients: Array<{ name: string; recId: string; status: string }>,
    index: number
  ) => {
    const gameItem = mediaItem as unknown as GameRecommendation;

    // Find all sent items with the same external_id to get all recipients
    const allRecipients = sent
      .filter((rec) => rec.external_id === gameItem.external_id)
      .map((rec) => ({
        name: userNameMap.get(rec.to_user_id) || "Unknown User",
        recId: rec.id,
        status: rec.status,
      }));

    return (
      <GroupedSentMediaCard
        key={`grouped-${gameItem.external_id}`}
        mediaItem={gameItem}
        recipients={allRecipients}
        index={index}
        onDelete={deleteRecommendation}
        renderMediaArt={(item) => {
          const gameRec = item as unknown as GameRecommendation;
          return gameRec.background_image ? (
            <img
              src={gameRec.background_image}
              alt={gameRec.title}
              className="w-20 h-20 rounded object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(item) => {
          const gameRec = item as unknown as GameRecommendation;
          return (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {gameRec.platforms || "Game"}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {gameRec.title}
              </h3>
              {gameRec.released && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(gameRec.released).getFullYear()}
                </div>
              )}
            </>
          );
        }}
      />
    );
  };

  const content = (
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
