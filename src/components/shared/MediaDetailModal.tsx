import { X, Check, ArrowLeft, Trash2 } from "lucide-react";
import Modal from "./Modal";
import MediaPoster from "./MediaPoster";
import MediaHeader from "./MediaHeader";
import MediaReview from "./MediaReview";
import Button from "./Button";
import type { MetadataItem } from "./MetadataRow";

type MediaType = "movie" | "tv" | "book" | "game" | "music";
type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";

interface MediaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: MediaType;
  title: string;
  posterUrl?: string;
  metadata: MetadataItem[];
  genres?: string[] | string;
  description?: string;
  status: MediaStatus;
  onStatusChange: (status: MediaStatus) => void;
  onRemove: () => void;
  isInWatchlist?: boolean;
  additionalContent?: React.ReactNode;
  // Review props
  myReview?: {
    id: string;
    review_text: string | null;
    rating: number | null;
    is_edited?: boolean;
    edited_at?: string | null;
  } | null;
  friendsReviews?: Array<{
    id: string;
    display_name?: string;
    review_text: string | null;
    rating: number | null;
  }>;
  rating: number | null;
  reviewText: string;
  isPublic: boolean;
  isSaving?: boolean;
  showSavedMessage?: boolean;
  hasUnsavedChanges?: boolean;
  onRatingChange: (rating: number | null) => void;
  onReviewTextChange: (text: string) => void;
  onPublicChange: (isPublic: boolean) => void;
  onSaveReview: () => void;
  onDeleteReview?: () => void;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl" | "6xl";
}

export default function MediaDetailModal({
  isOpen,
  onClose,
  title,
  posterUrl,
  metadata,
  genres,
  description,
  status,
  onStatusChange,
  onRemove,
  isInWatchlist = true,
  additionalContent,
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
  onSaveReview,
  onDeleteReview,
  maxWidth = "5xl",
}: MediaDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={maxWidth}
      showHeader={false}
    >
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content - Single Column with Sticky Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8 p-6 max-h-[85vh] overflow-y-auto">
          {/* Poster Sidebar */}
          <div className="flex-shrink-0 lg:sticky lg:top-0 lg:self-start space-y-4">
            <div className="group">
              <MediaPoster
                src={posterUrl}
                alt={`${title} poster`}
                size="lg"
                aspectRatio="2/3"
                className="mx-auto lg:mx-0 transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <Button
                onClick={() =>
                  onStatusChange(
                    status === "completed" ? "planned" : "completed"
                  )
                }
                variant={status === "completed" ? "secondary" : "primary"}
                fullWidth
                className="group"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="group-hover:animate-wiggle inline-block">
                    {status === "completed" ? (
                      <ArrowLeft className="w-4 h-4" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </span>
                  {status === "completed" ? "Move Back" : "Mark as Watched"}
                </span>
              </Button>

              {isInWatchlist && (
                <Button
                  onClick={onRemove}
                  variant="danger"
                  fullWidth
                  className="group"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="group-hover:animate-wiggle inline-block">
                      <Trash2 className="w-4 h-4" />
                    </span>
                    Remove from List
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Main Content Column */}
          <div className="flex-1 min-w-0">
            {/* Header: Title, Metadata, Genres */}
            <div className="pb-5">
              <MediaHeader title={title} metadata={metadata} genres={genres} />
            </div>

            {/* Overview Section - includes description, crew, and metrics */}
            {(description || additionalContent) && (
              <div className="pb-5">
                <h3 className="text-sm font-medium text-primary mb-2.5 mt-0">
                  Overview
                </h3>
                {description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed m-0">
                    {description}
                  </p>
                )}
                {additionalContent}
              </div>
            )}

            {/* Review Section */}
            <MediaReview
              myReview={myReview}
              friendsReviews={friendsReviews}
              rating={rating}
              reviewText={reviewText}
              isPublic={isPublic}
              isSaving={isSaving}
              showSavedMessage={showSavedMessage}
              hasUnsavedChanges={hasUnsavedChanges}
              onRatingChange={onRatingChange}
              onReviewTextChange={onReviewTextChange}
              onPublicChange={onPublicChange}
              onSave={onSaveReview}
              onDelete={onDeleteReview}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
