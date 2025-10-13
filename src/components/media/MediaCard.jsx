import React from "react";
import PropTypes from "prop-types";
import { Star, Eye, Check, Clock, Shuffle } from "lucide-react";
import SparkleEffect from "../effects/SparkleEffect";

/**
 * Reusable media card for displaying movies, TV shows, games, books
 */
const MediaCard = ({
  id,
  title,
  subtitle,
  posterUrl,
  year,
  personalRating,
  criticRating,
  audienceRating,
  status, // 'watched', 'to-watch', etc.
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

  return (
    <SparkleEffect intensity="low">
      <div
        onClick={() => onClick(id)}
        className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
      >
        {/* Poster Image */}
        <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Eye className="w-12 h-12" />
            </div>
          )}

          {/* Status Badge */}
          {status && (
            <div
              className={`absolute top-2 right-2 ${getStatusColor()} text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium`}
            >
              {getStatusIcon()}
            </div>
          )}

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-8 h-8 text-white" />
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
            {personalRating && (
              <div className="flex items-center gap-1 text-primary">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-medium">{personalRating}</span>
              </div>
            )}

            {/* Critic Rating */}
            {criticRating && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <span className="text-xs">🍅</span>
                <span>{criticRating}%</span>
              </div>
            )}

            {/* Audience Rating */}
            {audienceRating && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Star className="w-3 h-3" />
                <span>{audienceRating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </SparkleEffect>
  );
};

MediaCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  posterUrl: PropTypes.string,
  year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  personalRating: PropTypes.number,
  criticRating: PropTypes.number,
  audienceRating: PropTypes.number,
  status: PropTypes.oneOf([
    "watched",
    "to-watch",
    "played",
    "to-play",
    "read",
    "to-read",
  ]),
  onClick: PropTypes.func.isRequired,
};

export default MediaCard;
