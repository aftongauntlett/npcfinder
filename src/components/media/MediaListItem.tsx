import React, { useState, useEffect } from "react";
import { Calendar, Clock, RotateCcw, Check, Lightbulb } from "lucide-react";
import { Book } from "@phosphor-icons/react";
import { type MediaStatus } from "@/utils/mediaStatus";
import { logger } from "@/lib/logger";
import {
  AccordionListCard,
  GenreChips,
  StatusBadge,
  StarRating,
  MediaPoster,
  MediaDetailsContent,
  MediaReviewModal,
} from "@/components/shared";
import {
  fetchDetailedMediaInfo,
  type DetailedMediaInfo,
} from "@/utils/tmdbDetails";

interface MediaListItemProps {
  id: string | number;
  title: string;
  subtitle?: string;
  posterUrl?: string;
  year?: string | number;
  personalRating?: number;
  criticRating?: number;
  audienceRating?: number;
  status?: MediaStatus;
  mediaType?: "movie" | "tv" | "song" | "album" | "playlist" | "game" | "book";
  category?: string; // For books - display primary category
  genres?: string; // Comma-separated genre string
  externalId?: string; // TMDB/external ID for fetching details
  releaseDate?: string; // For fetching additional data

  // Action buttons (optional)
  isCompleted?: boolean; // For watched/read status
  onToggleComplete?: (id: string | number) => void;
  onRecommend?: (id: string | number) => void;
  onRemove?: (id: string | number) => void;
  onClick?: (id: string | number) => void; // For opening detail modal/page
  description?: string; // For overview/description text

  // Music-specific props
  artist?: string;
  album?: string;
  trackDuration?: number; // in milliseconds
  trackCount?: number;
  previewUrl?: string;

  // Game-specific props
  developer?: string;
  platforms?: string;
  metacritic?: number;
  playtime?: number;

  // Book-specific props
  authors?: string;
  publisher?: string;
  isbn?: string;
  pageCount?: number;
}

/**
 * MediaListItem - Universal compact horizontal list view for all media types
 *
 * This is the primary reusable component for displaying media items in list views
 * across all media types (movies, TV, books, games, music). It provides a consistent
 * horizontal layout optimized for readability and accessibility.
 *
 * Data Mapping by Media Type:
 * - **Movies/TV**: title, subtitle (director), year, genres, description, mediaType badge
 * - **Books**: title, subtitle (authors), year, category, description, personalRating
 * - **Games**: title, subtitle (platforms - developer/studio data not stored), year, genres, description, personalRating, criticRating (metacritic)
 * - **Music**: title, subtitle (artist), year, genre, description, personalRating
 *
 * Features:
 * - MediaPoster with fallback icon support
 * - Optional action buttons (toggle complete, recommend, remove)
 * - Status badges for items without actions
 * - Personal and critic ratings display
 * - Genre/category chips
 * - Responsive hover effects
 *
 * @example
 * // Movie with director
 * <MediaListItem
 *   title="Inception"
 *   subtitle="Christopher Nolan"
 *   mediaType="movie"
 *   year={2010}
 *   genres="Action, Sci-Fi"
 * />
 *
 * @example
 * // Book with author
 * <MediaListItem
 *   title="1984"
 *   subtitle="George Orwell"
 *   category="Dystopian"
 *   year={1949}
 *   personalRating={5}
 * />
 */
