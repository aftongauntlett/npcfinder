import React, { useState } from "react";
import { X, Star, BookOpen, Calendar, FileText, Hash } from "lucide-react";
import Modal from "../../shared/Modal";
import Button from "../../shared/Button";
import type { ReadingListItem } from "../../../services/booksService.types";
import {
  useUpdateBookRating,
  useUpdateBookNotes,
} from "../../../hooks/useReadingListQueries";

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
  const [hoveredStar, setHoveredStar] = useState(0);

  const updateRating = useUpdateBookRating();
  const updateNotes = useUpdateBookNotes();

  const handleRatingClick = (newRating: number) => {
    setRating(newRating);
    void updateRating.mutateAsync({ bookId: book.id, rating: newRating });
  };

  const handleNotesBlur = () => {
    if (notes !== book.personal_notes) {
      void updateNotes.mutateAsync({ bookId: book.id, notes: notes || null });
    }
  };

  const displayYear = book.published_date
    ? new Date(book.published_date).getFullYear()
    : null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="4xl"
      showHeader={false}
      closeOnBackdropClick={true}
    >
      {/* Close Button */}
      <Button
        onClick={onClose}
        variant="subtle"
        size="icon"
        icon={<X className="w-5 h-5" />}
        className="absolute top-4 right-4 glass-button backdrop-blur-sm z-10"
        aria-label="Close modal"
      />

      {/* Content */}
      <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              {book.thumbnail_url ? (
                <img
                  src={book.thumbnail_url}
                  alt={`${book.title} cover`}
                  className="w-full sm:w-56 h-auto rounded-lg shadow-xl transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full sm:w-56 h-80 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-xl">
                  <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>

            {/* Vertical Divider (hidden on mobile) */}
            <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

            {/* Title and Info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {book.title}
                </h2>
                {book.authors && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                    by {book.authors}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {displayYear && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{displayYear}</span>
                    </div>
                  )}
                  {book.page_count && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{book.page_count} pages</span>
                    </div>
                  )}
                  {book.isbn && (
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-4 h-4" />
                      <span>{book.isbn}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {book.read ? (
                  <span className="inline-flex items-center px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                    <FileText className="w-4 h-4 mr-1.5" />
                    Read
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    Reading
                  </span>
                )}
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      variant="subtle"
                      size="icon"
                      icon={
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= (hoveredStar || rating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      }
                      aria-label={`Rate ${star} stars`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={onToggleRead}
                  variant={book.read ? "secondary" : "primary"}
                  size="sm"
                >
                  {book.read ? "Mark as Unread" : "Mark as Read"}
                </Button>
                <Button onClick={onRecommend} variant="secondary" size="sm">
                  Recommend
                </Button>
                <Button onClick={onRemove} variant="danger" size="sm">
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {book.description}
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

          {/* TODO: Add BookReviewForm accordion here */}
        </div>
      </div>
    </Modal>
  );
};

export default BookDetailModal;
