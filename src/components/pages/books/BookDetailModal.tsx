import React, { useState } from "react";
import MediaDetailModal from "../../shared/media/MediaDetailModal";
import { MediaDetailsContent } from "@/components/shared";
import type { ReadingListItem } from "../../../services/booksService.types";
import {
  useUpdateBookRating,
  useUpdateBookNotes,
} from "../../../hooks/useReadingListQueries";
import type { MetadataItem } from "../../shared/common/MetadataRow";

type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";

interface BookDetailModalProps {
  book: ReadingListItem;
  onClose: () => void;
  onToggleRead: () => void;
  onRemove: () => void;
}

const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onToggleRead,
  onRemove,
}) => {
  const [rating, setRating] = useState<number | null>(
    book.personal_rating || null
  );
  const [notes, setNotes] = useState(book.personal_notes || "");
  const [isPublic, setIsPublic] = useState(false);

  const updateRating = useUpdateBookRating();
  const updateNotes = useUpdateBookNotes();

  const handleRatingChange = (newRating: number | null) => {
    setRating(newRating);
    void updateRating.mutateAsync({ bookId: book.id, rating: newRating });
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
  };

  const handleSaveReview = () => {
    if (notes !== book.personal_notes) {
      void updateNotes.mutateAsync({ bookId: book.id, notes: notes || null });
    }
  };

  const handleStatusChange = (newStatus: MediaStatus) => {
    // Map status to read boolean
    // 'completed' means read, anything else means not read
    if (newStatus === "completed" && !book.read) {
      onToggleRead();
    } else if (newStatus !== "completed" && book.read) {
      onToggleRead();
    }
  };

  const displayYear = book.published_date
    ? new Date(book.published_date).getFullYear()
    : null;

  // Build metadata array - keep header minimal
  const metadata: MetadataItem[] = [];

  // Build additional content using MediaDetailsContent
  const additionalContent = (
    <MediaDetailsContent
      title={book.title}
      details={null}
      loadingDetails={false}
      mediaType="book"
      externalId={book.external_id}
      isCompleted={book.read}
      authors={book.authors || undefined}
      genre={book.categories || undefined}
      year={displayYear || undefined}
      pageCount={book.page_count || undefined}
      isbn={book.isbn || undefined}
    />
  );

  return (
    <MediaDetailModal
      isOpen={true}
      onClose={onClose}
      mediaType="book"
      title={book.title}
      posterUrl={book.thumbnail_url || undefined}
      metadata={metadata}
      genres={book.categories ? [book.categories] : []}
      description={book.description || undefined}
      status={book.read ? "completed" : "planned"}
      onStatusChange={handleStatusChange}
      onRemove={onRemove}
      showReviewSection={true}
      additionalContent={additionalContent}
      myReview={null}
      friendsReviews={[]}
      rating={rating}
      reviewText={notes}
      isPublic={isPublic}
      isSaving={false}
      showSavedMessage={false}
      hasUnsavedChanges={false}
      onRatingChange={handleRatingChange}
      onReviewTextChange={handleNotesChange}
      onPublicChange={setIsPublic}
      onSaveReview={handleSaveReview}
      onDeleteReview={undefined}
    />
  );
};

export default BookDetailModal;
