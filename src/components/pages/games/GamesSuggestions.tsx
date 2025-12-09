import React, { useState } from "react";
import { Gamepad2 } from "lucide-react";
import {
  SendMediaModal,
  MediaRecommendationCard,
  GroupedSentMediaCard,
  InlineRecommendationsLayout,
} from "@/components/shared";
import { logger } from "@/lib/logger";
import { searchGames } from "../../../utils/mediaSearchAdapters";
import ContentLayout from "../../layouts/ContentLayout";
import MainLayout from "../../layouts/MainLayout";
import {
  useUpdateGameRecommendationStatus,
  useDeleteGameRecommendation,
  useUpdateSenderNote,
  useUpdateRecipientNote,
} from "../../../hooks/useGameQueries";
import { useGameRecommendationsData } from "../../../hooks/useGameRecommendationsData";

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

  // Use centralized data hook
  const {
    hits,
    misses,
    sent,
    queue: _queue,
    friendRecommendations,
    friendsWithRecs,
    quickStats,
    userNameMap,
    loading,
  } = useGameRecommendationsData();

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
      logger.error("Failed to update game recommendation", error);
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
      logger.error("Failed to delete game recommendation", error);
    }
  };

  const renderRecommendationCard = (
    rec: {
      id: string;
      title: string;
      from_user_id: string;
      to_user_id: string;
      external_id: string;
      status: string;
      sent_message: string | null;
      comment: string | null;
      sender_comment: string | null;
      sent_at: string;
      background_image?: string | null;
      platforms?: string | null;
      released?: string | null;
    },
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
        renderMediaArt={(r: typeof rec) => {
          return r.background_image ? (
            <img
              src={r.background_image}
              alt={r.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <Gamepad2 className="w-12 h-12 text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(r: typeof rec) => {
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
    mediaItem: {
      id: string;
      title: string;
      external_id: string;
      status: string;
      sent_message: string | null;
      comment: string | null;
      sender_comment: string | null;
      sent_at: string;
      from_user_id: string;
      to_user_id: string;
      background_image?: string | null;
      platforms?: string | null;
      released?: string | null;
    },
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
              loading="lazy"
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
    <div className="container mx-auto px-4 sm:px-6">
      <InlineRecommendationsLayout
        mediaType="Games"
        mediaIcon={Gamepad2}
        emptyMessage="No game recommendations yet"
        emptySubMessage="When friends recommend games, they'll show up here"
        loading={loading}
        friendsWithRecs={friendsWithRecs}
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
