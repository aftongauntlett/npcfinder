/**
 * Hook for managing singleton boards
 *
 * Recipes and kanban are "global collections" - each user
 * should have exactly one board of these types, auto-created on first use.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { ensureSingletonBoard } from "../services/tasksService";

type SingletonTemplateType = "recipe" | "kanban";

/**
 * Get or create a singleton board for a template type
 *
 * @param templateType - The template type (recipe, kanban)
 * @returns Query result with board ID
 */
export function useSingletonBoard(templateType: SingletonTemplateType) {
  return useQuery({
    queryKey: queryKeys.singletonBoard(templateType),
    queryFn: async () => {
      const result = await ensureSingletonBoard(templateType);
      if (result.error) throw result.error;
      return result.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 1 day
  });
}

/**
 * Get singleton board IDs for both singleton types
 * Useful for bulk operations
 */
export function useAllSingletonBoards() {
  const recipeBoard = useSingletonBoard("recipe");
  const kanbanBoard = useSingletonBoard("kanban");

  return {
    recipeBoardId: recipeBoard.data,
    kanbanBoardId: kanbanBoard.data,
    isLoading: recipeBoard.isLoading || kanbanBoard.isLoading,
    error: recipeBoard.error || kanbanBoard.error,
  };
}
