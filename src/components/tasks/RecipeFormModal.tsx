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
import Select from "../shared/ui/Select";
import { useCreateTask, useUpdateTask } from "../../hooks/useTasksQueries";
import { useUrlMetadata } from "../../hooks/useUrlMetadata";
import { Link, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { fetchMetadata, loading: urlLoading } = useUrlMetadata();

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
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* URL Input with Scraping */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipe URL (Optional)
          </label>
          <div className="relative">
            <Input
              type="url"
              value={url}
              onChange={(e) => void handleUrlChange(e.target.value)}
              placeholder="Paste a recipe URL to auto-fill details..."
              leftIcon={
                urlLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )
              }
            />
            {urlFeedback && (
              <div
                className={`mt-2 flex items-start gap-2 text-sm ${
                  urlFeedback.type === "success"
                    ? "text-green-600 dark:text-green-400"
                    : urlFeedback.type === "warning"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {urlFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{urlFeedback.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Recipe Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipe Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="e.g., Chocolate Chip Cookies"
            required
          />
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the recipe..."
          rows={2}
        />

        {/* Category */}
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Select a category..."
          options={[
            { value: "Appetizer", label: "Appetizer" },
            { value: "Breakfast", label: "Breakfast" },
            { value: "Main", label: "Main Course" },
            { value: "Side", label: "Side Dish" },
            { value: "Dessert", label: "Dessert" },
            { value: "Snack", label: "Snack" },
            { value: "Beverage", label: "Beverage" },
            { value: "Sauce", label: "Sauce/Condiment" },
            { value: "Soup", label: "Soup" },
            { value: "Salad", label: "Salad" },
            { value: "Bread", label: "Bread/Baked Goods" },
            { value: "Other", label: "Other" },
          ]}
        />

        {/* Time Fields Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prep Time
            </label>
            <Input
              type="text"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="15 mins"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cook Time
            </label>
            <Input
              type="text"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="30 mins"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total Time
            </label>
            <Input
              type="text"
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
              placeholder="45 mins"
            />
          </div>
        </div>

        {/* Servings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Servings
          </label>
          <Input
            type="text"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="e.g., 4-6 servings"
          />
        </div>

        {/* Ingredients */}
        <Textarea
          label="Ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Enter each ingredient on a new line..."
          rows={6}
          helperText="One ingredient per line"
          textareaClassName="font-mono text-sm"
        />

        {/* Instructions */}
        <Textarea
          label="Instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter each step on a new line..."
          rows={8}
          helperText="One step per line"
          textareaClassName="font-mono text-sm"
        />

        {/* Notes */}
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes or tips..."
          rows={3}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
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
