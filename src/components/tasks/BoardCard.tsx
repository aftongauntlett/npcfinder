/**
 * BoardCard Component
 *
 * Displays a board in accordion style with template-aware preview
 */

import React from "react";
import { LayoutGrid } from "lucide-react";
import AccordionCard from "../shared/common/AccordionCard";
import KanbanBoard from "./KanbanBoard";
import { JobTrackerView } from "./views/JobTrackerView";
import { RecipeListView } from "./views/RecipeListView";
import type { BoardWithStats } from "../../services/tasksService.types";
import type { Task } from "../../services/tasksService.types";

interface BoardCardProps {
  board: BoardWithStats;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onOpenInTab?: () => void;
  onCreateTask?: (sectionId?: string) => void;
  onEditTask?: (task: Task) => void;
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
  isMobile = false,
  isStarter = false,
}) => {
  // Board icon with color
  const icon = (
    <div
      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: `${board.color || "#9333ea"}20` }}
    >
      <LayoutGrid
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
        />
      ) : board.template_type === "recipe" ? (
        <RecipeListView
          boardId={board.id}
          onCreateTask={onCreateTask || (() => {})}
          onViewRecipe={() => {}} // No-op in preview
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
