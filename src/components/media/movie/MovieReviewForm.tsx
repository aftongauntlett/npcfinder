import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Star,
  Check,
  Users as UsersIcon,
} from "lucide-react";
import Button from "../../shared/Button";

interface Review {
  id: string;
  display_name?: string;
  review_text: string | null;
  rating: number | null;
  liked: boolean | null;
  is_edited: boolean;
  edited_at: string | null;
}

interface MovieReviewFormProps {
  myReview: Review | null | undefined;
  friendsReviews: Review[];
  reviewText: string;
  rating: number | null;
  isPublic: boolean;
  isSaving: boolean;
  showSavedMessage: boolean;
  hasUnsavedChanges: boolean;
  onReviewTextChange: (text: string) => void;
  onRatingChange: (rating: number | null) => void;
  onPublicChange: (isPublic: boolean) => void;
  onSave: () => void;
  onDelete: () => void;
}

const RATING_LABELS: Record<string, string> = {
  "1-2": "Awful",
  "3-4": "Meh",
  "5-6": "Not Bad",
  "7-8": "Pretty Good",
  "9-10": "Awesome",
};

function getRatingLabel(rating: number | null): string {
  if (rating === null) return "Rate";
  if (rating <= 2) return RATING_LABELS["1-2"];
  if (rating <= 4) return RATING_LABELS["3-4"];
  if (rating <= 6) return RATING_LABELS["5-6"];
  if (rating <= 8) return RATING_LABELS["7-8"];
  return RATING_LABELS["9-10"];
}

export function MovieReviewForm({
  myReview,
  friendsReviews,
  reviewText,
  rating,
  isPublic,
  isSaving,
  showSavedMessage,
  hasUnsavedChanges,
  onReviewTextChange,
  onRatingChange,
  onPublicChange,
  onSave,
  onDelete,
}: MovieReviewFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="pt-6">
      {/* Accordion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          isExpanded ? "rounded-t-lg" : "rounded-lg"
        }`}
      >
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Review
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {myReview
              ? "You've reviewed this"
              : "Add your personal thoughts (optional)"}
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="space-y-6 p-6 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg bg-white dark:bg-gray-900/50">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRatingChange(rating === star ? null : star)}
                  className="p-0.5 hover:scale-110 transition-transform"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      rating && rating >= star
                        ? "fill-primary text-primary"
                        : "fill-none text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {getRatingLabel(rating)}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label
              htmlFor="review-text"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your Thoughts
            </label>
            <textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => onReviewTextChange(e.target.value)}
              placeholder="Share your thoughts... (optional)"
              rows={8}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Edited Badge */}
          {myReview?.is_edited && myReview.edited_at && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Edited{" "}
              {new Date(myReview.edited_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          )}

          {/* Bottom Row: Privacy Toggle and Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Privacy Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isPublic ? "Public" : "Private"}
              </span>
              <button
                onClick={() => onPublicChange(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isPublic ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                }`}
                role="switch"
                aria-checked={isPublic}
                aria-label="Toggle privacy"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {myReview && (
                <Button onClick={onDelete} variant="secondary">
                  Delete
                </Button>
              )}
              <Button
                onClick={onSave}
                variant={
                  showSavedMessage || !hasUnsavedChanges
                    ? "secondary"
                    : "primary"
                }
                disabled={isSaving || showSavedMessage}
                className="min-w-[100px]"
              >
                {isSaving ? (
                  "Saving..."
                ) : showSavedMessage ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Saved
                  </span>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {/* Friends' Reviews */}
          {friendsReviews.length > 0 && (
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                What Your Friends Think
              </h3>
              <div className="space-y-4">
                {friendsReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {review.display_name}
                      </div>
                      <div className="flex items-center gap-2">
                        {review.rating && (
                          <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {review.rating}/10
                          </span>
                        )}
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        {review.review_text}
                      </p>
                    )}
                    {review.is_edited && review.edited_at && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Edited {new Date(review.edited_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
