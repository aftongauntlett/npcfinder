import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import {
  SendMediaModal,
  MediaRecommendationCard,
  GroupedSentMediaCard,
  InlineRecommendationsLayout,
} from "@/components/shared";
import { logger } from "@/lib/logger";
import { searchBooks } from "../../../utils/bookSearchAdapters";
import ContentLayout from "../../layouts/ContentLayout";
import MainLayout from "../../layouts/MainLayout";
import BookDiscoveryCard from "./BookDiscoveryCard";
import {
  useUpdateBookRecommendationStatus,
  useDeleteBookRecommendation,
  useUpdateSenderNote,
  useUpdateRecipientNote,
} from "../../../hooks/useBookQueries";
import { useBookRecommendationsData } from "../../../hooks/useBookRecommendationsData";

/**
 * Books Suggestions Page
 * View and manage book recommendations from friends
 *
 * @param embedded - When true, hides outer MainLayout/ContentLayout (used in tabbed view)
 */
interface BooksSuggestionsProps {
  embedded?: boolean;
}

const BooksSuggestions: React.FC<BooksSuggestionsProps> = ({
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
  } = useBookRecommendationsData();

  // Mutations - these will be implemented when we create the database
  const updateStatusMutation = useUpdateBookRecommendationStatus();
  const deleteRecMutation = useDeleteBookRecommendation();
  const updateSenderNoteMutation = useUpdateSenderNote();
  const updateRecipientNoteMutation = useUpdateRecipientNote();

  const updateRecommendationStatus = async (
    recId: string,
    status: string,
    comment?: string
  ) => {
    try {
      const dbStatus = status === "consumed" ? "read" : status;
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
      logger.error("Failed to update book recommendation", error);
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
      logger.error("Failed to delete book recommendation", error);
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
      thumbnail_url?: string | null;
      authors?: string | null;
      published_date?: string | null;
      description?: string | null;
    },
    isReceived: boolean,
    index = 0
  ) => {
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
          const bookRec = r;
          return bookRec.thumbnail_url ? (
            <img
              src={bookRec.thumbnail_url}
              alt={bookRec.title}
              loading="lazy"
              className="w-12 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(r) => {
          const bookRec = r;
          return (
            <>
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {bookRec.title}
              </div>
              {bookRec.authors && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {bookRec.authors}
                </div>
              )}
              {bookRec.published_date && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {bookRec.published_date}
                </div>
              )}
              {bookRec.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {bookRec.description}
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
      thumbnail_url?: string | null;
      authors?: string | null;
      published_date?: string | null;
      description?: string | null;
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
          const bookRec = item;
          return bookRec.thumbnail_url ? (
            <img
              src={bookRec.thumbnail_url}
              alt={bookRec.title}
              loading="lazy"
              className="w-12 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(item) => {
          const bookRec = item;
          return (
            <>
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {bookRec.title}
              </div>
              {bookRec.authors && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {bookRec.authors}
                </div>
              )}
              {bookRec.published_date && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {bookRec.published_date}
                </div>
              )}
              {bookRec.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {bookRec.description}
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
      <div className="space-y-4 sm:space-y-6">
        <InlineRecommendationsLayout
          mediaType="Books"
          mediaIcon={BookOpen}
          emptyMessage="No recommendations yet"
          emptySubMessage="When friends recommend books, they'll show up here"
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

        <BookDiscoveryCard />
      </div>

      {/* Send Book Modal */}
      <SendMediaModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSent={() => {
          setShowSendModal(false);
        }}
        mediaType="books"
        tableName="book_recommendations"
        searchPlaceholder="Search for books..."
        searchFunction={searchBooks}
        recommendationTypes={[
          { value: "read", label: "Read" },
          { value: "listen", label: "Listen" },
        ]}
        defaultRecommendationType="read"
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
        description="Discover books recommended by your friends."
      >
        {content}
      </ContentLayout>
    </MainLayout>
  );
};

export default BooksSuggestions;
