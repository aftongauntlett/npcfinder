import React from "react";
import {
  X,
  Check,
  Lightbulb,
  ArrowCounterClockwise,
  Book,
} from "@phosphor-icons/react";
import { type MediaStatus } from "./mediaStatus";
import ActionButtonGroup, { ActionConfig } from "../shared/ActionButtonGroup";
import GenreChips from "../shared/GenreChips";
import StatusBadge from "../shared/StatusBadge";
import StarRating from "../shared/StarRating";
import MediaPoster from "../shared/MediaPoster";

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
  onClick: (id: string | number) => void;
  mediaType?: "movie" | "tv"; // Add media type
  category?: string; // For books - display primary category
  genres?: string; // Comma-separated genre string

  // Action buttons (optional)
  isCompleted?: boolean; // For watched/read status
  onToggleComplete?: (id: string | number) => void;
  onRecommend?: (id: string | number) => void;
  onRemove?: (id: string | number) => void;
  description?: string; // For overview/description text
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
  onClick,
  isCompleted,
  onToggleComplete,
  onRecommend,
  onRemove,
  description,
  mediaType,
  category,
  genres,
}) => {
  const hasActions = onToggleComplete || onRecommend || onRemove;

  return (
    <div
      onClick={() => onClick(id)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 p-4"
    >
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
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {title}
                </h3>
                {/* Movie/TV Badge */}
                {mediaType && (
                  <>
                    {mediaType === "tv" ? (
                      <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                        TV
                      </span>
                    ) : (
                      <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                        Movie
                      </span>
                    )}
                  </>
                )}
                {/* Category/Genre Chips */}
                {(category || genres) && (
                  <GenreChips
                    genres={category ? [category] : genres || ""}
                    maxVisible={2}
                    size="sm"
                    className="flex-shrink-0"
                  />
                )}
              </div>
              {/* Subtitle shows creator info: director for movies/TV, authors for books, artist for music, platforms for games */}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {subtitle}
                </p>
              )}
              {year && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {year}
                </p>
              )}
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            {/* Status Badge */}
            {status && !hasActions && <StatusBadge status={status} size="sm" />}
          </div>

          {/* Ratings */}
          {!hasActions && (
            <div className="flex items-center gap-4 mt-2">
              {personalRating !== undefined && personalRating > 0 && (
                <div className="flex items-center gap-1">
                  <StarRating
                    rating={personalRating}
                    onRatingChange={() => {}}
                    readonly={true}
                    showClearButton={false}
                    size="sm"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Personal
                  </span>
                </div>
              )}
              {criticRating !== undefined && criticRating > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {criticRating}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Critics
                  </span>
                </div>
              )}
              {audienceRating !== undefined && audienceRating > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {audienceRating}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Audience
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {hasActions && (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <ActionButtonGroup
              actions={[
                ...(onRemove
                  ? [
                      {
                        id: "remove",
                        icon: <X size={18} weight="duotone" />,
                        label: "Remove from list",
                        onClick: () => onRemove(id),
                        variant: "danger" as const,
                        tooltip: "Remove",
                      },
                    ]
                  : []),
                ...(onToggleComplete
                  ? [
                      {
                        id: "toggle",
                        icon: isCompleted ? (
                          <ArrowCounterClockwise size={18} weight="duotone" />
                        ) : (
                          <Check size={18} weight="bold" />
                        ),
                        label: isCompleted
                          ? "Mark as incomplete"
                          : "Mark as complete",
                        onClick: () => onToggleComplete(id),
                        variant: (isCompleted ? "warning" : "success") as const,
                        tooltip: isCompleted ? "Put Back" : "Mark Complete",
                      },
                    ]
                  : []),
                ...(isCompleted && onRecommend
                  ? [
                      {
                        id: "recommend",
                        icon: <Lightbulb size={18} weight="duotone" />,
                        label: "Recommend to friends",
                        onClick: () => onRecommend(id),
                        variant: "success" as const,
                        tooltip: "Recommend",
                      },
                    ]
                  : []),
              ]}
              orientation="horizontal"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaListItem;
