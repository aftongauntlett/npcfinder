import { Trash2, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import StarRating from "../common/StarRating";
import Button from "../ui/Button";
import Textarea from "../ui/Textarea";

interface Review {
  id: string;
  display_name?: string;
  review_text: string | null;
  rating: number | null;
  is_edited?: boolean;
  edited_at?: string | null;
}

interface MediaReviewProps {
  myReview?: Review | null;
  friendsReviews?: Review[];
  rating: number | null;
  reviewText: string;
  isPublic: boolean;
  isSaving?: boolean;
  showSavedMessage?: boolean;
  hasUnsavedChanges?: boolean;
  onRatingChange: (rating: number | null) => void;
  onReviewTextChange: (text: string) => void;
  onPublicChange: (isPublic: boolean) => void;
  onSave: () => void;
  onDelete?: () => void;
  className?: string;
}

export default function MediaReview({
  myReview,
  friendsReviews = [],
  rating,
  reviewText,
  isPublic,
  isSaving = false,
  showSavedMessage = false,
  hasUnsavedChanges = false,
  onRatingChange,
  onReviewTextChange,
  onPublicChange,
  onSave,
  onDelete,
  className = "",
}: MediaReviewProps) {
  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Your Review Section */}
      <div className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-semibold text-primary dark:text-primary-light mb-2">
            Rating
          </label>
          <StarRating
            rating={rating}
            onRatingChange={onRatingChange}
            size="md"
            showLabel={true}
            showClearButton={false}
            useThemeColor={true}
            showPlaceholder={true}
          />
        </div>

        {/* Review Text */}
        <div>
          <label
            htmlFor="review-text"
            className="block text-sm font-semibold text-primary dark:text-primary-light mb-2"
          >
            Your Thoughts
          </label>
          <Textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => onReviewTextChange(e.target.value)}
            placeholder="Share your thoughts..."
            rows={8}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Supports markdown: **bold**, *italic*, lists, and more
          </p>
        </div>

        {/* Privacy Toggle and Save Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => onPublicChange(!isPublic)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                isPublic
                  ? "bg-primary/10 border-primary"
                  : "bg-transparent border-gray-300 dark:border-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-200 ease-in-out ${
                  isPublic
                    ? "translate-x-6 bg-primary"
                    : "translate-x-1 bg-gray-400 dark:bg-gray-500"
                }`}
              />
            </button>
            <label className="form-label">Visible to friends</label>
          </div>

          {/* Save and Delete Buttons */}
          <div className="flex items-center gap-3">
            {myReview && onDelete && (
              <Button
                onClick={onDelete}
                variant="subtle"
                icon={<Trash2 className="w-4 h-4" />}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </Button>
            )}

            <Button
              onClick={onSave}
              variant="primary"
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? "Saving..." : myReview ? "Update" : "Save"}
            </Button>

            {showSavedMessage && (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Saved
              </span>
            )}
          </div>
        </div>

        {/* Blue Alert - Only show when visible is ON */}
        {isPublic && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300 m-0">
              Your friends will see this review in their feed and on the media
              detail page.
            </p>
          </div>
        )}

        {/* Edited Badge */}
        {myReview?.is_edited && myReview.edited_at && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Edited on{" "}
            {new Date(myReview.edited_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        )}
      </div>

      {/* Friends' Reviews Section */}
      {friendsReviews.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Friends' Reviews ({friendsReviews.length})
          </h3>
          <div className="space-y-4">
            {friendsReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {review.display_name || "Anonymous"}
                  </div>
                  {review.rating && (
                    <div className="flex items-center gap-1">
                      <StarRating
                        rating={review.rating}
                        onRatingChange={() => {}}
                        size="xs"
                        readonly
                        showClearButton={false}
                        useThemeColor={true}
                      />
                    </div>
                  )}
                </div>
                {review.review_text && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {review.review_text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
