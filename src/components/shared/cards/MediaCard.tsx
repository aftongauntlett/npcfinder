import React from "react";
import Card from "../ui/Card";
import MediaPoster from "../media/MediaPoster";
import StatusBadge from "../common/StatusBadge";
import StarRating from "../common/StarRating";
import SparkleEffect from "../../effects/SparkleEffect";

type MediaType = "movie" | "tv" | "book" | "game" | "music";

interface MediaCardProps {
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
 * MediaCard - Specialized card component for media items
 * Wraps the base Card component with media-specific functionality
 */
const MediaCard: React.FC<MediaCardProps> = ({
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
}) => {
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
      <Card
        variant="interactive"
        hover="lift"
        spacing="none"
        className={`overflow-hidden ${className}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        clickable
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
          <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </Card>
    </SparkleEffect>
  );
};

export default MediaCard;
