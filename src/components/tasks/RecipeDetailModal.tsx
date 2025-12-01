/**
 * Recipe Detail Modal
 * Modal for viewing recipe details
 */

import React from "react";
import { ExternalLink, Clock, Users, Pencil } from "lucide-react";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import type { Task } from "../../services/tasksService.types";

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onEdit?: () => void;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  onEdit,
}) => {
  // Extract recipe data from item_data or fallback to task fields
  const recipeName =
    (task.item_data?.recipe_name as string) ||
    (task.item_data?.name as string) ||
    task.title;
  const description =
    (task.item_data?.description as string) || task.description || "";
  const ingredients = task.item_data?.ingredients as string[] | string;
  const instructions = task.item_data?.instructions as string[] | string;
  const prepTime = task.item_data?.prep_time as string;
  const cookTime = task.item_data?.cook_time as string;
  const totalTime = task.item_data?.total_time as string;
  const servings = task.item_data?.servings as string | number;
  const sourceUrl =
    (task.item_data?.recipe_url as string) ||
    (task.item_data?.source_url as string);
  const notes = (task.item_data?.notes as string) || "";

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

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recipeName}
      maxWidth="2xl"
      closeOnBackdropClick={true}
    >
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Edit Button */}
        {onEdit && (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil className="w-4 h-4" />}
              onClick={onEdit}
            >
              Edit Recipe
            </Button>
          </div>
        )}

        {/* Description */}
        {description && (
          <div>
            <p className="text-gray-700 dark:text-gray-300">{description}</p>
          </div>
        )}

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {(totalTime || prepTime || cookTime) && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <div>
                {totalTime && (
                  <span className="font-medium">Total: {totalTime}</span>
                )}
                {!totalTime && prepTime && <span>Prep: {prepTime}</span>}
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
              className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Source</span>
            </a>
          )}
        </div>

        {/* Ingredients */}
        {ingredientsList.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Ingredients
            </h3>
            <ul className="space-y-2">
              {ingredientsList.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                >
                  <span className="text-purple-600 dark:text-purple-400 mt-1">
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Instructions
            </h3>
            <ol className="space-y-3">
              {instructionsList.map((instruction, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-gray-700 dark:text-gray-300"
                >
                  <span className="font-semibold text-purple-600 dark:text-purple-400 min-w-[1.5rem]">
                    {index + 1}.
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Notes
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}

        {/* Fallback if no structured data */}
        {ingredientsList.length === 0 &&
          instructionsList.length === 0 &&
          !description && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No recipe details available.</p>
              {onEdit && (
                <p className="mt-2 text-sm">
                  Click "Edit Recipe" to add details.
                </p>
              )}
            </div>
          )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RecipeDetailModal;
