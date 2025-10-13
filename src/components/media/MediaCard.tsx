import React from "react";
import { Star, Eye, Check, Clock } from "lucide-react";
import SparkleEffect from "../effects/SparkleEffect";

type MediaStatus =
  | "watched"
  | "to-watch"
  | "played"
  | "to-play"
  | "read"
  | "to-read";

interface MediaCardProps {
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

const MediaCard: React.FC<MediaCardProps> = ({
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
  const getStatusIcon = () => {
    switch (status) {
      case "watched":
      case "played":
      case "read":
        return <Check className="w-4 h-4" />;
      case "to-watch":
      case "to-play":
      case "to-read":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "watched":
      case "played":
      case "read":
        return "bg-green-500";
      case "to-watch":
      case "to-play":
      case "to-read":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = () => {
    const labels: Record<MediaStatus, string> = {
      watched: "Watched",
      "to-watch": "To Watch",
      played: "Played",
      "to-play": "To Play",
      read: "Read",
      "to-read": "To Read",
    };
    return status ? labels[status] : "";
  };

  return (
    <SparkleEffect intensity="low">
      <article
        onClick={() => onClick(id)}
        className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick(id);
          }
        }}
        aria-label={`View details for ${title}`}
      >
        {/* Poster Image */}
        <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${title} poster`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Eye className="w-12 h-12" aria-hidden="true" />
            </div>
          )}

          {/* Status Badge */}
          {status && (
            <div
              className={`absolute top-2 right-2 ${getStatusColor()} text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium`}
              aria-label={getStatusLabel()}
            >
              {getStatusIcon()}
            </div>
          )}

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {subtitle}
            </p>
          )}
          {year && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {year}
            </p>
          )}

          {/* Ratings */}
          <div className="flex items-center gap-4 text-sm">
            {/* Personal Rating */}
            {personalRating !== undefined && (
              <div
                className="flex items-center gap-1 text-primary"
                aria-label={`Personal rating: ${personalRating} stars`}
              >
                <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                <span className="font-medium">{personalRating}</span>
              </div>
            )}

            {/* Critic Rating */}
            {criticRating !== undefined && (
              <div
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400"
                aria-label={`Critic rating: ${criticRating} percent`}
              >
                <span className="text-xs" aria-hidden="true">
                  🍅
                </span>
                <span>{criticRating}%</span>
              </div>
            )}

            {/* Audience Rating */}
            {audienceRating !== undefined && (
              <div
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400"
                aria-label={`Audience rating: ${audienceRating}`}
              >
                <Star className="w-3 h-3" aria-hidden="true" />
                <span>{audienceRating}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </SparkleEffect>
  );
};

export default MediaCard;
