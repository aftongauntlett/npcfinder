/**
 * BoardCard Component
 *
 * Displays a board in accordion style with template-aware preview
 */

import React, { useState } from "react";
import { Share2, Lock, LockOpen } from "lucide-react";
import AccordionCard from "../shared/common/AccordionCard";
import ShareBoardModal from "./ShareBoardModal";
import { useTheme } from "../../hooks/useTheme";
import { lightenColor, darkenColor } from "../../styles/colorThemes";
import { useBoardMembers } from "../../hooks/useTasksQueries";
import KanbanBoard from "./KanbanBoard";
import SimpleListView from "./SimpleListView";
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
  const { themeColor } = useTheme();
  const [showShareModal, setShowShareModal] = useState(false);
  const { data: members = [] } = useBoardMembers(board.id);

  // Privacy icon - just the lock/unlock icon, no text or chip
  const privacyIcon = board.is_public ? (
    <LockOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
  ) : (
    <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
  );

  // Subtitle showing only starter badge and sharing info
  const subtitle = isStarter || members.length > 0 ? (
    <div className="flex items-center gap-2">
      {isStarter && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: lightenColor(themeColor, 0.85),
            color: darkenColor(themeColor, 0.3),
          }}
        >
          Starter
        </span>
      )}
      {members.length > 0 && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: lightenColor(themeColor, 0.85),
            color: darkenColor(themeColor, 0.3),
          }}
        >
          <Share2 className="w-3 h-3" />
          {members.length}
        </span>
      )}
    </div>
  ) : undefined;

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
    <>
      <AccordionCard
        title={board.name}
        subtitle={subtitle}
        privacyIcon={privacyIcon}
        description={board.description || undefined}
        expandedContent={expandedContent}
        onEdit={onEdit}
        onDelete={onDelete}
        onShare={() => setShowShareModal(true)}
        onOpenInTab={!isMobile ? onOpenInTab : undefined}
        onClick={onClick}
      />

      {/* Share Board Modal */}
      <ShareBoardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        boardId={board.id}
        boardName={board.name}
      />
    </>
  );
};

export default BoardCard;
