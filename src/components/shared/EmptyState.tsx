import React from "react";
import type { LucideIcon } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
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
  description?: string;

  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "subtle";
    leftIcon?: React.ReactNode;
  };

  /**
   * Icon color class
   * @default "text-gray-400 dark:text-gray-500"
   */
  iconColor?: string;

  /**
   * Icon size (Tailwind classes)
   * @default "w-12 h-12"
   */
  iconSize?: string;

  /**
   * Show button below instead of clickable card
   * @default false (renders as clickable card)
   */
  showButton?: boolean;
}

/**
 * EmptyState Component
 *
 * Reusable empty state card with consistent styling across the app.
 * Used for empty lists, no data scenarios, and call-to-action prompts.
 *
 * By default, renders as a clickable card (like admin panel style).
 * Pass `showButton={true}` to show a button below instead (like movie watchlist style).
 *
 * @example
 * ```tsx
 * // Clickable card (admin style - default)
 * <EmptyState
 *   icon={Plus}
 *   title="Create Invite Code"
 *   description="Get started by creating your first invite code"
 *   action={{
 *     label: "Create Invite Code",
 *     onClick: () => setShowModal(true),
 *     variant: "solid"
 *   }}
 * />
 *
 * // With button below (movie watchlist style)
 * <EmptyState
 *   icon={Film}
 *   title="Your watch list is empty"
 *   description="Add your first movie or show to get started"
 *   showButton={true}
 *   action={{
 *     label: "Add Movie/Show",
 *     onClick: () => setShowModal(true),
 *     variant: "outline",
 *     leftIcon: <Plus />
 *   }}
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  iconColor = "text-gray-400 dark:text-gray-500",
  iconSize = "w-12 h-12",
  showButton = false,
}) => {
  // Determine rendering style:
  // - If showButton is true, always show as static with button below
  // - If showButton is false (default), render as clickable card
  const isClickable = action && !showButton;

  const content = (
    <>
      <Icon
        className={`${iconSize} mx-auto mb-3 ${iconColor} ${
          isClickable ? "group-hover:text-primary transition-colors" : ""
        }`}
        aria-hidden="true"
      />
      <p
        className={`${
          isClickable
            ? "text-white dark:text-white"
            : "text-gray-900 dark:text-white"
        } text-lg font-semibold mb-1`}
      >
        {title}
      </p>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {description}
        </p>
      )}
      {action && showButton && (
        <Button
          variant={action.variant || "secondary"}
          onClick={action.onClick}
          icon={action.leftIcon}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </>
  );

  // If action exists but no description, render as a clickable card
  if (isClickable) {
    return (
      <button
        onClick={action.onClick}
        className="w-full bg-white/5 dark:bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 dark:border-white/10 hover:border-purple-500/50 p-8 text-center transition-all hover:bg-white/8 dark:hover:bg-white/8 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 dark:focus-visible:ring-offset-gray-900"
        aria-label={title}
      >
        {content}
      </button>
    );
  }

  // Otherwise, render as a static empty state
  return <div className="text-center py-12">{content}</div>;
};

export default EmptyState;
