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
import { useSingletonBoard } from "../../../hooks/useSingletonBoard";
import { usePageMeta } from "../../../hooks/usePageMeta";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Recipes",
  description: "Save and organize your favorite recipes",
  noIndex: true,
};

const RecipesPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const { data: boards = [] } = useBoards();
  const { data: tasks = [] } = useTasks();

  // Get or create the singleton recipe board
  const { data: recipeBoardId } = useSingletonBoard("recipe");

  // Filter boards by template type (should only be one)
  const recipeBoards = useMemo(
    () => boards.filter((b) => b.template_type === "recipe"),
    [boards]
  );

  // Find task being edited
  const editingTask = useMemo(() => {
    if (!editingTaskId) return null;
    return tasks.find((t) => t.id === editingTaskId) || null;
  }, [editingTaskId, tasks]);

  // Handle create task - no longer needs boardId param since we use singleton
  const handleCreateTask = () => {
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
      {showCreateTask && recipeBoardId && (
        <RecipeFormModal
          isOpen={showCreateTask}
          onClose={() => {
            setShowCreateTask(false);
          }}
          boardId={recipeBoardId}
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
