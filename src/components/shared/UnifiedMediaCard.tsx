import React from "react";
import { motion } from "framer-motion";
import MediaPoster from "./MediaPoster";
import StatusBadge from "./StatusBadge";
import StarRating from "./StarRating";
import SparkleEffect from "../effects/SparkleEffect";

type MediaType = "movie" | "tv" | "book" | "game" | "music";

interface UnifiedMediaCardProps {
  id: string | number;
  title: string;
  subtitle?: string;
  posterUrl?: string;
  year?: string | number;
  personalRating?: number;
  status?: string;
  mediaType?: MediaType;
  onClick: (id: string | number) => void;
  showOverlay?: boolean;
  className?: string;
}

/**
 * UnifiedMediaCard - Primary reusable card component for grid/tile views of all media types
 *
 * This is the universal card component used across the application for displaying media items
 * in grid or tile layouts. It supports all media types (movie, tv, book, game, music) with
 * consistent design and interactions.
 *
 * Features:
 * - Poster image with intelligent fallback icons based on mediaType
 * - Hover overlay showing title, year, and rating
 * - Status badge for tracking progress (watching, reading, playing, etc.)
 * - Consistent hover effects and animations
 * - Responsive design with mobile optimizations
 * - Keyboard accessibility (Enter/Space to activate)
 *
 * When to use:
 * - Grid/tile views of media collections
 * - Card-based layouts (as opposed to list views)
 * - Browse pages, search results, recommendations
 *
 * For list views, use MediaListItem instead.
 *
 * Props:
 * @param {MediaType} mediaType - Determines icon fallback and type-specific styling
 *                                 (movie, tv, book, game, music)
 * @param {string} subtitle - Creator info: director (movies/TV), author (books),
 *                           artist (music), developer (games if available)
 * @param {boolean} showOverlay - Whether to show title/year/rating on hover (default: true)
 * @param {string} status - Display status badge (e.g., "watching", "read", "playing")
 *
 * @example
 * // Movie card
 * <UnifiedMediaCard
 *   mediaType="movie"
 *   title="Inception"
 *   subtitle="Christopher Nolan"
 *   year={2010}
 *   posterUrl="..."
 *   personalRating={5}
 *   onClick={handleClick}
 * />
 *
 * @example
 * // Book card without overlay
 * <UnifiedMediaCard
 *   mediaType="book"
 *   title="1984"
 *   subtitle="George Orwell"
 *   showOverlay={false}
 *   onClick={handleClick}
 * />
 */
export default function UnifiedMediaCard({
  id,
  title,
  subtitle,
  posterUrl,
  year,
  personalRating,
  status,
  mediaType,
  onClick,
  showOverlay = true,
  className = "",
}: UnifiedMediaCardProps) {
  const handleClick = () => {
    onClick(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <SparkleEffect>
      <motion.div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer ${className}`}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        aria-label={`View details for ${title}`}
      >
        {/* Status Badge */}
        {status && (
          <div className="absolute top-2 right-2 z-10">
            <StatusBadge status={status} mediaType={mediaType} size="sm" />
          </div>
        )}

        {/* Poster with Overlay */}
        <div className="relative aspect-[2/3]">
          <MediaPoster
            src={posterUrl}
            alt={title}
            showOverlay={showOverlay}
            overlayContent={
              showOverlay ? (
                <div className="space-y-2">
                  <h3 className="text-white font-bold text-lg line-clamp-2">
                    {title}
                  </h3>
                  {year && <p className="text-white/90 text-sm">{year}</p>}
                  {personalRating && (
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
                </div>
              ) : undefined
            }
          />
        </div>

        {/* Bottom Info (Minimal, hidden on mobile) */}
        <div className="hidden sm:block p-3 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </motion.div>
    </SparkleEffect>
  );
}
