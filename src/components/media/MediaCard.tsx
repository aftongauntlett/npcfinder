import React, { useState } from "react";
import { Star, Eye } from "lucide-react";
import SparkleEffect from "../effects/SparkleEffect";
import { STATUS_MAP, type MediaStatus } from "./mediaStatus";

interface MediaCardProps {
  id: string | number;
  title: string;
  posterUrl?: string;
  year?: string | number;
  personalRating?: number;
  status?: MediaStatus;
  onClick: (id: string | number) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  posterUrl,
  year,
  personalRating,
  status,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const statusConfig = status ? STATUS_MAP[status] : null;

  return (
    <SparkleEffect intensity="low">
      <article
        onClick={() => onClick(id)}
        className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group hover:scale-105"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault(); // Prevent page scroll on Space
            onClick(id);
          }
        }}
        aria-label={`View details for ${title}`}
      >
        {/* Poster Image - Taller aspect ratio for grid */}
        <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700">
          {posterUrl && !imgError ? (
            <img
              src={posterUrl}
              alt={`${title} poster`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800">
              <Eye className="w-16 h-16 mb-2" aria-hidden="true" />
              <span className="text-xs">No Image</span>
            </div>
          )}

          {/* Status Badge */}
          {statusConfig && (
            <div
              className={`absolute top-2 right-2 ${statusConfig.badgeColorClass} text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium shadow-lg`}
              aria-label={statusConfig.label}
            >
              <statusConfig.icon className="w-4 h-4" />
            </div>
          )}

          {/* Overlay on Hover - Shows title and quick info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            <h3 className="font-semibold text-sm text-white mb-1 line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center justify-between text-xs text-white/90">
              {year && <span>{year}</span>}
              {personalRating !== undefined && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{personalRating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Minimal bottom info - only visible on larger screens */}
        <div className="p-2 hidden sm:block">
          <h3 className="font-medium text-xs text-gray-900 dark:text-white line-clamp-1">
            {title}
          </h3>
        </div>
      </article>
    </SparkleEffect>
  );
};

export default MediaCard;
