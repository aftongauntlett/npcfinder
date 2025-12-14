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
import Button from "../ui/Button";

interface EmptyStateAddCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  ariaLabel?: string;
  actionLabel?: string;
  className?: string;
}

const deriveActionLabel = (title: string) => {
  const match = title.match(/^Add Your First (.+)$/i);
  if (match?.[1]) return `Add ${match[1]}`;
  if (title.toLowerCase().includes("empty")) return "Add Item";
  return "Add";
};

export default function EmptyStateAddCard({
  icon: Icon,
  title,
  description,
  onClick,
  ariaLabel,
  actionLabel,
  className = "",
}: EmptyStateAddCardProps) {
  const { themeColor } = useTheme();
  const ctaLabel = actionLabel || deriveActionLabel(title);

  return (
    <div
      data-testid="empty-state-add-card"
      className={[
        "w-full",
        "px-10 py-14 sm:px-14 sm:py-16",
        "bg-gray-800/20",
        "border border-gray-700/60 border-dashed",
        "rounded-xl",
        "text-center",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col items-center justify-center">
        <div
          className="w-14 h-14 rounded-full bg-gray-800/30 border border-gray-700/50 flex items-center justify-center mb-5"
          style={{ borderColor: `${themeColor}30` }}
        >
          <Icon className="w-7 h-7 text-gray-400" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-gray-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          {description}
        </p>

        <div className="mt-6">
          <Button
            type="button"
            variant="primary"
            onClick={onClick}
            aria-label={ariaLabel || title}
            className="px-6"
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
