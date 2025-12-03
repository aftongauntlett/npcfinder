import React, { useState } from "react";
import Card from "../ui/Card";
import Chip from "../ui/Chip";
import Button from "../ui/Button";
import { Clock, Users, ChefHat, ExternalLink } from "lucide-react";

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
  onEdit?: () => void;
  compact?: boolean;
}

/**
 * RecipeCard - Specialized card component for recipe display
 * Supports expandable content without accordion-within-accordion pattern
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
  onEdit,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
                <Chip variant="primary" size="sm">
                  <ChefHat className="w-3 h-3" />
                  {category}
                </Chip>
              )}
              {(totalTime || prepTime || cookTime) && (
                <Chip variant="default" size="sm">
                  <Clock className="w-3 h-3" />
                  {totalTime ||
                    `Prep: ${prepTime || ""} Cook: ${cookTime || ""}`}
                </Chip>
              )}
              {servings && (
                <Chip variant="default" size="sm">
                  <Users className="w-3 h-3" />
                  {servings}
                </Chip>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Expandable mode: full card with inline expansion
  return (
    <Card variant="interactive" hover="border" spacing="none">
      {/* Header - Always Visible */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {recipeName}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category && (
                <Chip
                  variant="primary"
                  size="sm"
                  icon={<ChefHat className="w-3 h-3" />}
                >
                  {category}
                </Chip>
              )}
              {prepTime && (
                <Chip
                  variant="default"
                  size="sm"
                  icon={<Clock className="w-3 h-3" />}
                >
                  Prep: {prepTime}
                </Chip>
              )}
              {cookTime && (
                <Chip
                  variant="default"
                  size="sm"
                  icon={<Clock className="w-3 h-3" />}
                >
                  Cook: {cookTime}
                </Chip>
              )}
              {servings && (
                <Chip
                  variant="default"
                  size="sm"
                  icon={<Users className="w-3 h-3" />}
                >
                  {servings}
                </Chip>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {description}
          </p>
        )}

        {/* Expand/Collapse Button */}
        <Button
          variant="subtle"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Hide Details" : "View Recipe"}
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Ingredients
              </h4>
              <ul className="space-y-1">
                {ingredients.map((ingredient, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {instructions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Instructions
              </h4>
              <ol className="space-y-2">
                {instructions.map((instruction, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3"
                  >
                    <span className="font-semibold text-primary flex-shrink-0">
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
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Notes
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 rounded-md p-3">
                {notes}
              </p>
            </div>
          )}

          {/* Source Link */}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              View Original Recipe
            </a>
          )}

          {/* Edit Button */}
          {onEdit && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" size="sm" onClick={() => onEdit()}>
                Edit Recipe
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default RecipeCard;
