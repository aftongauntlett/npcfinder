/**
 * @deprecated This component will be migrated to use the unified MediaDetailModal.
 * For new features, consider using MediaDetailModal from @/components/shared instead.
 * This component shares 90% of its structure with MovieDetailModal and GameDetailModal.
 * Future work: Migrate to MediaDetailModal. The personal notes section can be passed as additionalContent prop.
 * Note: TODO on line 214 mentions adding a BookReviewForm accordion - use the new Accordion component when implemented.
 */

import React, { useState } from "react";
import { Calendar, FileText, Hash } from "lucide-react";
import MediaDetailModal from "../../shared/MediaDetailModal";
import Accordion from "../../shared/Accordion";
import StarRating from "../../shared/StarRating";
import PrivacyToggle from "../../shared/PrivacyToggle";
import Button from "../../shared/Button";
import type { ReadingListItem } from "../../../services/booksService.types";
import {
  useUpdateBookRating,
  useUpdateBookNotes,
} from "../../../hooks/useReadingListQueries";
import type { MetadataItem } from "../../shared/MetadataRow";

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

  const displayYear = book.published_date
    ? new Date(book.published_date).getFullYear()
    : null;

  // Build metadata array
  const metadata: MetadataItem[] = [
    ...(displayYear
      ? [{ icon: <Calendar className="w-4 h-4" />, label: String(displayYear) }]
      : []),
    ...(book.page_count
      ? [
          {
            icon: <FileText className="w-4 h-4" />,
            label: `${book.page_count} pages`,
          },
        ]
      : []),
    ...(book.isbn
      ? [{ icon: <Hash className="w-4 h-4" />, label: book.isbn }]
      : []),
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
      description={book.description}
      status={{
        label: book.read ? "read" : "reading",
        isCompleted: book.read,
      }}
      rating={rating}
      onRatingChange={handleRatingChange}
      onToggleStatus={onToggleRead}
      onRecommend={onRecommend}
      onRemove={onRemove}
      additionalContent={additionalContent}
      reviewSection={reviewSection}
    />
  );
};

export default BookDetailModal;
