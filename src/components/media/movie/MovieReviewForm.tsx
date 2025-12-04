import { Star, Check, Users as UsersIcon } from "lucide-react";
import Button from "../../shared/ui/Button";
import Accordion from "../../shared/common/Accordion";
import StarRating from "../../shared/common/StarRating";
import PrivacyToggle from "../../shared/common/PrivacyToggle";

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
  return (
    <div className="pt-6">
      <Accordion
        title="Your Review"
        subtitle={
          myReview
            ? "You've reviewed this"
            : "Add your personal thoughts (optional)"
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
              onRatingChange={onRatingChange}
              showLabel={true}
              showClearButton={false}
            />
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
            <PrivacyToggle
              isPublic={isPublic}
              onChange={onPublicChange}
              variant="switch"
              size="sm"
              showDescription={false}
            />

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
                            {review.rating}/5
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
      </Accordion>
    </div>
  );
}
