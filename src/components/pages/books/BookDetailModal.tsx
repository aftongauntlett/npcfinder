import React, { useState } from "react";
import { Calendar, FileText, Hash } from "lucide-react";
import MediaDetailModal from "../../shared/media/MediaDetailModal";
import Accordion from "../../shared/common/Accordion";
import StarRating from "../../shared/common/StarRating";
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
  onRecommend: () => void;
}

const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onToggleRead,
  onRemove,
  onRecommend,
}) => {
  const [rating, setRating] = useState(book.personal_rating || 0);
  const [notes, setNotes] = useState(book.personal_notes || "");

  const updateRating = useUpdateBookRating();
  const updateNotes = useUpdateBookNotes();

  const handleRatingChange = (newRating: number | null) => {
    setRating(newRating || 0);
    if (newRating !== null) {
      void updateRating.mutateAsync({ bookId: book.id, rating: newRating });
    }
  };

  const handleNotesBlur = () => {
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

  // Build metadata array
  const metadata: MetadataItem[] = [
    ...(displayYear
      ? [
          {
            icon: Calendar,
            value: String(displayYear),
            label: String(displayYear),
          },
        ]
      : []),
    ...(book.page_count
      ? [
          {
            icon: FileText,
            value: `${book.page_count} pages`,
            label: `${book.page_count} pages`,
          },
        ]
      : []),
    ...(book.isbn ? [{ icon: Hash, value: book.isbn, label: book.isbn }] : []),
  ];

  // Build additional content (author + personal notes)
  const additionalContent = (
    <>
      {book.authors && (
        <div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            by {book.authors}
          </p>
        </div>
      )}

      {/* Personal Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add your thoughts, favorite quotes, or notes..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          rows={4}
        />
      </div>
    </>
  );

  // Build review section (BookReviewForm accordion - simplified version)
  const reviewSection = (
    <Accordion
      title="Your Review"
      subtitle={
        book.personal_rating
          ? "You've reviewed this book"
          : "Add your thoughts (optional)"
      }
      defaultExpanded={false}
    >
      <div className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rating
          </label>
          <StarRating
            rating={rating}
            onRatingChange={handleRatingChange}
            showLabel={true}
            showClearButton={false}
          />
        </div>

        {/* Notes are in additionalContent, so just show a message here */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Add your personal notes in the "Your Notes" section above.
        </div>
      </div>
    </Accordion>
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
      onRecommend={onRecommend}
      onRemove={onRemove}
      showReviewSection={false}
      additionalContent={additionalContent}
      reviewSection={reviewSection}
      myReview={null}
      friendsReviews={[]}
      rating={rating}
      reviewText=""
      isPublic={true}
      isSaving={false}
      showSavedMessage={false}
      hasUnsavedChanges={false}
      onRatingChange={handleRatingChange}
      onReviewTextChange={() => {}}
      onPublicChange={() => {}}
      onSaveReview={() => {}}
      onDeleteReview={undefined}
    />
  );
};

export default BookDetailModal;
