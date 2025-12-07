import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/shared";
import { useTheme } from "../../hooks/useTheme";

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
}

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
   * Use this for simple single-action empty states.
   */
  onClick?: () => void;

  /**
   * Optional action buttons to display instead of making the whole card clickable.
   * Use this for multiple actions (e.g., "Add Movie" and "Import List")
   */
  actions?: ActionButton[];

  /**
   * Accessible label for the clickable card
   */
  ariaLabel?: string;
}

/**
 * @deprecated This component is deprecated. Use EmptyStateAddCard from @/components/shared instead.
 *
 * MediaEmptyState Component
 *
 * Unified empty state component for media pages (Movies, TV, Books, Games, Music).
 * Can render as either a clickable card, a card with action buttons, or a static informational display.
 *
 * Design:
 * - Matches the visual style shown in the screenshots
 * - Dark background with subtle transparency
 * - Large icon, title, and description
 * - Optional clickability (pass onClick to make entire card clickable)
 * - Optional action buttons (pass actions array for multiple buttons)
 * - Hover states with smooth transitions (when clickable)
 *
 * Replacement:
 * Use EmptyStateAddCard from @/components/shared for all new empty states.
 * This component will be removed in a future version.
 * @example
 * ```tsx
 * // Single clickable version (for simple cases)
 * <MediaEmptyState
 *   icon={Film}
 *   title="Add your first movie or show"
 *   description="Get started by adding to your watch list"
 *   onClick={() => setShowModal(true)}
 *   ariaLabel="Add your first movie or show"
 * />
 *
 * // Multiple actions version (for complex cases)
 * <MediaEmptyState
 *   icon={Film}
 *   title="Add your first movie or show"
 *   description="Search for a movie or import a list from Notion"
 *   actions={[
 *     { label: "Add Movie", onClick: () => setShowSearchModal(true), variant: "primary", icon: Plus },
 *     { label: "Import List", onClick: () => setShowImportModal(true), variant: "secondary", icon: Upload }
 *   ]}
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
  actions,
  ariaLabel,
}) => {
  const { themeColor } = useTheme();

  // If actions are provided, render with action buttons
  if (actions && actions.length > 0) {
    return (
      <div className="w-full bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 dark:border-gray-700 px-16 py-20 text-center">
        <Icon
          className="w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-500"
          aria-hidden="true"
        />
        <p className="text-white dark:text-white text-lg font-semibold mb-3">
          {title}
        </p>
        <p className="text-gray-400 dark:text-gray-400 text-sm max-w-md mx-auto mb-8">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant === "primary" ? "primary" : "secondary"}
              icon={
                action.icon ? <action.icon className="w-4 h-4" /> : undefined
              }
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // If onClick is provided, render as clickable button
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 dark:border-gray-700 px-16 py-20 text-center hover:bg-gray-800/70 dark:hover:bg-gray-800/70 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900 transition-all cursor-pointer"
        style={{
          borderColor: undefined,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${themeColor}80`; // 50% opacity
          const icon = e.currentTarget.querySelector("svg");
          if (icon) (icon as SVGElement).style.color = themeColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "";
          const icon = e.currentTarget.querySelector("svg");
          if (icon) (icon as SVGElement).style.color = "";
        }}
        onFocus={(e) => {
          e.currentTarget.style.setProperty("--tw-ring-color", themeColor);
        }}
        onBlur={(e) => {
          e.currentTarget.style.removeProperty("--tw-ring-color");
        }}
        aria-label={ariaLabel || title}
      >
        <Icon
          className="w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-500 transition-colors pointer-events-none"
          aria-hidden="true"
        />
        <p className="text-white dark:text-white text-lg font-semibold mb-3">
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
    <div className="w-full bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 dark:border-gray-700 px-16 py-20 text-center">
      <Icon
        className="w-16 h-16 mx-auto mb-6 text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      />
      <p className="text-white dark:text-white text-lg font-semibold mb-3">
        {title}
      </p>
      <p className="text-gray-400 dark:text-gray-400 text-sm max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
};

export default MediaEmptyState;
