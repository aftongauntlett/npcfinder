/**
 * BoardCard Component
 *
 * Displays a board in accordion style with inline Kanban view
 */

import React from "react";
import { LayoutGrid } from "lucide-react";
import AccordionCard from "../shared/common/AccordionCard";
import KanbanBoard from "./KanbanBoard";
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
}

const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onClick,
  onEdit,
  onDelete,
  onOpenInTab,
  onCreateTask,
  onEditTask,
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

  // Subtitle showing task count
  const subtitle = `${board.total_tasks || 0} task${
    board.total_tasks !== 1 ? "s" : ""
  }`;

  // Expanded content - embedded Kanban board
  const expandedContent = (
    <div className="mt-4">
      <KanbanBoard
        boardId={board.id}
        onCreateTask={onCreateTask || (() => {})}
        onEditTask={onEditTask || (() => {})}
      />
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
      onOpenInTab={onOpenInTab}
      onClick={onClick}
    />
  );
};

export default BoardCard;
