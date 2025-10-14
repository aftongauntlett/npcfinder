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
  subtitle: _subtitle,
  posterUrl,
  year,
  personalRating,
  criticRating: _criticRating,
  audienceRating: _audienceRating,
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
        className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group hover:scale-105"
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick(id);
          }
        }}
        aria-label={`View details for ${title}`}
      >
        {/* Poster Image - Taller aspect ratio for grid */}
        <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${title} poster`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Hide broken images and show fallback
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent && !parent.querySelector(".fallback-icon")) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "fallback-icon absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800";
                  fallback.innerHTML =
                    '<svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg><span class="text-xs">No Image</span>';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800">
              <Eye className="w-16 h-16 mb-2" aria-hidden="true" />
              <span className="text-xs">No Image</span>
            </div>
          )}

          {/* Status Badge */}
          {status && (
            <div
              className={`absolute top-2 right-2 ${getStatusColor()} text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium shadow-lg`}
              aria-label={getStatusLabel()}
            >
              {getStatusIcon()}
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
