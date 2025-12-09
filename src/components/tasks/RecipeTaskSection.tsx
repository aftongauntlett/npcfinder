/**
 * Recipe Task Section Component
 * Manages recipe-specific fields and transformations to and from arrays in item_data
 * Provides a builder function for recipe-specific item_data
 */

import React, { useState, useEffect } from "react";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import type { Task } from "../../services/tasksService.types";

interface RecipeTaskSectionProps {
  task: Task;
  onBuildItemData: (
    builder: () => Record<string, unknown>,
    isValid: boolean
  ) => void;
}

const RecipeTaskSection: React.FC<RecipeTaskSectionProps> = ({
  task,
  onBuildItemData,
}) => {
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
    <div className="space-y-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Recipe Details
      </h3>
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
    </div>
  );
};

export default RecipeTaskSection;
