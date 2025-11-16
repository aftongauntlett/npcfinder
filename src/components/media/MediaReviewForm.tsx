import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import {
  Textarea,
  Button,
  StarRating,
  PrivacyToggle,
} from "@/components/shared";
import type {
  MediaReview,
  CreateReviewData,
  UpdateReviewData,
} from "../../services/reviewsService.types";

interface MediaReviewFormProps {
  initialData?: MediaReview;
  externalId: string;
  mediaType: string;
  title: string;
  onSubmit: (
    data: Omit<CreateReviewData, "user_id"> | UpdateReviewData
  ) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

/**
 * Reusable form component for creating/editing media reviews
 * Supports rating (1-5 stars), like/dislike, review text, privacy toggle, and watched date
 */
export function MediaReviewForm({
  initialData,
  externalId,
  mediaType,
  title,
  onSubmit,
  onCancel,
  isLoading = false,
}: MediaReviewFormProps) {
  const [rating, setRating] = useState<number | null>(
    initialData?.rating ?? null
  );
  const [liked, setLiked] = useState<boolean | null>(
    initialData?.liked ?? null
  );
  const [reviewText, setReviewText] = useState(initialData?.review_text ?? "");
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? true);
  const [watchedAt, setWatchedAt] = useState(
    initialData?.watched_at
      ? new Date(initialData.watched_at).toISOString().split("T")[0]
      : ""
  );
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate at least one field is filled
    if (rating === null && liked === null && !reviewText.trim()) {
      setError(
        "Please provide at least a rating, like/dislike, or review text"
      );
      return;
    }

    try {
      if (initialData) {
        // Update existing review
        const updateData: UpdateReviewData = {
          rating,
          liked,
          review_text: reviewText.trim() || null,
          is_public: isPublic,
          watched_at: watchedAt ? new Date(watchedAt).toISOString() : null,
        };
        await onSubmit(updateData);
      } else {
        // Create new review (user_id will be injected by parent)
        const createData: Omit<CreateReviewData, "user_id"> = {
          external_id: externalId,
          media_type: mediaType as CreateReviewData["media_type"],
          title,
          rating,
          liked,
          review_text: reviewText.trim() || null,
          is_public: isPublic,
          watched_at: watchedAt ? new Date(watchedAt).toISOString() : null,
        };
        await onSubmit(createData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    }
  };

  const charCount = reviewText.length;
  const maxChars = 1000;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {/* Rating - Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rating
        </label>
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          showClearButton={true}
          showLabel={false}
        />
      </div>

      {/* Like/Dislike Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Reaction
        </label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="subtle"
            onClick={() => setLiked(liked === true ? null : true)}
            icon={<ThumbsUp className="w-4 h-4" />}
            className={`${
              liked === true
                ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-500 text-green-700 dark:text-green-400"
                : "hover:border-green-500"
            }`}
            aria-label="Like"
            aria-pressed={liked === true}
          >
            <span className="text-sm font-medium">Like</span>
          </Button>
          <Button
            type="button"
            variant="subtle"
            onClick={() => setLiked(liked === false ? null : false)}
            icon={<ThumbsDown className="w-4 h-4" />}
            className={`${
              liked === false
                ? "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500 text-red-700 dark:text-red-400"
                : "hover:border-red-500"
            }`}
            aria-label="Dislike"
            aria-pressed={liked === false}
          >
            <span className="text-sm font-medium">Dislike</span>
          </Button>
          {liked !== null && (
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={() => setLiked(null)}
              className="ml-2"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div>
        <Textarea
          id="review-text"
          label="Your Review"
          value={reviewText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setReviewText(e.target.value)
          }
          placeholder={`Share your thoughts about ${title}...`}
          rows={4}
          maxLength={maxChars}
          helperText={`${charCount}/${maxChars} characters`}
          resize="vertical"
        />
      </div>

      {/* Privacy Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Share with friends?
        </label>
        <PrivacyToggle
          isPublic={isPublic}
          onChange={setIsPublic}
          variant="button"
          showDescription={true}
          contextLabel={title}
        />
      </div>

      {/* Watched Date */}
      <div>
        <label
          htmlFor="watched-at"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          When did you watch this?{" "}
          <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <input
          type="date"
          id="watched-at"
          value={watchedAt}
          onChange={(e) => setWatchedAt(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData ? "Update Review" : "Save Review"}
        </Button>
      </div>
    </form>
  );
}
