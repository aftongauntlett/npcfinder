/**
 * Hook for managing singleton boards
 *
 * Job tracker and recipes are "global collections" - each user
 * should have exactly one board of these types, auto-created on first use.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { ensureSingletonBoard } from "../services/tasksService";

type SingletonTemplateType = "job_tracker" | "recipe";

/**
 * Get or create a singleton board for a template type
 *
 * @param templateType - The template type (job_tracker, recipe)
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

  return {
    jobBoardId: jobBoard.data,
    recipeBoardId: recipeBoard.data,
    isLoading:
      jobBoard.isLoading || recipeBoard.isLoading,
    error: jobBoard.error || recipeBoard.error,
  };
}
