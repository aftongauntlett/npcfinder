import React, { useState } from "react";
import {
  Textarea,
  Button,
  Input,
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
  // Liked field removed from schema
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
    if (rating === null && !reviewText.trim()) {
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
        {/* Like/Dislike removed - not in schema */}
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
        <Input
          type="date"
          id="watched-at"
          label="When did you watch this? (optional)"
          value={watchedAt}
          onChange={(e) => setWatchedAt(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
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
