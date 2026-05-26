/**
 * Pure helper functions for mapping URL metadata to form state
 */

import type { UrlMetadata } from "../hooks/useUrlMetadata";

/**
 * Result of applying recipe metadata to form state
 */
export interface RecipeMetadataFormPatch {
  title?: string;
  description?: string;
  recipeName?: string;
  recipeUrl?: string;
  ingredients?: string;
  instructions?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  category?: string;
  extractedFields: number;
  fieldNames: string[];
}

/**
 * Result of applying generic metadata to form state
 */
export interface GenericMetadataFormPatch {
  title?: string;
  description?: string;
  extractedFields: number;
  fieldNames: string[];
}

/**
 * Pure function to map recipe metadata to form fields
 *
 * Note: extractedFields intentionally counts only core descriptive fields
 * (name, description, ingredients, instructions) for user feedback.
 * Timing/metadata fields (prepTime, cookTime, totalTime, servings, recipeUrl)
 * are set but not counted as they're supplementary information rather than
 * primary recipe content.
 *
 * @param metadata - The URL metadata from scrape-url function
 * @param currentUrl - The URL being scraped
 * @returns Patch object with fields to update and extraction stats
 */
export function applyRecipeMetadataToForm(
  metadata: UrlMetadata,
  currentUrl: string,
): RecipeMetadataFormPatch {
  const patch: RecipeMetadataFormPatch = {
    extractedFields: 0,
    fieldNames: [],
  };

  if (!metadata.recipe) {
    return patch;
  }

  const {
    name,
    description: recipeDesc,
    ingredients: recipeIngredients,
    instructions: recipeInstructions,
    prepTime: recipePrepTime,
    cookTime: recipeCookTime,
    totalTime: recipeTotalTime,
    servings: recipeServings,
    category: recipeCategory,
  } = metadata.recipe;

  if (name) {
    patch.title = name;
    patch.recipeName = name;
    patch.extractedFields++;
    patch.fieldNames.push("name");
  }

  if (recipeDesc) {
    patch.description = recipeDesc;
    patch.extractedFields++;
    patch.fieldNames.push("description");
  }

  if (recipeIngredients) {
    patch.ingredients = Array.isArray(recipeIngredients)
      ? recipeIngredients.join("\n")
      : recipeIngredients;
    patch.extractedFields++;
    patch.fieldNames.push("ingredients");
  }

  if (recipeInstructions) {
    patch.instructions = Array.isArray(recipeInstructions)
      ? recipeInstructions.join("\n")
      : recipeInstructions;
    patch.extractedFields++;
    patch.fieldNames.push("instructions");
  }

  // Timing and metadata fields are set but not counted in extractedFields
  // as they're supplementary to the core recipe content
  if (recipePrepTime) {
    patch.prepTime = recipePrepTime;
    patch.fieldNames.push("prep time");
  }

  if (recipeCookTime) {
    patch.cookTime = recipeCookTime;
    patch.fieldNames.push("cook time");
  }

  if (recipeTotalTime) {
    patch.totalTime = recipeTotalTime;
  }

  if (recipeServings) {
    patch.servings = recipeServings.toString();
  }

  if (recipeCategory) {
    patch.category = recipeCategory;
    patch.fieldNames.push("category");
  }

  if (currentUrl) {
    patch.recipeUrl = currentUrl;
  }

  return patch;
}

/**
 * Pure function to map generic metadata to form fields
 *
 * @param metadata - The URL metadata from scrape-url function
 * @param currentTitle - Current title state (to avoid overwriting)
 * @param currentDescription - Current description state (to avoid overwriting)
 * @returns Patch object with fields to update and extraction stats
 */
export function applyGenericMetadataToForm(
  metadata: UrlMetadata,
  currentTitle: string,
  currentDescription: string,
): GenericMetadataFormPatch {
  const patch: GenericMetadataFormPatch = {
    extractedFields: 0,
    fieldNames: [],
  };

  if (metadata.title && !currentTitle) {
    patch.title = metadata.title;
    patch.extractedFields++;
    patch.fieldNames.push("title");
  }

  if (metadata.description && !currentDescription) {
    patch.description = metadata.description;
    patch.extractedFields++;
    patch.fieldNames.push("description");
  }

  return patch;
}
