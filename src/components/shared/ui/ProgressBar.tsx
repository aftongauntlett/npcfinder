/**
 * ProgressBar Component
 * 
 * Shared horizontal progress bar component for media players, timers, and other progress indicators.
 * Supports interactive clicking for seeking/scrubbing and customizable appearance.
 */

import React from "react";

interface ProgressBarProps {
  /** Progress value as percentage (0-100) */
  progress: number;
  /** Optional click handler for seeking/scrubbing */
  onClick?: (percent: number) => void;
  /** Show hover thumb indicator */
  showThumb?: boolean;
  /** Color variant */
  variant?: "primary" | "success" | "warning" | "danger" | "neutral";
  /** Size variant */
  size?: "sm" | "md";
  /** Additional container padding */
  containerPadding?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  onClick,
  showThumb = true,
  variant = "primary",
  size = "md",
  containerPadding = false,
  className = "",
  ariaLabel = "Progress",
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    onClick(Math.max(0, Math.min(100, percent)));
  };

  // Size classes
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
  };

  // Variant classes for the progress fill
  const variantClasses = {
    primary: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    neutral: "bg-gray-500",
  };

  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={containerPadding ? "px-0.5" : ""}>
      <div
        className={`w-full bg-gray-200 dark:bg-gray-700/50 rounded-full ${
          onClick ? "cursor-pointer group" : ""
        } relative ${sizeClasses[size]} ${className}`}
        onClick={handleClick}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedProgress}
        aria-label={ariaLabel}
      >
        <div
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 relative ${variantClasses[variant]}`}
          style={{ width: `${clampedProgress}%` }}
        >
          {/* Hover thumb indicator */}
          {showThumb && onClick && (
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
