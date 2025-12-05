import React, { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import {
  SendMediaModal,
  MediaRecommendationCard,
  GroupedSentMediaCard,
  InlineRecommendationsLayout,
  type BaseRecommendation,
} from "@/components/shared";
import { logger } from "@/lib/logger";
import { searchBooks } from "../../../utils/bookSearchAdapters";
import ContentLayout from "../../layouts/ContentLayout";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../../contexts/AuthContext";
import BookDiscoveryCard from "./BookDiscoveryCard";
import {
  useFriendsWithBookRecs,
  useBookStats,
  useBookRecommendations,
  useUpdateBookRecommendationStatus,
  useDeleteBookRecommendation,
  useUpdateSenderNote,
  useUpdateRecipientNote,
} from "../../../hooks/useBookQueries";

// Extend BaseRecommendation with book-specific fields
interface BookRecommendation extends BaseRecommendation {
  authors: string | null;
  published_date: string | null;
  description: string | null;
  thumbnail_url: string | null;
  isbn: string | null;
  page_count: number | null;
  status: "pending" | "read" | "hit" | "miss";
  read_at: string | null;
  created_at: string;
  sender_comment: string | null;
}

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
  const { user } = useAuth();

  // TanStack Query hooks - these will be implemented when we create the database
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithBookRecs();
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useBookStats();

  // Fetch all recommendation types
  const { data: hitsData = [] } = useBookRecommendations("hits");
  const { data: missesData = [] } = useBookRecommendations("misses");
  const { data: sentData = [] } = useBookRecommendations("sent");
  const { data: pendingData = [] } = useBookRecommendations("queue");

  const loading = friendsLoading;

  // Create name lookup map from all data sources
  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();

    // Add senders from friends list
    friendsWithRecs.forEach((friend) => {
      map.set(friend.user_id, friend.display_name);
    });

    // Add names from hits data (sender_name)
    hitsData.forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add names from misses data (sender_name)
    missesData.forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add names from pending data (sender_name)
    pendingData.forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add recipients from sent data (recipient_name)
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
    rec: BookRecommendation,
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
    mediaItem: BookRecommendation,
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

  // Transform data for inline layout
  const hits: BookRecommendation[] = (hitsData || []).map((rec) => ({
    ...rec,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sent_at: rec.created_at,
    thumbnail_url: rec.poster_url ?? null,
    read_at: rec.watched_at ?? null,
    consumed_at: rec.watched_at ?? null,
    description: rec.overview ?? null,
    published_date: rec.release_date ?? null,
    authors: rec.artist ?? null,
    isbn: null, // Not in base Recommendation
    page_count: null, // Not in base Recommendation
    poster_url: rec.poster_url ?? null,
    status: "hit" as const,
  }));

  const misses: BookRecommendation[] = (missesData || []).map((rec) => ({
    ...rec,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sent_at: rec.created_at,
    thumbnail_url: rec.poster_url ?? null,
    read_at: rec.watched_at ?? null,
    consumed_at: rec.watched_at ?? null,
    description: rec.overview ?? null,
    published_date: rec.release_date ?? null,
    authors: rec.artist ?? null,
    isbn: null,
    page_count: null,
    poster_url: rec.poster_url ?? null,
    status: "miss" as const,
  }));

  const sent: BookRecommendation[] = (sentData || []).map((rec) => ({
    ...rec,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sent_at: rec.created_at,
    thumbnail_url: rec.poster_url ?? null,
    read_at: rec.watched_at ?? null,
    consumed_at: rec.watched_at ?? null,
    description: rec.overview ?? null,
    published_date: rec.release_date ?? null,
    authors: rec.artist ?? null,
    isbn: null,
    page_count: null,
    poster_url: rec.poster_url ?? null,
    status:
      rec.status === "consumed" || rec.status === "watched"
        ? "read"
        : rec.status,
  }));

  // Build friend recommendations map from pending data
  const friendRecommendations = new Map<string, BookRecommendation[]>();

  // Transform pending data
  const pendingRecs: BookRecommendation[] = (pendingData || []).map((rec) => ({
    ...rec,
    sent_message: rec.sent_message ?? null,
    comment: rec.recipient_note ?? null,
    sender_comment: rec.sender_note ?? null,
    sent_at: rec.created_at,
    thumbnail_url: rec.poster_url ?? null,
    read_at: rec.watched_at ?? null,
    consumed_at: rec.watched_at ?? null,
    description: rec.overview ?? null,
    published_date: rec.release_date ?? null,
    authors: rec.artist ?? null,
    isbn: null,
    page_count: null,
    poster_url: rec.poster_url ?? null,
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

  const content = (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="space-y-4 sm:space-y-6">
        <InlineRecommendationsLayout
          mediaType="Books"
          mediaIcon={BookOpen}
          emptyMessage="No recommendations yet"
          emptySubMessage="When friends recommend books, they'll show up here"
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
