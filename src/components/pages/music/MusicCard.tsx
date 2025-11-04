import React, { useState } from "react";
import { Star, Music } from "lucide-react";
import SparkleEffect from "../../effects/SparkleEffect";
import { getGenreColor } from "../../../utils/genreColors";

interface MusicCardProps {
  id: string;
  title: string;
  artist: string;
  albumCoverUrl?: string;
  year?: string | number;
  personalRating?: number;
  listened?: boolean;
  genre?: string | null;
  onClick: (id: string) => void;
}

/**
 * MusicCard - Album cover display for music library
 * Shows album art, title, artist, and rating
 * Simpler than MediaCard - no status badges or detail modal
 */
const MusicCard: React.FC<MusicCardProps> = ({
  id,
  title,
  artist,
  albumCoverUrl,
  year,
  personalRating,
  listened,
  genre,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <SparkleEffect intensity="low">
      <article
        onClick={() => onClick(id)}
        className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-900 ${
          listened ? "opacity-60" : ""
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(id);
          }
        }}
        aria-label={`${title} by ${artist}`}
      >
        {/* Album Cover - Square aspect ratio */}
        <div className="relative aspect-square bg-gray-200 dark:bg-gray-700">
          {albumCoverUrl && !imgError ? (
            <img
              src={albumCoverUrl}
              alt={`${title} album cover`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800">
              <Music className="w-16 h-16 mb-2" aria-hidden="true" />
              <span className="text-xs">No Artwork</span>
            </div>
          )}

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            <h3 className="font-semibold text-sm text-white mb-1 line-clamp-2">
              {title}
            </h3>
            <p className="text-xs text-white/80 mb-1">{artist}</p>
            <div className="flex items-center justify-between text-xs text-white/90">
              {year && <span>{year}</span>}
              {personalRating !== undefined && personalRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{personalRating}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div className="p-3">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">
            {title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
            {artist}
          </p>
          {genre && (
            <div className="mt-2">
              <span
                className={`text-xs px-2 py-0.5 rounded ${getGenreColor(
                  genre
                )}`}
              >
                {genre}
              </span>
            </div>
          )}
        </div>
      </article>
    </SparkleEffect>
  );
};

export default MusicCard;
