/**
 * BoardCard Component
 *
 * Displays a board in accordion style with template-aware preview
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
} from "lucide-react";
import AccordionCard from "../shared/common/AccordionCard";
import KanbanBoard from "./KanbanBoard";
import SimpleListView from "./SimpleListView";
import { JobTrackerView } from "./views/JobTrackerView";
import { RecipeListView } from "./views/RecipeListView";
import type { BoardWithStats } from "../../services/tasksService.types";
import type { Task } from "../../services/tasksService.types";

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

interface BoardCardProps {
  board: BoardWithStats;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onOpenInTab?: () => void;
  onCreateTask?: (sectionId?: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  isMobile?: boolean;
  isStarter?: boolean;
}

const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onClick,
  onEdit,
  onDelete,
  onOpenInTab,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  isMobile = false,
  isStarter = false,
}) => {
  // Get the icon component
  const IconComponent =
    board.icon && ICON_MAP[board.icon] ? ICON_MAP[board.icon] : LayoutGrid;

  // Board icon with color
  const icon = (
    <div
      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: `${board.color || "#9333ea"}20` }}
    >
      <IconComponent
        className="w-5 h-5"
        style={{ color: board.color || "#9333ea" }}
      />
    </div>
  );

  // Subtitle showing task count and starter badge
  const subtitle = (
    <div className="flex items-center gap-2">
      <span>
        {board.total_tasks || 0} task{board.total_tasks !== 1 ? "s" : ""}
      </span>
      {isStarter && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
          Starter
        </span>
      )}
    </div>
  );

  // Expanded content - template-aware preview
  const expandedContent = (
    <div className="mt-4">
      {board.template_type === "job_tracker" ? (
        <JobTrackerView
          boardId={board.id}
          onCreateTask={onCreateTask || (() => {})}
          onEditTask={onEditTask || (() => {})}
          onDeleteTask={onDeleteTask}
        />
      ) : board.template_type === "recipe" ? (
        <RecipeListView
          boardId={board.id}
          onCreateTask={onCreateTask || (() => {})}
          onViewRecipe={() => {}} // No-op in preview
        />
      ) : board.template_type === "markdown" || board.board_type === "list" ? (
        <SimpleListView
          boardId={board.id}
          onCreateTask={onCreateTask || (() => {})}
          onEditTask={onEditTask || (() => {})}
        />
      ) : (
        <KanbanBoard
          boardId={board.id}
          onCreateTask={onCreateTask || (() => {})}
          onEditTask={onEditTask || (() => {})}
        />
      )}
    </div>
  );

  return (
    <AccordionCard
      icon={icon}
      title={board.name}
      subtitle={subtitle}
      description={board.description || undefined}
      expandedContent={expandedContent}
      onEdit={onEdit}
      onDelete={onDelete}
      onOpenInTab={!isMobile ? onOpenInTab : undefined}
      onClick={onClick}
    />
  );
};

export default BoardCard;
