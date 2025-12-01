import React from "react";
import { Plus, Clock, Users } from "lucide-react";
import Button from "../../shared/ui/Button";
import { useTasks } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";

interface RecipeListViewProps {
  boardId: string;
  onCreateTask: () => void;
  onViewRecipe: (task: Task) => void;
}

export const RecipeListView: React.FC<RecipeListViewProps> = ({
  boardId,
  onCreateTask,
  onViewRecipe,
}) => {
  const { data: tasks = [], isLoading } = useTasks(boardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          Loading recipes...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      {/* Add Recipe Button */}
      <div className="flex justify-end">
        <Button
          onClick={onCreateTask}
          variant="action"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Add Recipe</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Recipe Cards */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No recipes yet. Click "Add Recipe" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const recipeName =
              (task.item_data?.recipe_name as string) ||
              (task.item_data?.name as string) ||
              task.title;
            const prepTime = task.item_data?.prep_time as string;
            const cookTime = task.item_data?.cook_time as string;
            const totalTime = task.item_data?.total_time as string;
            const servings = task.item_data?.servings as string | number;
            const description =
              (task.item_data?.description as string) || task.description;

            return (
              <div
                key={task.id}
                onClick={() => onViewRecipe(task)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 hover:border-purple-500 dark:hover:border-purple-400 transition-colors cursor-pointer"
              >
                {/* Recipe Name */}
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {recipeName}
                </h3>

                {/* Description */}
                {description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {(totalTime || prepTime || cookTime) && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {totalTime || `${prepTime || ""} + ${cookTime || ""}`}
                      </span>
                    </div>
                  )}
                  {servings && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{servings} servings</span>
                    </div>
                  )}
                </div>

                {/* View Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewRecipe(task);
                  }}
                >
                  View Recipe
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
