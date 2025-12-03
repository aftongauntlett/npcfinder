/**
 * SimpleBoardCard Component
 *
 * Displays a board as a simple card (non-accordion) using the shared Card UI
 * Replaces accordion-based BoardCard in TemplateView for cleaner board listing
 */

import React from "react";
import {
  LayoutGrid,
  Briefcase,
  ShoppingCart,
  Heart,
  BookOpen,
  Home,
  Dumbbell,
  Plane,
  DollarSign,
  Code,
  Music,
  Camera,
  Star,
  Target,
  CheckSquare,
  Calendar,
  Users,
  Package,
  TrendingUp,
  Lightbulb,
  Pencil,
  Trash2,
} from "lucide-react";
import Card from "../shared/ui/Card";
import Button from "../shared/ui/Button";
import { useTheme } from "../../hooks/useTheme";
import { lightenColor, darkenColor } from "../../styles/colorThemes";
import type { BoardWithStats } from "../../services/tasksService.types";

// Map icon labels to Lucide components
const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Briefcase,
  Shopping: ShoppingCart,
  Health: Heart,
  Reading: BookOpen,
  Home,
  Fitness: Dumbbell,
  Travel: Plane,
  Finance: DollarSign,
  Development: Code,
  Music,
  Creative: Camera,
  Favorites: Star,
  Goals: Target,
  Tasks: CheckSquare,
  Events: Calendar,
  Team: Users,
  Projects: Package,
  Growth: TrendingUp,
  Ideas: Lightbulb,
};

interface SimpleBoardCardProps {
  board: BoardWithStats;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isStarter?: boolean;
}

const SimpleBoardCard: React.FC<SimpleBoardCardProps> = ({
  board,
  onClick,
  onEdit,
  onDelete,
  isStarter = false,
}) => {
  const { themeColor } = useTheme();

  // Get the icon component
  const IconComponent =
    board.icon && ICON_MAP[board.icon] ? ICON_MAP[board.icon] : LayoutGrid;

  return (
    <Card
      variant="interactive"
      hover="none"
      spacing="md"
      className="group relative hover:bg-gray-900/[0.04] dark:hover:bg-gray-900"
      onClick={onClick}
      clickable={!!onClick}
    >
      {/* Action Buttons - visible on hover (desktop) or always (mobile) */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          {onEdit && (
            <Button
              variant="subtle"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 w-8 p-0"
              aria-label="Edit board"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-8 w-8 p-0"
              aria-label="Delete board"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Board Content */}
      <div className="flex items-start gap-4 pr-20 sm:pr-0">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${board.color || themeColor}20` }}
        >
          <IconComponent
            className="w-6 h-6"
            style={{ color: board.color || themeColor }}
          />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Badges */}
          <div className="flex items-start gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex-1">
              {board.name}
            </h3>
            {isStarter && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                style={{
                  backgroundColor: lightenColor(themeColor, 0.85),
                  color: darkenColor(themeColor, 0.3),
                }}
              >
                Starter
              </span>
            )}
          </div>

          {/* Task Count */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {board.total_tasks || 0} task{board.total_tasks !== 1 ? "s" : ""}
          </p>

          {/* Description */}
          {board.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {board.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SimpleBoardCard;
