import React from "react";
import AccordionListCard from "../common/AccordionListCard";
import Card from "../ui/Card";
import TimerWidget from "../../tasks/TimerWidget";
import { ExternalLink, Check } from "lucide-react";
import type { Task } from "../../../services/tasksService.types";

interface RecipeCardProps {
  id?: string;
  recipeName: string;
  category?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string | number;
  description?: string | null;
  ingredients?: string[];
  instructions?: string[];
  notes?: string;
  sourceUrl?: string;
  task?: Task;
  onEdit?: () => void;
  onDelete?: () => void;
  onExpandChange?: (isExpanded: boolean) => void; // Track expansion changes
  compact?: boolean;
}

/**
 * RecipeCard - Specialized card component for recipe display
 * Uses AccordionListCard for consistent accordion pattern
 */
const RecipeCard: React.FC<RecipeCardProps> = ({
  recipeName,
  category,
  prepTime,
  cookTime,
  totalTime,
  servings,
  description,
  ingredients = [],
  instructions = [],
  notes,
  sourceUrl,
  task,
  onEdit,
  onDelete,
  onExpandChange,
  compact = false,
}) => {
  // Track completed instructions for cooking mode
  const [completedInstructions, setCompletedInstructions] = React.useState<
    Set<number>
  >(new Set());

  const toggleInstruction = (index: number) => {
    setCompletedInstructions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };
  if (compact) {
    // Compact mode: minimal info, opens modal on click
    return (
      <Card
        variant="interactive"
        hover="border"
        spacing="md"
        clickable
        onClick={() => onEdit?.()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {recipeName}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  {category}
                </span>
              )}
              {(totalTime || prepTime || cookTime) && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {totalTime ||
                    `Prep: ${prepTime || ""} Cook: ${cookTime || ""}`}
                </span>
              )}
              {servings && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {servings} servings
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Header content (always visible)
  const headerContent = (
    <div className="space-y-1.5">
      {/* Title row with chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {recipeName}
        </h3>
        {category && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
            {category}
          </span>
        )}
        {prepTime && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            Prep: {prepTime}
          </span>
        )}
        {cookTime && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            Cook: {cookTime}
          </span>
        )}
        {totalTime && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
            Total: {totalTime}
          </span>
        )}
        {servings && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {servings} servings
          </span>
        )}
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:opacity-80 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            aria-label="View source"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* One-line truncated description */}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
          {description}
        </p>
      )}
    </div>
  );

  // Expanded content (shown when accordion is open)
  const expandedContent = (
    <div className="space-y-4">
      {/* Two-column grid: left for recipe details, right for timer (if exists) */}
      {task?.timer_duration_minutes ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Recipe Details */}
          <div className="space-y-4">
            {/* Ingredients */}
            {ingredients.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
                  Ingredients
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {ingredients.map((ingredient, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-primary flex-shrink-0">—</span>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {instructions.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
                  Instructions
                </h4>
                <ol className="space-y-2">
                  {instructions.map((instruction, index) => {
                    const isCompleted = completedInstructions.has(index);
                    return (
                      <li
                        key={index}
                        className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3 leading-relaxed group"
                      >
                        {/* Custom Checkbox */}
                        <label className="relative flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() => toggleInstruction(index)}
                            className="sr-only peer"
                            aria-label={`Mark step ${index + 1} as ${
                              isCompleted ? "incomplete" : "complete"
                            }`}
                          />
                          <div className="w-4 h-4 mt-0.5 border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 peer-checked:bg-primary peer-checked:border-primary peer-focus:ring-2 peer-focus:ring-primary/30 transition-all flex items-center justify-center">
                            {isCompleted && (
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            )}
                          </div>
                        </label>

                        {/* Step number */}
                        <span
                          className={`font-semibold flex-shrink-0 transition-all ${
                            isCompleted
                              ? "text-gray-400 dark:text-gray-600 line-through"
                              : "text-primary"
                          }`}
                        >
                          {index + 1}.
                        </span>

                        {/* Instruction text */}
                        <span
                          className={`transition-all ${
                            isCompleted
                              ? "text-gray-400 dark:text-gray-600 line-through"
                              : ""
                          }`}
                        >
                          {instruction}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                {/* Reset Instructions Button */}
                {completedInstructions.size > 0 && (
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => setCompletedInstructions(new Set())}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors underline"
                    >
                      Reset Instructions
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Source Link */}
            {sourceUrl && (
              <div>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Original Recipe
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Timer */}
          <div className="flex flex-col justify-start space-y-4">
            {task && <TimerWidget task={task} compact={false} />}
            
            {/* Notes */}
            {notes && (
              <div>
                <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
                  Notes
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800/30 rounded-md p-3">
                  {notes}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Single column layout when no timer */
        <div className="space-y-4">
          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div>
              <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
                Ingredients
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-1.5">
                {ingredients.map((ingredient, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-primary flex-shrink-0">—</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {instructions.length > 0 && (
            <div>
              <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
                Instructions
              </h4>
              <ol className="space-y-2">
                {instructions.map((instruction, index) => {
                  const isCompleted = completedInstructions.has(index);
                  return (
                    <li
                      key={index}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3 leading-relaxed group"
                    >
                      {/* Custom Checkbox */}
                      <label className="relative flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => toggleInstruction(index)}
                          className="sr-only peer"
                          aria-label={`Mark step ${index + 1} as ${
                            isCompleted ? "incomplete" : "complete"
                          }`}
                        />
                        <div className="w-4 h-4 mt-0.5 border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 peer-checked:bg-primary peer-checked:border-primary peer-focus:ring-2 peer-focus:ring-primary/30 transition-all flex items-center justify-center">
                          {isCompleted && (
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                          )}
                        </div>
                      </label>

                      {/* Step number */}
                      <span
                        className={`font-semibold flex-shrink-0 transition-all ${
                          isCompleted
                            ? "text-gray-400 dark:text-gray-600 line-through"
                            : "text-primary"
                        }`}
                      >
                        {index + 1}.
                      </span>

                      {/* Instruction text */}
                      <span
                        className={`transition-all ${
                          isCompleted
                            ? "text-gray-400 dark:text-gray-600 line-through"
                            : ""
                        }`}
                      >
                        {instruction}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {/* Reset Instructions Button */}
              {completedInstructions.size > 0 && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => setCompletedInstructions(new Set())}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors underline"
                  >
                    Reset Instructions
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div>
              <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
                Notes
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800/30 rounded-md p-3">
                {notes}
              </p>
            </div>
          )}

          {/* Source Link */}
          {sourceUrl && (
            <div>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" />
                View Original Recipe
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Expandable mode: use AccordionListCard
  return (
    <AccordionListCard
      onEdit={onEdit}
      onDelete={onDelete}
      expandedContent={expandedContent}
      onExpandChange={onExpandChange}
    >
      {headerContent}
    </AccordionListCard>
  );
};

export default RecipeCard;
