import React, { useState } from "react";
import { Star, Eye } from "lucide-react";
import SparkleEffect from "../../effects/SparkleEffect";

interface BookCardProps {
  id: string | number;
  title: string;
  author?: string | null;
  thumbnailUrl?: string | null;
  year?: string | number;
  personalRating?: number | null;
  status?: "reading" | "read";
  onClick: (id: string | number) => void;
}

const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  author,
  thumbnailUrl,
  year,
  personalRating,
  status,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const statusConfig = status
    ? {
        reading: { label: "Reading", color: "bg-blue-100 text-blue-700" },
        read: { label: "Read", color: "bg-green-100 text-green-700" },
      }[status]
    : null;

  return (
    <SparkleEffect intensity="low">
      <article
        onClick={() => onClick(id)}
        className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group hover:scale-105"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(id);
          }
        }}
        aria-label={`View details for ${title}`}
      >
        {/* Book Cover - Taller aspect ratio for grid */}
        <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700">
          {thumbnailUrl && !imgError ? (
            <img
              src={thumbnailUrl}
              alt={`${title} cover`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Eye className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
          )}

          {/* Status Badge */}
          {statusConfig && (
            <div
              className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}
            >
              {statusConfig.label}
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="p-3 space-y-1">
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {title}
          </h3>
          {author && (
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {author}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            {year && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {year}
              </span>
            )}
            {personalRating && personalRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-medium">{personalRating}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </SparkleEffect>
  );
};

export default BookCard;
