import React from "react";
import { Plus } from "lucide-react";
import Button from "../../shared/ui/Button";
import { RecipeCard } from "../../shared/cards";
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
      {tasks.length === 0 ? (
        /* Empty State Card */
        <div
          onClick={() => onCreateTask()}
          className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Add Your First Recipe
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
            Save and organize your favorite recipes. Paste a recipe URL or
            manually enter details.
          </p>
        </div>
      ) : (
        <>
          {/* Add Recipe Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => onCreateTask()}
              variant="action"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Add Recipe</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          {/* Recipe List */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const recipeName =
                (task.item_data?.recipe_name as string) ||
                (task.item_data?.name as string) ||
                task.title;
              const category = task.item_data?.category as string | undefined;
              const prepTime = task.item_data?.prep_time as string;
              const cookTime = task.item_data?.cook_time as string;
              const totalTime = task.item_data?.total_time as string;
              const servings = task.item_data?.servings as string | number;
              const description =
                (task.item_data?.description as string) || task.description;
              const ingredients = task.item_data?.ingredients as
                | string[]
                | string;
              const instructions = task.item_data?.instructions as
                | string[]
                | string;
              const sourceUrl =
                (task.item_data?.recipe_url as string) ||
                (task.item_data?.source_url as string);
              const notes = task.item_data?.notes as string;

              // Parse ingredients and instructions if they're strings
              const ingredientsList = Array.isArray(ingredients)
                ? ingredients
                : ingredients
                ? ingredients.split("\n").filter(Boolean)
                : [];
              const instructionsList = Array.isArray(instructions)
                ? instructions
                : instructions
                ? instructions.split("\n").filter(Boolean)
                : [];

              return (
                <RecipeCard
                  key={task.id}
                  recipeName={recipeName}
                  category={category}
                  prepTime={prepTime}
                  cookTime={cookTime}
                  totalTime={totalTime}
                  servings={servings ? String(servings) : undefined}
                  description={description || undefined}
                  ingredients={ingredientsList}
                  instructions={instructionsList}
                  sourceUrl={sourceUrl}
                  notes={notes}
                  onEdit={() => onViewRecipe(task)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
