/**
 * Recipes Page
 *
 * Save and organize your favorite recipes
 */

import React, { useState, useMemo } from "react";
import AppLayout from "../../layouts/AppLayout";
import TemplateView from "./TemplateView";
import RecipeFormModal from "../../tasks/RecipeFormModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import { useBoards, useTasks } from "../../../hooks/useTasksQueries";

const RecipesPage: React.FC = () => {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskBoardId, setCreateTaskBoardId] = useState<
    string | undefined
  >();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const { data: boards = [] } = useBoards();
  const { data: tasks = [] } = useTasks();

  // Filter boards by template type
  const recipeBoards = useMemo(
    () => boards.filter((b) => b.template_type === "recipe"),
    [boards]
  );

  // Find task being edited
  const editingTask = useMemo(() => {
    if (!editingTaskId) return null;
    return tasks.find((t) => t.id === editingTaskId) || null;
  }, [editingTaskId, tasks]);

  // Handle create task from board
  const handleCreateTask = (boardId: string) => {
    setCreateTaskBoardId(boardId);
    setShowCreateTask(true);
  };

  // Handle edit task
  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  return (
    <AppLayout
      title="Recipes"
      description="Save and organize your favorite recipes"
    >
      <TemplateView
        templateType="recipe"
        boards={recipeBoards}
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
      />

      {/* Modals */}
      {showCreateTask && (
        <RecipeFormModal
          isOpen={showCreateTask}
          onClose={() => {
            setShowCreateTask(false);
            setCreateTaskBoardId(undefined);
          }}
          boardId={createTaskBoardId!}
        />
      )}

      {editingTask && (
        <TaskDetailModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTaskId(null)}
        />
      )}
    </AppLayout>
  );
};

export default RecipesPage;
