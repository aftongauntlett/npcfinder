/**
 * useBoardTemplates Hook
 *
 * Extracts board filtering and task counting logic for different template types.
 * Simplifies TasksPage by consolidating repeated useMemo logic.
 */

import { useMemo } from "react";
import type { BoardWithStats } from "../services/tasksService.types";

export interface BoardTemplateGroups {
  kanbanBoards: BoardWithStats[];
  groceryBoards: BoardWithStats[];
  sharedGroceryBoards: BoardWithStats[];
  recipeBoards: BoardWithStats[];
  jobBoards: BoardWithStats[];
  groceryTaskCount: number;
  recipeTaskCount: number;
  jobTaskCount: number;
}

/**
 * Filter boards by template type and calculate task counts
 *
 * @param boards - Array of boards to filter
 * @param sharedBoards - Optional array of shared boards (used for grocery)
 * @returns Filtered board arrays and task counts
 */
export function useBoardTemplates(
  boards: BoardWithStats[],
  sharedBoards?: BoardWithStats[]
): BoardTemplateGroups {
  const kanbanBoards = useMemo(
    () => boards.filter((b) => b.template_type === "kanban"),
    [boards]
  );

  const groceryBoards = useMemo(
    () => boards.filter((b) => b.template_type === "grocery"),
    [boards]
  );

  const sharedGroceryBoards = useMemo(
    () => (sharedBoards || []).filter((b) => b.template_type === "grocery"),
    [sharedBoards]
  );

  const recipeBoards = useMemo(
    () => boards.filter((b) => b.template_type === "recipe"),
    [boards]
  );

  const jobBoards = useMemo(
    () => boards.filter((b) => b.template_type === "job_tracker"),
    [boards]
  );

  // Calculate task counts for each template type
  const groceryTaskCount = useMemo(
    () =>
      groceryBoards.reduce((sum, board) => sum + (board.total_tasks || 0), 0),
    [groceryBoards]
  );

  const recipeTaskCount = useMemo(
    () =>
      recipeBoards.reduce((sum, board) => sum + (board.total_tasks || 0), 0),
    [recipeBoards]
  );

  const jobTaskCount = useMemo(
    () => jobBoards.reduce((sum, board) => sum + (board.total_tasks || 0), 0),
    [jobBoards]
  );

  return {
    kanbanBoards,
    groceryBoards,
    sharedGroceryBoards,
    recipeBoards,
    jobBoards,
    groceryTaskCount,
    recipeTaskCount,
    jobTaskCount,
  };
}
