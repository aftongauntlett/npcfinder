import React, { useState } from "react";
import {
  Plus,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Pencil,
} from "lucide-react";
import Button from "../../shared/ui/Button";
import { useTasks } from "../../../hooks/useTasksQueries";
import { useTheme } from "../../../hooks/useTheme";
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
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const { themeColor } = useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          Loading recipes...
        </div>
      </div>
    );
  }

  const toggleRecipe = (recipeId: string) => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  return (
    <div className="space-y-4 px-2 sm:px-0">
      {tasks.length === 0 ? (
        /* Empty State Card */
        <div
          onClick={() => onCreateTask()}
          className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
          style={
            {
              "--hover-border-color": themeColor,
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = themeColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "";
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <Plus className="w-8 h-8" style={{ color: themeColor }} />
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

          {/* Recipe Accordion List */}
          <div className="space-y-2">
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

              const isExpanded = expandedRecipeId === task.id;

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
                <div
                  key={task.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
                >
                  {/* Recipe Header - Clickable to expand/collapse */}
                  <button
                    onClick={() => toggleRecipe(task.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                            {recipeName}
                          </h3>
                          {category && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                              {category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metadata Row - Only visible when collapsed */}
                      {!isExpanded && (
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {(totalTime || prepTime || cookTime) && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {totalTime ||
                                  `${prepTime || ""} + ${cookTime || ""}`}
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
                      )}
                    </div>

                    {/* Edit button - visible when expanded */}
                    {isExpanded && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Pencil className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewRecipe(task);
                        }}
                        className="ml-4"
                      >
                        Edit
                      </Button>
                    )}
                  </button>

                  {/* Recipe Details - Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                      {/* Description */}
                      {description && (
                        <div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {description}
                          </p>
                        </div>
                      )}

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {(totalTime || prepTime || cookTime) && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <div>
                              {totalTime && (
                                <span className="font-medium">
                                  Total: {totalTime}
                                </span>
                              )}
                              {!totalTime && prepTime && (
                                <span>Prep: {prepTime}</span>
                              )}
                              {!totalTime && cookTime && (
                                <span className="ml-2">Cook: {cookTime}</span>
                              )}
                            </div>
                          </div>
                        )}
                        {servings && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{servings} servings</span>
                          </div>
                        )}
                        {sourceUrl && (
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View Source</span>
                          </a>
                        )}
                      </div>

                      {/* Ingredients */}
                      {ingredientsList.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Ingredients
                          </h4>
                          <ul className="space-y-1.5">
                            {ingredientsList.map((ingredient, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                              >
                                <span className="text-purple-500 dark:text-purple-400 mt-1.5">
                                  •
                                </span>
                                <span>{ingredient}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Instructions */}
                      {instructionsList.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Instructions
                          </h4>
                          <ol className="space-y-3">
                            {instructionsList.map((instruction, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                              >
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 dark:bg-purple-600 text-white text-sm font-semibold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="flex-1 pt-0.5">
                                  {instruction}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Notes */}
                      {notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                            Notes
                          </h4>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
                            {notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
