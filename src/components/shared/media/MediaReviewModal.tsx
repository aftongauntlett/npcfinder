import { useState, useEffect } from "react";
import { Modal } from "@/components/shared";
import MediaReview from "./MediaReview";
import {
  useMyMediaReview,
  useFriendsMediaReviews,
  useUpsertMediaReview,
  useDeleteMediaReview,
} from "@/hooks/useSimpleMediaReviews";

interface MediaReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  externalId: string;
  mediaType: string;
  title: string;
}

/**
 * MediaReviewModal - Modal wrapper for media review functionality
 *
 * Integrates with review hooks to fetch/save/delete reviews
 * Uses the existing MediaReview component for UI
 */
export default function MediaReviewModal({
  isOpen,
  onClose,
  externalId,
  mediaType,
  title,
}: MediaReviewModalProps) {
  // Fetch existing reviews (only when modal is open)
  const { data: myReview, isLoading: loadingMyReview } = useMyMediaReview(
    externalId,
    mediaType,
    isOpen // Only fetch when modal is open
  );

  const { data: friendsReviews = [], isLoading: loadingFriendsReviews } =
    useFriendsMediaReviews(
      externalId,
      mediaType,
      isOpen // Only fetch when modal is open
    );

  // Mutations
  const upsertMutation = useUpsertMediaReview();
  const deleteMutation = useDeleteMediaReview(externalId, mediaType);

  // Local state for form
  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  // Initialize form from existing review
  useEffect(() => {
    if (myReview && isOpen) {
      setRating(myReview.rating);
      setReviewText(myReview.review_text || "");
      setIsPublic(myReview.is_public);
      setHasUnsavedChanges(false);
    } else if (isOpen && !myReview) {
      // Reset form for new review
      setRating(null);
      setReviewText("");
      setIsPublic(true);
      setHasUnsavedChanges(false);
    }
  }, [myReview, isOpen]);

  // Track changes
  useEffect(() => {
    if (!myReview) {
      setHasUnsavedChanges(rating !== null || reviewText !== "");
    } else {
      const hasChanged =
        rating !== myReview.rating ||
        reviewText !== (myReview.review_text || "") ||
        isPublic !== myReview.is_public;
      setHasUnsavedChanges(hasChanged);
    }
  }, [rating, reviewText, isPublic, myReview]);

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({
        external_id: externalId,
        media_type: mediaType as
          | "movie"
          | "tv"
          | "song"
          | "album"
          | "playlist"
          | "game"
          | "book",
        title: title,
        rating,
        review_text: reviewText || null,
        is_public: isPublic,
      });

      setHasUnsavedChanges(false);
      setShowSavedMessage(true);

      // Close modal after a brief delay to show success
      setTimeout(() => {
        setShowSavedMessage(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error saving review:", error);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;

    try {
      await deleteMutation.mutateAsync(myReview.id);
      setRating(null);
      setReviewText("");
      setIsPublic(true);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const isLoading = loadingMyReview || loadingFriendsReviews;
  const isSaving = upsertMutation.isPending || deleteMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review: ${title}`}>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      ) : (
        <MediaReview
          myReview={myReview}
          friendsReviews={friendsReviews}
          rating={rating}
          reviewText={reviewText}
          isPublic={isPublic}
          isSaving={isSaving}
          showSavedMessage={showSavedMessage}
          hasUnsavedChanges={hasUnsavedChanges}
          onRatingChange={setRating}
          onReviewTextChange={setReviewText}
          onPublicChange={setIsPublic}
          onSave={() => void handleSave()}
          onDelete={myReview ? () => void handleDelete() : undefined}
        />
      )}
    </Modal>
  );
}
