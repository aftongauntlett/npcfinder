/**
 * BoardCard Component
 *
 * Specialized card component for board display in shared cards directory
 * Uses the enhanced Card component and new design system
 */

import React, { useMemo } from "react";
import { Lock, LockOpen, ListTodo } from "lucide-react";
import Chip from "../ui/Chip";
import AccordionCard from "../common/AccordionCard";
import { getTaskIconOptionByName } from "@/utils/taskIcons";
import { withOpacity } from "@/data/landingTheme";
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
  // Get icon for board
  const taskIconOption = useMemo(
    () => getTaskIconOptionByName(board.icon),
    [board.icon]
  );
  const BoardIcon = taskIconOption?.icon ?? ListTodo;
  const isLucideIcon = taskIconOption == null;
  const iconColor = board.icon_color ?? undefined;
  const iconContainerStyle = useMemo(() => {
    if (!iconColor) return undefined;
    return {
      backgroundColor: withOpacity(iconColor, 0.14),
    } as React.CSSProperties;
  }, [iconColor]);
  const iconStyle = useMemo(() => {
    if (!iconColor) return undefined;
    return { color: iconColor } as React.CSSProperties;
  }, [iconColor]);

  // Board icon element
  const boardIcon = (
    <span
      className="icon-container-lg flex-shrink-0"
      style={iconContainerStyle}
      aria-hidden="true"
    >
      {isLucideIcon ? (
        <BoardIcon className="w-5 h-5" style={iconStyle} />
      ) : (
        <BoardIcon className="w-5 h-5" weight="regular" style={iconStyle} />
      )}
    </span>
  );

  // Privacy icon - just the lock/unlock icon, no text or chip
  const privacyIcon = board.is_public ? (
    <LockOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
  ) : (
    <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
  );

  // Task count chip to show next to title
  const taskCountChip =
    board.total_tasks > 0 ? (
      <Chip
        size="sm"
        className="text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        {board.total_tasks}
      </Chip>
    ) : null;

  // Subtitle showing only starter badge (no task count)
  const subtitle = isStarter ? (
    <div className="flex items-center gap-2">
      <Chip variant="primary" size="sm">
        Starter
      </Chip>
    </div>
  ) : undefined;

  // Expanded content - template-aware preview
  const expandedContent = (
    <div>
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
      icon={boardIcon}
      title={board.name}
      subtitle={subtitle}
      headerChips={taskCountChip}
      privacyIcon={privacyIcon}
      expandedContent={expandedContent}
      onClick={onClick}
      onEdit={onEdit}
      onDelete={onDelete}
      onOpenInTab={onOpenInTab}
    />
  );
};

export default BoardCard;
