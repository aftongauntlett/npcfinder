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
        focus-visible:outline-none
        focus-visible:ring-2
        cursor-pointer
        ${className}
      `}
      style={
        {
          "--theme-hover-border": `${themeColor}80`, // 50% opacity for border
          "--theme-focus-ring": themeColor,
        } as React.CSSProperties & {
          "--theme-hover-border": string;
          "--theme-focus-ring": string;
        }
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${themeColor}80`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
      }}
      onFocus={(e) => {
        e.currentTarget.style.setProperty("--tw-ring-color", themeColor);
      }}
      onBlur={(e) => {
        e.currentTarget.style.removeProperty("--tw-ring-color");
      }}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <Icon
          className="w-16 h-16 mb-6 text-gray-400 group-hover:transition-colors group-hover:duration-200"
          style={
            {
              "--icon-color": themeColor,
            } as React.CSSProperties & { "--icon-color": string }
          }
          onMouseOver={(e) => {
            (e.currentTarget as SVGElement).style.color = themeColor;
          }}
          onMouseOut={(e) => {
            (e.currentTarget as SVGElement).style.color = "";
          }}
        />
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">{description}</p>
      </div>
    </button>
  );
}
