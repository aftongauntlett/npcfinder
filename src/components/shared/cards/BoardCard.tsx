/**
 * BoardCard Component
 *
 * Specialized card component for board display in shared cards directory
 * Uses the enhanced Card component and new design system
 */

import React from "react";
import Chip from "../ui/Chip";
import AccordionCard from "../common/AccordionCard";
import KanbanBoard from "../../tasks/KanbanBoard";
import SimpleListView from "../../tasks/SimpleListView";
import { JobTrackerView } from "../../tasks/views/JobTrackerView";
import { RecipeListView } from "../../tasks/views/RecipeListView";
import type { BoardWithStats } from "@/services/tasksService.types";
import type { Task } from "@/services/tasksService.types";

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
  isStarter = false,
}) => {
  // Subtitle showing task count and starter badge
  const subtitle = (
    <div className="flex items-center gap-2">
      <span>
        {board.total_tasks || 0} task{board.total_tasks !== 1 ? "s" : ""}
      </span>
      {isStarter && (
        <Chip variant="primary" size="sm">
          Starter
        </Chip>
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
      title={board.name}
      subtitle={subtitle}
      expandedContent={expandedContent}
      onClick={onClick}
      onEdit={onEdit}
      onDelete={onDelete}
      onOpenInTab={onOpenInTab}
    />
  );
};

export default BoardCard;
