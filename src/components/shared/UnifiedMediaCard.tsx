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
