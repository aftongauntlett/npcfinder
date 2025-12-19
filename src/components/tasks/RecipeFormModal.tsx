/**
 * Recipe Form Modal
 * Dedicated modal for creating/editing recipe entries with URL scraping
 */

import React, { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import Dropdown from "../shared/ui/Dropdown";
import {
  useCreateTask,
  useUpdateTask,
  useTasks,
} from "../../hooks/useTasksQueries";
import { useUrlMetadata } from "../../hooks/useUrlMetadata";
import {
  Link,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import type { Task, CreateTaskData } from "../../services/tasksService.types";

interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  task?: Task | null; // If editing existing recipe
}

const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  isOpen,
  onClose,
  boardId,
  task,
}) => {
  const { themeColor } = useTheme();
  const [url, setUrl] = useState("");
  const [urlFeedback, setUrlFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Form fields
  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [servings, setServings] = useState("");
  const [notes, setNotes] = useState("");

  // Optional settings disclosure
  const [showOptionalSettings, setShowOptionalSettings] = useState(false);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { fetchMetadata, loading: urlLoading } = useUrlMetadata();
  const { data: existingTasks = [] } = useTasks(boardId);

  // Populate form when editing
  useEffect(() => {
    if (task?.item_data) {
      const data = task.item_data;
      setRecipeName(
        (data.recipe_name as string) || (data.name as string) || task.title
      );
      setDescription((data.description as string) || task.description || "");
      setCategory((data.category as string) || "");

      const ingredientsArr = data.ingredients as string[] | undefined;
      setIngredients(ingredientsArr ? ingredientsArr.join("\n") : "");

      const instructionsArr = data.instructions as string[] | undefined;
      setInstructions(instructionsArr ? instructionsArr.join("\n") : "");

      setPrepTime((data.prep_time as string) || "");
      setCookTime((data.cook_time as string) || "");
      setTotalTime((data.total_time as string) || "");
      setServings((data.servings as string) || "");
      setNotes((data.notes as string) || "");
      setUrl((data.recipe_url as string) || (data.source_url as string) || "");
    }
  }, [task]);

  const handleUrlChange = async (value: string) => {
    setUrl(value);
    setUrlFeedback(null);

    // Auto-fill when URL looks valid
    if (value.match(/^https?:\/\/.+/)) {
      const metadata = await fetchMetadata(value);

      if (metadata?.kind === "recipe" && metadata.recipe) {
        const recipe = metadata.recipe;
        let extractedCount = 0;
        const fieldNames: string[] = [];

        if (recipe.name && !recipeName) {
          setRecipeName(recipe.name);
          extractedCount++;
          fieldNames.push("name");
        }

        if (recipe.description && !description) {
          setDescription(recipe.description);
          extractedCount++;
          fieldNames.push("description");
        }

        if (
          recipe.ingredients &&
          recipe.ingredients.length > 0 &&
          !ingredients
        ) {
          setIngredients(recipe.ingredients.join("\n"));
          extractedCount++;
          fieldNames.push("ingredients");
        }

        if (
          recipe.instructions &&
          recipe.instructions.length > 0 &&
          !instructions
        ) {
          setInstructions(recipe.instructions.join("\n"));
          extractedCount++;
          fieldNames.push("instructions");
        }

        if (recipe.prepTime && !prepTime) {
          setPrepTime(recipe.prepTime);
          extractedCount++;
          fieldNames.push("prep time");
        }

        if (recipe.cookTime && !cookTime) {
          setCookTime(recipe.cookTime);
          extractedCount++;
          fieldNames.push("cook time");
        }

        if (recipe.totalTime && !totalTime) {
          setTotalTime(recipe.totalTime);
          extractedCount++;
          fieldNames.push("total time");
        }
        if (recipe.servings && !servings) {
          setServings(recipe.servings);
          extractedCount++;
          fieldNames.push("servings");
        }

        if (recipe.category && !category) {
          setCategory(recipe.category);
          extractedCount++;
          fieldNames.push("category");
        }

        if (extractedCount > 0) {
          setUrlFeedback({
            type: "success",
            message: `Auto-filled ${fieldNames.slice(0, 3).join(", ")}${
              fieldNames.length > 3 ? ` +${fieldNames.length - 3} more` : ""
            }`,
          });
        } else {
          setUrlFeedback({
            type: "warning",
            message: "Couldn't extract recipe details - please fill manually",
          });
        }
      } else if (metadata && metadata.kind !== "recipe") {
        // Generic page, use title/description as fallback
        if (metadata.title && !recipeName) {
          setRecipeName(metadata.title);
        }
        if (metadata.description && !description) {
          setDescription(metadata.description);
        }
        setUrlFeedback({
          type: "warning",
          message: "No recipe detected - using basic page info",
        });
      } else {
        setUrlFeedback({
          type: "error",
          message: "Failed to extract recipe data",
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateWarning(null);

    // Check for recipe duplicates (only for new recipes, not edits)
    // Unlike the old warning-only approach, we now block duplicate recipe names
    // to prevent accidental re-creation of existing recipes. Users must edit
    // the existing recipe or choose a different name.
    if (!task) {
      const normalizedName = recipeName.toLowerCase().trim();
      const existingRecipe = existingTasks.find(
        (t) =>
          ((t.item_data?.recipe_name as string) || "").toLowerCase().trim() ===
          normalizedName
      );

      if (existingRecipe) {
        setDuplicateWarning(
          `A recipe with this name already exists. Please choose a different name or edit the existing recipe.`
        );
        return; // Block creation
      }
    }

    const item_data = {
      recipe_name: recipeName,
      name: recipeName,
      description: description || "",
      category: category || "",
      ingredients: ingredients ? ingredients.split("\n").filter(Boolean) : [],
      instructions: instructions
        ? instructions.split("\n").filter(Boolean)
        : [],
      prep_time: prepTime || "",
      cook_time: cookTime || "",
      total_time: totalTime || "",
      servings: servings || "",
      recipe_url: url || "",
      source_url: url || "",
      notes: notes || "",
    };

    if (task) {
      // Update existing task
      void updateTask
        .mutateAsync({
          taskId: task.id,
          updates: {
            title: recipeName,
            description: description || undefined,
            item_data,
          },
        })
        .then(() => {
          onClose();
          resetForm();
        })
        .catch((err) => {
          logger.error("Failed to update recipe", {
            error: err,
            taskId: task.id,
          });
        });
    } else {
      // Create new task
      const taskData: CreateTaskData = {
        board_id: boardId,
        section_id: undefined,
        title: recipeName,
        description: description || undefined,
        item_data,
      };

      void createTask
        .mutateAsync(taskData)
        .then(() => {
          onClose();
          resetForm();
        })
        .catch((err) => {
          logger.error("Failed to create recipe", { error: err, boardId });
        });
    }
  };

  const resetForm = () => {
    setUrl("");
    setRecipeName("");
    setDescription("");
    setCategory("");
    setIngredients("");
    setInstructions("");
    setPrepTime("");
    setCookTime("");
    setTotalTime("");
    setServings("");
    setNotes("");
    setUrlFeedback(null);
  };

  const handleClose = () => {
    onClose();
    if (!task) {
      // Only reset form when creating new recipe (not editing)
      setTimeout(resetForm, 300);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={task ? "Edit Recipe" : "Add Recipe"}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* URL Input with Scraping */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            <Link className="w-3.5 h-3.5" />
            Quick add from URL
          </div>
          <Input
            id="recipe-url"
            type="url"
            value={url}
            onChange={(e) => void handleUrlChange(e.target.value)}
            placeholder="Paste recipe URL to auto-fill..."
            leftIcon={<Link className="w-4 h-4" />}
            rightIcon={
              urlLoading ? (
                <Loader2
                  className="w-4 h-4 animate-spin"
                  style={{ color: themeColor }}
                />
              ) : undefined
            }
          />
          {urlFeedback && (
            <div
              className={`flex items-start gap-2 text-xs px-3 py-2 rounded-md ${
                urlFeedback.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  : urlFeedback.type === "warning"
                  ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              }`}
            >
              {urlFeedback.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              )}
              <span>{urlFeedback.message}</span>
            </div>
          )}
          {!urlFeedback && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Or fill in the details manually below
            </p>
          )}
        </div>

        {/* Core Recipe Details */}
        <div className="space-y-4">
          {/* Recipe Name */}
          <Input
            id="recipe-name"
            label="Recipe Name"
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="e.g., Chocolate Chip Cookies"
            required
          />

          {/* Description */}
          <Textarea
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the recipe..."
            rows={2}
          />

          {/* Ingredients */}
          <Textarea
            label="Ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Enter each ingredient on a new line..."
            rows={8}
            helperText="One ingredient per line"
          />

          {/* Instructions */}
          <Textarea
            label="Instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter each step on a new line..."
            rows={8}
            helperText="One step per line"
          />
        </div>

        {/* Optional Settings Disclosure */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowOptionalSettings(!showOptionalSettings)}
            className="flex items-center justify-end gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ml-auto"
          >
            <span>Optional settings</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                showOptionalSettings ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {showOptionalSettings && (
            <div className="mt-6 space-y-6">
              {/* Time & Serving Info */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: themeColor }}>
                  Time & Servings
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    id="prep-time"
                    label="Prep Time"
                    type="text"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="15 min"
                  />
                  <Input
                    id="cook-time"
                    label="Cook Time"
                    type="text"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    placeholder="30 min"
                  />
                  <Input
                    id="total-time"
                    label="Total Time"
                    type="text"
                    value={totalTime}
                    onChange={(e) => setTotalTime(e.target.value)}
                    placeholder="45 min"
                  />
                  <Input
                    id="servings"
                    label="Servings"
                    type="text"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    placeholder="4-6"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: themeColor }}>
                  Category
                </label>
                <Dropdown
                  trigger={
                    <div className="w-full flex items-center justify-between px-4 py-2.5 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer">
                      <span
                        className={category ? "" : "text-gray-500 dark:text-gray-400"}
                      >
                        {category || "Select a category..."}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                  }
                  options={[
                    { id: "Appetizer", label: "Appetizer" },
                    { id: "Breakfast", label: "Breakfast" },
                    { id: "Main", label: "Main Course" },
                    { id: "Side", label: "Side Dish" },
                    { id: "Dessert", label: "Dessert" },
                    { id: "Snack", label: "Snack" },
                    { id: "Beverage", label: "Beverage" },
                    { id: "Sauce", label: "Sauce/Condiment" },
                    { id: "Soup", label: "Soup" },
                    { id: "Salad", label: "Salad" },
                    { id: "Bread", label: "Bread/Baked Goods" },
                    { id: "Other", label: "Other" },
                  ]}
                  value={category}
                  onChange={(value) => setCategory(value as string)}
                  dropdownClassName="w-full"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: themeColor }}>
                  Additional Notes
                </label>
                <Textarea
                  label=""
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes or tips..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Duplicate Error (blocking) */}
        {duplicateWarning && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mt-4">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
              {duplicateWarning}
            </p>
          </div>
        )}

        {/* Spacer for consistent divider spacing - only when optional settings expanded */}
        {showOptionalSettings && <div className="h-2" />}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={
              !recipeName.trim() || createTask.isPending || updateTask.isPending
            }
            style={{ backgroundColor: themeColor }}
          >
            {createTask.isPending || updateTask.isPending
              ? "Saving..."
              : task
              ? "Update Recipe"
              : "Add Recipe"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecipeFormModal;
