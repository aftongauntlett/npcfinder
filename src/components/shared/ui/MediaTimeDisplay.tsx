/**
 * MediaTimeDisplay Component
 * 
 * Shared component for displaying time values consistently across media players and timers.
 * Uses tabular numbers and tight tracking for optimal readability.
 */

import React from "react";

interface MediaTimeDisplayProps {
  /** Time value in seconds */
  seconds: number;
  /** Display format: 'digital' (MM:SS or HH:MM:SS) or 'countdown' (same but optimized for timers) */
  format?: "digital" | "countdown";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom className for additional styling */
  className?: string;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

const MediaTimeDisplay: React.FC<MediaTimeDisplayProps> = ({
  seconds,
  format = "digital",
  size = "md",
  className = "",
}) => {
  const formattedTime = formatTime(seconds);

  // Size classes
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-2xl",
  };

  // Base classes for all time displays
  const baseClasses = "font-semibold tabular-nums";

  // Format-specific classes
  const formatClasses = {
    digital: "text-gray-400 tracking-wide",
    countdown: "text-foreground dark:text-gray-200 tracking-tight",
  };

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${formatClasses[format]} ${className}`;

  return (
    <span className={combinedClasses} aria-label={`${seconds} seconds`}>
      {formattedTime}
    </span>
  );
};

export default MediaTimeDisplay;
