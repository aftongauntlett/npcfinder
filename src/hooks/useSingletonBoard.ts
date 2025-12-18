/**
 * Hook for managing singleton boards
 *
 * Job tracker, recipes, and kanban are "global collections" - each user
 * should have exactly one board of these types, auto-created on first use.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { ensureSingletonBoard } from "../services/tasksService";

type SingletonTemplateType = "job_tracker" | "recipe" | "kanban";

/**
 * Get or create a singleton board for a template type
 *
 * @param templateType - The template type (job_tracker, recipe, kanban)
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
    staleTime: Infinity, // Singleton boards don't change
    gcTime: Infinity,
  });
}

/**
 * Get singleton board IDs for all three types
 * Useful for bulk operations
 */
export function useAllSingletonBoards() {
  const jobBoard = useSingletonBoard("job_tracker");
  const recipeBoard = useSingletonBoard("recipe");
  const kanbanBoard = useSingletonBoard("kanban");

  return {
    jobBoardId: jobBoard.data,
    recipeBoardId: recipeBoard.data,
    kanbanBoardId: kanbanBoard.data,
    isLoading:
      jobBoard.isLoading || recipeBoard.isLoading || kanbanBoard.isLoading,
    error: jobBoard.error || recipeBoard.error || kanbanBoard.error,
  };
}
