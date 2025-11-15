import React, { useState } from "react";
import { Eye, LucideIcon } from "lucide-react";

interface MediaPosterProps {
  src?: string | null;
  alt: string;
  aspectRatio?: "2/3" | "1/1" | "16/9";
  size?: "sm" | "md" | "lg" | "xl";
  fallbackIcon?: LucideIcon;
  showOverlay?: boolean;
  overlayContent?: React.ReactNode;
  className?: string;
}

export default function MediaPoster({
  src,
  alt,
  aspectRatio = "2/3",
  size = "md",
  fallbackIcon: FallbackIcon = Eye,
  showOverlay = false,
  overlayContent,
  className = "",
}: MediaPosterProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-full sm:w-56",
    lg: "w-64",
    xl: "w-80",
  };

  const aspectRatioClasses = {
    "2/3": "aspect-[2/3]",
    "1/1": "aspect-square",
    "16/9": "aspect-[16/9]",
  };

  const aspectRatioClass = aspectRatioClasses[aspectRatio];

  const containerClass = `relative rounded-lg overflow-hidden shadow-md ${
    size === "sm" ? sizeClasses.sm : sizeClasses[size]
  } ${aspectRatioClass} ${className}`;

  if (!src || imgError) {
    return (
      <div className={containerClass}>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
          <FallbackIcon
            className={`${
              size === "sm" ? "w-8 h-8" : "w-16 h-16"
            } text-gray-400 dark:text-gray-600 mb-2`}
            aria-hidden="true"
          />
          <span className="text-xs text-gray-500 dark:text-gray-500">
            No Image
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />

      {showOverlay && overlayContent && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
          {overlayContent}
        </div>
      )}
    </div>
  );
}
