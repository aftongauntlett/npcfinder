/**
 * Board Content View
 *
 * Embedded board view for master-detail layout
 * Displays a single board with switchable view modes
 */

import React, { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/shared";
import KanbanBoard from "../../tasks/KanbanBoard";
import SimpleListView from "../../tasks/SimpleListView";
import { JobTrackerView } from "../../tasks/views/JobTrackerView";
import { RecipeListView } from "../../tasks/views/RecipeListView";
import BoardFormModal from "../../tasks/BoardFormModal";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import RecipeDetailModal from "../../tasks/RecipeDetailModal";
import RecipeFormModal from "../../tasks/RecipeFormModal";
import MarkdownToDoModal from "../../tasks/MarkdownToDoModal";
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
  const [viewRecipeTask, setViewRecipeTask] = useState<Task | null>(null);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleViewRecipe = (task: Task) => {
    setViewRecipeTask(task);
  };

  if (isLoading || !board) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading board...</div>
      </div>
    );
  }

  // For Job Tracker, always use the specialized view
  if (board.template_type === "job_tracker") {
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
            boardType={board.template_type || board.board_type}
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

  // For Recipe boards, use the specialized recipe view
  if (board.template_type === "recipe") {
    return (
      <div className="mx-auto px-6 max-w-[1600px] h-full flex flex-col">
        {/* Recipe View */}
        <div className="flex-1 overflow-auto">
          <RecipeListView
            boardId={boardId}
            onCreateTask={() => setShowCreateTask(true)}
            onViewRecipe={handleViewRecipe}
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
          <RecipeFormModal
            isOpen={showCreateTask}
            onClose={() => setShowCreateTask(false)}
            boardId={boardId}
          />
        )}

        {viewRecipeTask && (
          <RecipeDetailModal
            task={viewRecipeTask}
            isOpen={!!viewRecipeTask}
            onClose={() => setViewRecipeTask(null)}
            onEdit={() => {
              setSelectedTask(viewRecipeTask);
              setViewRecipeTask(null);
            }}
          />
        )}

        {selectedTask && (
          <RecipeFormModal
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            boardId={boardId}
            task={selectedTask}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto px-6 max-w-[1600px] h-full flex flex-col">
      {/* Board Header with Edit Button */}
      <div className="flex items-center justify-end mb-4">
        <Button
          variant="subtle"
          size="sm"
          onClick={() => setShowEditModal(true)}
          icon={<Settings className="w-4 h-4" />}
        >
          Edit Board
        </Button>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-auto">
        {board.template_type === "markdown" || board.board_type === "list" ? (
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

      {showCreateTask &&
        (board.template_type === "markdown" || board.board_type === "list" ? (
          <MarkdownToDoModal
            isOpen={showCreateTask}
            onClose={() => setShowCreateTask(false)}
            boardId={boardId}
          />
        ) : (
          <CreateTaskModal
            isOpen={showCreateTask}
            onClose={() => setShowCreateTask(false)}
            boardId={boardId}
            boardType={board.template_type || board?.board_type}
          />
        ))}

      {selectedTask &&
        (board.template_type === "markdown" || board.board_type === "list" ? (
          <MarkdownToDoModal
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            boardId={boardId}
            task={selectedTask}
          />
        ) : (
          <TaskDetailModal
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        ))}
    </div>
  );
};

export default BoardContentView;
