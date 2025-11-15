import React from "react";
import { X } from "lucide-react";
import Modal from "./Modal";
import MediaPoster from "./MediaPoster";
import MetadataRow, { MetadataItem } from "./MetadataRow";
import GenreChips from "./GenreChips";
import StarRating from "./StarRating";
import StatusBadge from "./StatusBadge";
import Button from "./Button";

type MediaType = "movie" | "tv" | "book" | "game" | "music";

interface StatusInfo {
  label: string;
  isCompleted: boolean;
}

interface MediaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: MediaType;
  title: string;
  posterUrl?: string;
  metadata: MetadataItem[];
  genres?: string[] | string;
  description?: string;
  status: StatusInfo;
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  onToggleStatus: () => void;
  onRecommend: () => void;
  onRemove: () => void;
  additionalContent?: React.ReactNode;
  reviewSection?: React.ReactNode;
}

export default function MediaDetailModal({
  isOpen,
  onClose,
  mediaType,
  title,
  posterUrl,
  metadata,
  genres,
  description,
  status,
  rating,
  onRatingChange,
  onToggleStatus,
  onRecommend,
  onRemove,
  additionalContent,
  reviewSection,
}: MediaDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col sm:flex-row gap-8 p-6">
          {/* Poster */}
          <div className="flex-shrink-0">
            <MediaPoster
              src={posterUrl}
              alt={`${title} poster`}
              size="lg"
              aspectRatio="2/3"
            />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

          {/* Info Section */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>

            {/* Metadata */}
            {metadata.length > 0 && <MetadataRow items={metadata} />}

            {/* Genres */}
            {genres && <GenreChips genres={genres} maxVisible={5} />}

            {/* Status Badge */}
            <div>
              <StatusBadge status={status.label} mediaType={mediaType} />
            </div>

            {/* Rating */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Rating
              </h3>
              <StarRating
                rating={rating}
                onRatingChange={onRatingChange}
                showClearButton={true}
              />
            </div>

            {/* Description */}
            {description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overview
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              </div>
            )}

            {/* Additional Content (Cast, Awards, etc.) */}
            {additionalContent && <div>{additionalContent}</div>}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={onToggleStatus}
                variant={status.isCompleted ? "secondary" : "primary"}
              >
                {status.isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
              </Button>

              <Button onClick={onRecommend} variant="secondary">
                Recommend to Friend
              </Button>

              <Button onClick={onRemove} variant="danger">
                Remove from List
              </Button>
            </div>

            {/* Review Section */}
            {reviewSection && <div className="mt-6">{reviewSection}</div>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
