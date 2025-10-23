import { useState } from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Unlock,
  Edit2,
  Trash2,
} from "lucide-react";
import type { MediaReviewWithUser } from "../../services/reviewsService.types";

interface MediaReviewCardProps {
  review: MediaReviewWithUser;
  isOwnReview?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePrivacy?: (isPublic: boolean) => void;
}

/**
 * Reusable card component to display a single media review
 * Shows user info, rating, like/dislike, review text, and metadata
 */
export function MediaReviewCard({
  review,
  isOwnReview = false,
  onEdit,
  onDelete,
  onTogglePrivacy,
}: MediaReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format relative timestamp
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 604800)}w ago`;

    // For older dates, show absolute date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format watched date
  const formatWatchedDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Check if review text is long (more than 3 lines approximately)
  const isLongReview = review.review_text && review.review_text.length > 200;

  // Check if there's any content to show
  const hasContent =
    review.rating || review.liked !== null || review.review_text;

  if (!hasContent) {
    return (
      <article className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {review.display_name}
          </h4>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No review yet
        </p>
      </article>
    );
  }

  return (
    <article className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {review.display_name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getRelativeTime(review.created_at)}
          </p>
        </div>

        {/* Action buttons for own review */}
        {isOwnReview && (onTogglePrivacy || onEdit || onDelete) && (
          <div className="flex items-center gap-2 ml-2">
            {onTogglePrivacy && (
              <button
                onClick={() => onTogglePrivacy(!review.is_public)}
                className={`p-1.5 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-primary ${
                  review.is_public
                    ? "text-primary hover:text-primary-dark"
                    : "text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
                aria-label={
                  review.is_public
                    ? "Make review private"
                    : "Make review public"
                }
              >
                {review.is_public ? (
                  <Unlock className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors rounded focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Edit review"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Delete review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rating and Like/Dislike */}
      <div className="flex items-center gap-4 mb-3">
        {/* Star Rating */}
        {review.rating && (
          <div
            className="flex items-center gap-1"
            aria-label={`Rating: ${review.rating} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating!
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                }`}
              />
            ))}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
              {review.rating}/5
            </span>
          </div>
        )}

        {/* Like/Dislike */}
        {review.liked !== null && (
          <div className="flex items-center gap-1">
            {review.liked ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm font-medium">Liked</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <ThumbsDown className="w-4 h-4" />
                <span className="text-sm font-medium">Disliked</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Text */}
      {review.review_text && (
        <div className="mb-3">
          <p
            className={`text-gray-700 dark:text-gray-300 text-sm leading-relaxed ${
              !isExpanded && isLongReview ? "line-clamp-3" : ""
            }`}
          >
            {review.review_text}
          </p>
          {isLongReview && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-primary hover:underline mt-1 focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Metadata Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        {/* Watched Date */}
        {review.watched_at && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Watched on {formatWatchedDate(review.watched_at)}
          </p>
        )}

        {/* Privacy Indicator (only show for own review) */}
        {isOwnReview && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {review.is_public ? (
              <>
                <Unlock className="w-3 h-3" />
                <span>Public</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
