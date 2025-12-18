/**
 * Kanban View Component
 * 
 * Singleton view for the kanban board - displays a single kanban board
 * directly without accordion wrapper, with privacy and sharing controls.
 */

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "../../shared";
import PrivacyToggle from "../../shared/common/PrivacyToggle";
import ShareBoardModal from "../ShareBoardModal";
import KanbanBoard from "../KanbanBoard";
import { useSingletonBoard } from "../../../hooks/useSingletonBoard";
import { useBoard, useUpdateBoard } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";

interface KanbanViewProps {
  boardId?: string; // Optional - will use singleton if not provided
  onCreateTask: (sectionId?: string) => void;
  onEditTask: (task: Task) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  boardId: propBoardId,
  onCreateTask,
  onEditTask,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Get singleton board if no boardId provided
  const { data: singletonBoardId } = useSingletonBoard("kanban");
  const boardId = propBoardId || singletonBoardId;

  const { data: board } = useBoard(boardId || "");
  const updateBoard = useUpdateBoard();

  const handlePrivacyChange = (isPublic: boolean) => {
    if (!boardId) return;
    void updateBoard.mutateAsync({
      boardId,
      updates: { is_public: isPublic },
    });
  };

  if (!boardId || !board) {
    return (
      <div className="container mx-auto px-4 sm:px-6">
        <div className="bg-gray-800/50 border-2 border-gray-700 rounded-xl px-16 py-20 text-center">
          <p className="text-sm text-gray-400">Loading kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {/* Header with Privacy and Share Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-[140px]">
          <PrivacyToggle
            isPublic={board.is_public || false}
            onChange={handlePrivacyChange}
            variant="switch"
            contextLabel="board"
          />
        </div>
        <Button
          onClick={() => setShowShareModal(true)}
          variant="secondary"
          size="sm"
          icon={<Share2 className="w-4 h-4" />}
        >
          Share
        </Button>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        boardId={boardId}
        onCreateTask={(sectionId) => onCreateTask(sectionId)}
        onEditTask={onEditTask}
        lockColumnTitles={true}
      />

      {/* Share Modal */}
      <ShareBoardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        boardId={boardId}
      />
    </div>
  );
};
