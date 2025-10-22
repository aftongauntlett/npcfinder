import React from "react";
import { Star, Book } from "lucide-react";
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
}

/**
 * MediaListItem - Compact horizontal list view for media items
 * Optimized for items without poster images (e.g., books from APIs without covers)
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
}) => {
  const statusConfig = status ? STATUS_MAP[status] : null;

  return (
    <div
      onClick={() => onClick(id)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 p-4"
    >
      <div className="flex gap-4 items-center">
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
            </div>

            {/* Status Badge */}
            {statusConfig && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.colorClass}`}
              >
                <statusConfig.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{statusConfig.label}</span>
              </div>
            )}
          </div>

          {/* Ratings */}
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
        </div>
      </div>
    </div>
  );
};

export default MediaListItem;
