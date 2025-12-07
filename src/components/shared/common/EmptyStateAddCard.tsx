/**
 * EmptyStateAddCard Component
 *
 * Unified empty state component for all "add item" scenarios across the app.
 * Used when a list/collection is empty and the user needs to add their first item.
 *
 * Design:
 * - Dark theme with subtle transparency (bg-gray-800/50)
 * - Large icon with hover effects
 * - Theme color integration on hover/focus
 * - Fully keyboard accessible
 *
 * @example
 * ```tsx
 * <EmptyStateAddCard
 *   icon={Film}
 *   title="Your Movie & TV list is empty"
 *   description="You haven't added any movies or TV shows yet."
 *   onClick={() => setShowSearchModal(true)}
 *   ariaLabel="Add movies or TV shows to your watchlist"
 * />
 * ```
 */

import { useTheme } from "@/hooks/useTheme";
import { type LucideIcon } from "lucide-react";

interface EmptyStateAddCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function EmptyStateAddCard({
  icon: Icon,
  title,
  description,
  onClick,
  ariaLabel,
  className = "",
}: EmptyStateAddCardProps) {
  const { themeColor } = useTheme();

  // Theme color class mappings for Tailwind
  const borderHoverClass =
    {
      blue: "hover:border-blue-500/50",
      green: "hover:border-green-500/50",
      purple: "hover:border-purple-500/50",
      red: "hover:border-red-500/50",
      orange: "hover:border-orange-500/50",
      pink: "hover:border-pink-500/50",
      yellow: "hover:border-yellow-500/50",
    }[themeColor] || "hover:border-blue-500/50";

  const focusRingClass =
    {
      blue: "focus-visible:ring-blue-500",
      green: "focus-visible:ring-green-500",
      purple: "focus-visible:ring-purple-500",
      red: "focus-visible:ring-red-500",
      orange: "focus-visible:ring-orange-500",
      pink: "focus-visible:ring-pink-500",
      yellow: "focus-visible:ring-yellow-500",
    }[themeColor] || "focus-visible:ring-blue-500";

  const iconHoverClass =
    {
      blue: "group-hover:text-blue-500",
      green: "group-hover:text-green-500",
      purple: "group-hover:text-purple-500",
      red: "group-hover:text-red-500",
      orange: "group-hover:text-orange-500",
      pink: "group-hover:text-pink-500",
      yellow: "group-hover:text-yellow-500",
    }[themeColor] || "group-hover:text-blue-500";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || title}
      className={`
        group
        w-full
        px-16 py-20
        bg-gray-800/50
        border-2 border-gray-700
        rounded-xl
        transition-all duration-200
        hover:bg-gray-800/70
        ${borderHoverClass}
        focus-visible:outline-none
        focus-visible:ring-2
        ${focusRingClass}
        cursor-pointer
        ${className}
      `}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <Icon
          className={`
            w-16 h-16 mb-6
            text-gray-400
            transition-colors duration-200
            ${iconHoverClass}
          `}
        />
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">{description}</p>
      </div>
    </button>
  );
}
