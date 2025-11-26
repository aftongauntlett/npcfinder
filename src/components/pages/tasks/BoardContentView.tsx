/**
 * Board Content View
 *
 * Embedded board view for master-detail layout
 * Displays a single board with switchable view modes
 */

import React, { useState } from "react";
import { Settings } from "lucide-react";
import KanbanBoard from "../../tasks/KanbanBoard";
import SimpleListView from "../../tasks/SimpleListView";
import { JobTrackerView } from "../../tasks/views/JobTrackerView";
import BoardFormModal from "../../tasks/BoardFormModal";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import { useBoard } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";

interface BoardContentViewProps {
  boardId: string;
  onBack?: () => void;
}

const BoardContentView: React.FC<BoardContentViewProps> = ({ boardId }) => {
  const { data: board, isLoading } = useBoard(boardId);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
  };

  if (isLoading || !board) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading board...</div>
      </div>
    );
  }

  // For Job Tracker, always use the specialized view
  if (board.board_type === "job_tracker") {
    return (
      <div className="mx-auto px-6 max-w-[1600px] h-full flex flex-col">
        {/* Job Tracker View */}
        <div className="flex-1 overflow-auto">
          <JobTrackerView
            boardId={boardId}
            onCreateTask={() => setShowCreateTask(true)}
            onEditTask={handleEditTask}
          />
        </div>

        {/* Modals */}
        {showEditModal && (
          <BoardFormModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            board={board}
          />
        )}

        {showCreateTask && (
          <CreateTaskModal
            isOpen={showCreateTask}
            onClose={() => setShowCreateTask(false)}
            boardId={boardId}
            boardType={board.board_type}
          />
        )}

        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto px-6 max-w-[1600px] h-full flex flex-col">
      {/* Board Header with Edit Button */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
          Edit Board
        </button>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-auto">
        {board.board_type === "list" ? (
          <SimpleListView
            boardId={boardId}
            onCreateTask={() => setShowCreateTask(true)}
            onEditTask={handleEditTask}
          />
        ) : (
          <KanbanBoard
            boardId={boardId}
            onCreateTask={() => setShowCreateTask(true)}
            onEditTask={handleEditTask}
          />
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <BoardFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          board={board}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          isOpen={showCreateTask}
          onClose={() => setShowCreateTask(false)}
          boardId={boardId}
          boardType={board?.board_type}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default BoardContentView;
