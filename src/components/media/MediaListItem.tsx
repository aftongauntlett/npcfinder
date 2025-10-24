import React from "react";
import { Star, Book, X, Check, Lightbulb, Undo2 } from "lucide-react";
import { STATUS_MAP, type MediaStatus } from "./mediaStatus";

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

  // Action buttons (optional)
  isCompleted?: boolean; // For watched/read status
  onToggleComplete?: (id: string | number) => void;
  onRecommend?: (id: string | number) => void;
  onRemove?: (id: string | number) => void;
  description?: string; // For overview/description text
}

/**
 * MediaListItem - Compact horizontal list view for media items
 * Optimized for items without poster images (e.g., books from APIs without covers)
 * Supports optional action buttons for complete/recommend/remove
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
}) => {
  const statusConfig = status ? STATUS_MAP[status] : null;
  const hasActions = onToggleComplete || onRecommend || onRemove;

  return (
    <div
      onClick={() => onClick(id)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 p-4"
    >
      <div className="flex gap-4 items-start">
        {/* Poster/Icon */}
        <div className="flex-shrink-0">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="w-16 h-20 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <Book className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h3>
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
            {statusConfig && !hasActions && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.colorClass}`}
              >
                <statusConfig.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{statusConfig.label}</span>
              </div>
            )}
          </div>

          {/* Ratings */}
          {!hasActions && (
            <div className="flex items-center gap-4 mt-2">
              {personalRating !== undefined && personalRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {personalRating}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Personal
                  </span>
                </div>
              )}
              {criticRating !== undefined && criticRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-purple-500" />
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
                  <Star className="w-4 h-4 text-blue-500" />
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
          <div
            className="flex items-center gap-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isCompleted ? (
              <>
                {/* Completed items: Delete (left) + Put Back (middle) + Recommend (right) */}
                {onRemove && (
                  <button
                    onClick={() => onRemove(id)}
                    className="p-2 text-danger hover:bg-danger-light dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label="Remove from list"
                    title="Remove"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {onToggleComplete && (
                  <button
                    onClick={() => onToggleComplete(id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                    aria-label="Mark as incomplete"
                    title="Put Back"
                  >
                    <Undo2 className="w-5 h-5" />
                  </button>
                )}
                {onRecommend && (
                  <button
                    onClick={() => onRecommend(id)}
                    className="p-2 text-success hover:bg-success-light dark:hover:bg-green-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    aria-label="Recommend to friends"
                    title="Recommend"
                  >
                    <Lightbulb className="w-5 h-5" />
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Incomplete items: Delete (left) + Mark Complete (right) */}
                {onRemove && (
                  <button
                    onClick={() => onRemove(id)}
                    className="p-2 text-danger hover:bg-danger-light dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label="Remove from list"
                    title="Remove"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {onToggleComplete && (
                  <button
                    onClick={() => onToggleComplete(id)}
                    className="p-2 text-success hover:bg-success-light dark:hover:bg-green-900/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    aria-label="Mark as complete"
                    title="Complete"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaListItem;
