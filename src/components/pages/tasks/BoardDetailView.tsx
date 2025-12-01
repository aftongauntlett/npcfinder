/**
 * Board Detail View
 * Displays a single board with Kanban layout and task management
 */

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, Plus } from "lucide-react";
import { useBoard } from "../../../hooks/useTasksQueries";
import KanbanBoard from "../../tasks/KanbanBoard";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import BoardFormModal from "../../tasks/BoardFormModal";
import MainLayout from "../../layouts/MainLayout";
import { Footer } from "@/components/shared";
import Button from "../../shared/ui/Button";
import type { Task } from "../../../services/tasksService.types";

const BoardDetailView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { data: board, isLoading } = useBoard(boardId!);

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditBoard, setShowEditBoard] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createTaskSectionId, setCreateTaskSectionId] = useState<
    string | undefined
  >();

  const handleCreateTask = (sectionId?: string) => {
    console.log("🎯 BoardDetailView - Creating task:", {
      boardId: board?.id,
      boardType: board?.board_type,
      templateType: board?.template_type,
      sectionId,
    });
    setCreateTaskSectionId(sectionId);
    setShowCreateTask(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600 dark:text-gray-400">
            Loading board...
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!board) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Board not found
            </h2>
            <Button
              onClick={() => void navigate("/app/tasks")}
              variant="primary"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Tasks
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => void navigate("/app/tasks")}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  aria-label="Back to tasks"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    {board.icon && (
                      <span className="text-2xl">{board.icon}</span>
                    )}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-heading">
                      {board.name}
                    </h1>
                  </div>
                  {board.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {board.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleCreateTask()}
                  variant="action"
                  size="md"
                  icon={<Plus className="w-5 h-5" />}
                  aria-label="Create new task"
                >
                  New Task
                </Button>
                <Button
                  onClick={() => setShowEditBoard(true)}
                  variant="subtle"
                  size="icon"
                  icon={<Settings className="w-5 h-5" />}
                  aria-label="Board settings"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1">
          <KanbanBoard
            boardId={board.id}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* Modals */}
      {showCreateTask && (
        <CreateTaskModal
          isOpen={showCreateTask}
          onClose={() => {
            setShowCreateTask(false);
            setCreateTaskSectionId(undefined);
          }}
          boardId={board.id}
          boardType={board.board_type}
          defaultSectionId={createTaskSectionId}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
        />
      )}

      {showEditBoard && (
        <BoardFormModal
          isOpen={showEditBoard}
          onClose={() => setShowEditBoard(false)}
          board={board}
        />
      )}
    </MainLayout>
  );
};

export default BoardDetailView;
