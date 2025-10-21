import React from "react";
import type { LucideIcon } from "lucide-react";

interface MediaEmptyStateProps {
  /**
   * Icon to display (Lucide icon component)
   */
  icon: LucideIcon;

  /**
   * Main title/heading
   */
  title: string;

  /**
   * Optional subtitle/description
   */
  description: string;

  /**
   * Optional click handler for the card. If provided, card is clickable.
   */
  onClick?: () => void;

  /**
   * Accessible label for the clickable card
   */
  ariaLabel?: string;
}

/**
 * MediaEmptyState Component
 *
 * Unified empty state component for media pages (Movies, TV, Books, Games, Music).
 * Can render as either a clickable card or a static informational display.
 *
 * Design:
 * - Matches the visual style shown in the screenshots
 * - Dark background with subtle transparency
 * - Large icon, title, and description
 * - Optional clickability (pass onClick to make it clickable)
 * - Hover states with smooth transitions (when clickable)
 *
 * @example
 * ```tsx
 * // Clickable version (for Watch List)
 * <MediaEmptyState
 *   icon={Film}
 *   title="Add your first movie or show"
 *   description="Get started by adding to your watch list"
 *   onClick={() => setShowModal(true)}
 *   ariaLabel="Add your first movie or show"
 * />
 *
 * // Static version (for Suggestions)
 * <MediaEmptyState
 *   icon={Film}
 *   title="No recommendations yet"
 *   description="When friends recommend movies or TV shows, they'll show up here"
 * />
 * ```
 */
const MediaEmptyState: React.FC<MediaEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  ariaLabel,
}) => {
  // If onClick is provided, render as clickable button
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 dark:border-gray-700 hover:border-purple-500/50 dark:hover:border-purple-500/50 p-12 text-center transition-all hover:bg-gray-800/70 dark:hover:bg-gray-800/70 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900"
        aria-label={ariaLabel || title}
      >
        <Icon
          className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-400 dark:group-hover:text-purple-400 transition-colors"
          aria-hidden="true"
        />
        <p className="text-white dark:text-white text-lg font-semibold mb-2">
          {title}
        </p>
        <p className="text-gray-400 dark:text-gray-400 text-sm max-w-md mx-auto">
          {description}
        </p>
      </button>
    );
  }

  // Otherwise, render as static informational display
  return (
    <div className="w-full bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 dark:border-gray-700 p-12 text-center">
      <Icon
        className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      />
      <p className="text-white dark:text-white text-lg font-semibold mb-2">
        {title}
      </p>
      <p className="text-gray-400 dark:text-gray-400 text-sm max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
};

export default MediaEmptyState;