const MediaListItem: React.FC<MediaListItemProps> = ({
  id,
  title,
  subtitle,
  posterUrl,
  year,
  personalRating,
  criticRating,
  audienceRating,
  status,
  isCompleted,
  onToggleComplete,
  onRecommend,
  onRemove,
  onClick: _onClick, // Unused after removing edit button from accordion header
  description,
  mediaType,
  category,
  genres,
  externalId,
  releaseDate: _releaseDate,
  artist,
  album,
  trackDuration,
  trackCount,
  previewUrl,
  developer,
  platforms,
  metacritic,
  playtime,
  authors,
  publisher,
  isbn,
  pageCount,
}) => {
  // State for detailed info
  const [details, setDetails] = useState<DetailedMediaInfo | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Fetch detailed info when accordion expands (only for movies/TV)
  useEffect(() => {
    if (
      isExpanded &&
      !details &&
      externalId &&
      mediaType &&
      (mediaType === "movie" || mediaType === "tv")
    ) {
      setLoadingDetails(true);
      fetchDetailedMediaInfo(externalId, mediaType)
        .then((info) => {
          setDetails(info);
        })
        .catch((err) => {
          logger.error("Failed to load media details", err);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }, [isExpanded, details, externalId, mediaType]);

  // Build custom actions for media-specific buttons
  const customActions = [];

  // Add recommend button if available and item is completed
  if (isCompleted && onRecommend) {
    customActions.push({
      icon: <Lightbulb className="w-4 h-4" />,
      onClick: () => onRecommend(id),
      variant: "secondary" as const,
      ariaLabel: "Recommend to friends",
      className:
        "!border-primary/40 !bg-primary/10 !text-primary hover:!bg-primary/20 hover:!border-primary/60",
    });
  }

  // Add toggle complete button
  if (onToggleComplete) {
    customActions.push({
      icon: isCompleted ? (
        <RotateCcw className="w-4 h-4" />
      ) : (
        <Check className="w-4 h-4" />
      ),
      onClick: () => onToggleComplete(id),
      variant: isCompleted ? ("subtle" as const) : ("secondary" as const),
      ariaLabel: isCompleted ? "Mark as incomplete" : "Mark as complete",
      className: isCompleted
        ? ""
        : "!border-primary/30 dark:!border-primary-light/30 !bg-primary/5 dark:!bg-primary-light/5 !text-primary dark:!text-primary-light hover:!bg-primary/10 dark:hover:!bg-primary-light/10 hover:!border-primary/40 dark:hover:!border-primary-light/40",
    });
  }

  // Header content (always visible)
  const headerContent = (
    <div className="flex gap-4 items-start">
      {/* Poster/Icon */}
      <div className="flex-shrink-0">
        <MediaPoster
          src={posterUrl}
          alt={title}
          size="sm"
          aspectRatio="2/3"
          fallbackIcon={Book}
          showOverlay={false}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {/* Movie/TV Badge - only show for movies and TV */}
          {mediaType === "tv" && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded whitespace-nowrap">
              TV
            </span>
          )}
          {mediaType === "movie" && (
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded whitespace-nowrap">
              Movie
            </span>
          )}
          {/* Genre Chips - show for all media types */}
          {(category || genres) && (
            <GenreChips
              genres={category ? [category] : genres || ""}
              size="sm"
            />
          )}
          {/* Status Badge */}
          {status && <StatusBadge status={status} size="sm" />}
        </div>

        {/* Subtitle shows creator info (director/author/artist/developer) */}
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}

        {/* Year and Runtime */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {year && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-nowrap">
              <Calendar className="w-3 h-3" />
              {year}
            </span>
          )}
          {details && details.runtime && (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-nowrap">
              <Clock className="w-3 h-3" />
              {(() => {
                const totalMinutes =
                  typeof details.runtime === "string"
                    ? parseInt(details.runtime)
                    : details.runtime;
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return hours > 0
                  ? `${hours} ${hours === 1 ? "hour" : "hours"}${
                      minutes > 0
                        ? ` ${minutes} ${minutes === 1 ? "minute" : "minutes"}`
                        : ""
                    }`
                  : `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
              })()}
            </span>
          )}
        </div>

        {/* Ratings */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {personalRating !== undefined && personalRating > 0 && (
            <div className="flex items-center gap-1">
              <StarRating
                rating={personalRating}
                onRatingChange={() => {}}
                readonly={true}
                showClearButton={false}
                size="sm"
              />
            </div>
          )}
          {criticRating !== undefined && criticRating > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {criticRating}% Critics
            </span>
          )}
          {audienceRating !== undefined && audienceRating > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {audienceRating}% Audience
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Expanded content (shown when accordion opens)
  const expandedContent = (
    <MediaDetailsContent
      title={title}
      description={description}
      details={details}
      loadingDetails={loadingDetails}
      mediaType={mediaType}
      externalId={externalId}
      isCompleted={isCompleted}
      onOpenReview={() => setIsReviewModalOpen(true)}
      artist={artist}
      album={album}
      trackDuration={trackDuration}
      trackCount={trackCount}
      previewUrl={previewUrl}
      genre={category || (genres ? genres.split(",")[0].trim() : undefined)}
      year={year}
      developer={developer}
      platforms={platforms}
      metacritic={metacritic}
      playtime={playtime}
      pageCount={pageCount}
      authors={authors}
      publisher={publisher}
      isbn={isbn}
    />
  );

  return (
    <>
      <AccordionListCard
        onDelete={onRemove ? () => onRemove(id) : undefined}
        expandedContent={expandedContent}
        customActions={customActions.length > 0 ? customActions : undefined}
        onExpandChange={setIsExpanded}
      >
        {headerContent}
      </AccordionListCard>

      {/* Review Modal - Only for watched items */}
      {externalId && mediaType && isCompleted && (
        <MediaReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          externalId={externalId}
          mediaType={mediaType}
          title={title}
        />
      )}
    </>
  );
};

export default MediaListItem;
