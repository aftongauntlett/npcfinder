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
  recipeBoards: BoardWithStats[];
  kanbanTaskCount: number;
  recipeTaskCount: number;
}

/**
 * Filter boards by template type and calculate task counts
 *
 * @param boards - Array of boards to filter
 * @returns Filtered board arrays and task counts
 */
export function useBoardTemplates(
  boards: BoardWithStats[],
): BoardTemplateGroups {
  const kanbanBoards = useMemo(
    () => boards.filter((b) => b.template_type === "kanban"),
    [boards],
  );

  const recipeBoards = useMemo(
    () => boards.filter((b) => b.template_type === "recipe"),
    [boards],
  );

  // Calculate task counts for each template type
  const kanbanTaskCount = useMemo(
    () =>
      kanbanBoards.reduce((sum, board) => sum + (board.total_tasks || 0), 0),
    [kanbanBoards],
  );

  const recipeTaskCount = useMemo(
    () =>
      recipeBoards.reduce((sum, board) => sum + (board.total_tasks || 0), 0),
    [recipeBoards],
  );

  return {
    kanbanBoards,
    recipeBoards,
    kanbanTaskCount,
    recipeTaskCount,
  };
}
