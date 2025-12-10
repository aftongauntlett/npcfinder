/**
 * Recipe Task Section Component
 * Manages recipe-specific fields and transformations to and from arrays in item_data
 * Provides a builder function for recipe-specific item_data
 */

import React, { useState, useEffect } from "react";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import Select from "../shared/ui/Select";
import { useTheme } from "../../hooks/useTheme";
import type { Task } from "../../services/tasksService.types";

interface RecipeTaskSectionProps {
  task: Task;
  onBuildItemData: (
    builder: () => Record<string, unknown>,
    isValid: boolean
  ) => void;
  hasTimer: boolean;
  setHasTimer: (value: boolean) => void;
  timerDuration: number;
  setTimerDuration: (value: number) => void;
  timerUnit: "minutes" | "hours";
  setTimerUnit: (value: "minutes" | "hours") => void;
  isUrgentAfterTimer: boolean;
  setIsUrgentAfterTimer: (value: boolean) => void;
}

const RecipeTaskSection: React.FC<RecipeTaskSectionProps> = ({
  task,
  onBuildItemData,
  hasTimer,
  setHasTimer,
  timerDuration,
  setTimerDuration,
  timerUnit,
  setTimerUnit,
  isUrgentAfterTimer,
  setIsUrgentAfterTimer,
}) => {
  const { themeColor } = useTheme();
  // Recipe specific fields
  const [recipeName, setRecipeName] = useState(
    (task.item_data?.recipe_name as string) ||
      (task.item_data?.name as string) ||
      ""
  );
  const [recipeUrl, setRecipeUrl] = useState(
    (task.item_data?.recipe_url as string) ||
      (task.item_data?.source_url as string) ||
      ""
  );
  const [ingredients, setIngredients] = useState(() => {
    const ing = task.item_data?.ingredients;
    return Array.isArray(ing) ? ing.join("\n") : (ing as string) || "";
  });
  const [instructions, setInstructions] = useState(() => {
    const inst = task.item_data?.instructions;
    return Array.isArray(inst) ? inst.join("\n") : (inst as string) || "";
  });
  const [prepTime, setPrepTime] = useState(
    (task.item_data?.prep_time as string) || ""
  );
  const [cookTime, setCookTime] = useState(
    (task.item_data?.cook_time as string) || ""
  );
  const [totalTime, setTotalTime] = useState(
    (task.item_data?.total_time as string) || ""
  );
  const [servings, setServings] = useState(
    (task.item_data?.servings as string) || ""
  );
  const [recipeNotes, setRecipeNotes] = useState(
    (task.item_data?.notes as string) || ""
  );

  // Update fields when task changes
  useEffect(() => {
    setRecipeName(
      (task.item_data?.recipe_name as string) ||
        (task.item_data?.name as string) ||
        ""
    );
    setRecipeUrl(
      (task.item_data?.recipe_url as string) ||
        (task.item_data?.source_url as string) ||
        ""
    );
    const ing = task.item_data?.ingredients;
    setIngredients(Array.isArray(ing) ? ing.join("\n") : (ing as string) || "");
    const inst = task.item_data?.instructions;
    setInstructions(
      Array.isArray(inst) ? inst.join("\n") : (inst as string) || ""
    );
    setPrepTime((task.item_data?.prep_time as string) || "");
    setCookTime((task.item_data?.cook_time as string) || "");
    setTotalTime((task.item_data?.total_time as string) || "");
    setServings((task.item_data?.servings as string) || "");
    setRecipeNotes((task.item_data?.notes as string) || "");
  }, [task]);

  // Provide builder function to parent
  useEffect(() => {
    const buildItemData = (): Record<string, unknown> => ({
      ...(task.item_data || {}),
      recipe_name: recipeName,
      name: recipeName,
      ingredients: ingredients ? ingredients.split("\n").filter(Boolean) : [],
      instructions: instructions
        ? instructions.split("\n").filter(Boolean)
        : [],
      prep_time: prepTime,
      cook_time: cookTime,
      total_time: totalTime,
      servings: servings,
      recipe_url: recipeUrl,
      source_url: recipeUrl,
      notes: recipeNotes,
    });

    const isValid = recipeName.trim() !== "";
    onBuildItemData(buildItemData, isValid);
  }, [
    recipeName,
    recipeUrl,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    totalTime,
    servings,
    recipeNotes,
    task.item_data,
    onBuildItemData,
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="recipe-name"
          label="Recipe Name"
          type="text"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
          placeholder="Chocolate Chip Cookies"
        />
        <Input
          id="recipe-url"
          label="Source URL"
          type="url"
          value={recipeUrl}
          onChange={(e) => setRecipeUrl(e.target.value)}
          placeholder="https://recipe-site.com/..."
        />
        <Input
          id="prep-time"
          label="Prep Time"
          type="text"
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
          placeholder="15 minutes"
        />
        <Input
          id="cook-time"
          label="Cook Time"
          type="text"
          value={cookTime}
          onChange={(e) => setCookTime(e.target.value)}
          placeholder="30 minutes"
        />
        <Input
          id="total-time"
          label="Total Time"
          type="text"
          value={totalTime}
          onChange={(e) => setTotalTime(e.target.value)}
          placeholder="45 minutes"
        />
        <Input
          id="servings"
          label="Servings"
          type="text"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          placeholder="4"
        />
      </div>
      <Textarea
        id="ingredients"
        label="Ingredients (one per line)"
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        placeholder="2 cups flour&#10;1 cup sugar&#10;2 eggs"
        rows={4}
      />
      <Textarea
        id="instructions"
        label="Instructions (one step per line)"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Preheat oven to 350°F&#10;Mix dry ingredients&#10;Add wet ingredients"
        rows={4}
      />
      
      <Textarea
        id="recipe-notes"
        label="Notes"
        value={recipeNotes}
        onChange={(e) => setRecipeNotes(e.target.value)}
        placeholder="Personal notes, modifications, etc."
        rows={2}
      />
      
      {/* Timer Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="relative flex-shrink-0 cursor-pointer"
                onClick={() => setHasTimer(!hasTimer)}
              >
                <input
                  type="checkbox"
                  checked={hasTimer}
                  onChange={() => {}}
                  className="sr-only peer"
                  tabIndex={-1}
                />
                <div
                  className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer transition-colors"
                  style={hasTimer ? { backgroundColor: themeColor } : {}}
                ></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Add Timer
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Set a countdown timer
                </p>
              </div>
            </div>

            {/* Timer Duration - Show only if timer enabled */}
            {hasTimer && (
              <div className="pt-2 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={timerUnit === "hours" ? 24 : 1440}
                      value={timerDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < 1) {
                          setTimerDuration(1);
                          return;
                        }
                        const max = timerUnit === "hours" ? 24 : 1440;
                        setTimerDuration(Math.min(max, val));
                      }}
                      placeholder="30"
                      className="hide-number-spinner flex-1 block rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                    <div className="w-32">
                      <Select
                        id="timer-unit-recipe"
                        value={timerUnit}
                        onChange={(e) => {
                          setTimerUnit(e.target.value as "minutes" | "hours");
                        }}
                        options={[
                          { value: "minutes", label: "Minutes" },
                          { value: "hours", label: "Hours" },
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Mark as Urgent */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="urgent-after-timer-recipe"
                    checked={isUrgentAfterTimer}
                    onChange={(e) => setIsUrgentAfterTimer(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary/20"
                    style={{
                      accentColor: themeColor,
                    }}
                  />
                  <label
                    htmlFor="urgent-after-timer-recipe"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Mark as urgent after timer expires
                  </label>
                </div>
              </div>
            )}
      </div>
    </div>
  );
};

export default RecipeTaskSection;
