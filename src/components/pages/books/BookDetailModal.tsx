import React, { useState } from "react";
import {
  X,
  Star,
  BookOpen,
  Calendar,
  Hash,
  FileText,
  Lightbulb,
} from "lucide-react";
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
    <Modal isOpen={true} onClose={onClose} title="" maxWidth="2xl">
      <div className="relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-[300px_1fr] gap-6 p-6">
          {/* Left: Book Cover */}
          <div>
            {book.thumbnail_url ? (
              <img
                src={book.thumbnail_url}
                alt={`${book.title} cover`}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-gray-400" />
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-4 space-y-2">
              <Button
                onClick={onToggleRead}
                variant={book.read ? "secondary" : "primary"}
                className="w-full"
              >
                {book.read ? "Mark as Unread" : "Mark as Read"}
              </Button>
              <Button
                onClick={onRecommend}
                variant="secondary"
                className="w-full"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Recommend to Friend
              </Button>
              <Button onClick={onRemove} variant="danger" className="w-full">
                Remove from Reading List
              </Button>
            </div>
          </div>

          {/* Right: Book Details */}
          <div className="space-y-6">
            {/* Title & Author */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {book.title}
              </h2>
              {book.author && (
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  by {book.author}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {displayYear && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{displayYear}</span>
                </div>
              )}
              {book.page_count && (
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{book.page_count} pages</span>
                </div>
              )}
              {book.isbn && (
                <div className="flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  <span>{book.isbn}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div>
              {book.read ? (
                <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                  Read
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
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
                  <button
                    key={star}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredStar || rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BookDetailModal;
