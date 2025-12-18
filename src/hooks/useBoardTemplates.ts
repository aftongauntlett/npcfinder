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
  jobBoards: BoardWithStats[];
  kanbanTaskCount: number;
  recipeTaskCount: number;
  jobTaskCount: number;
}

/**
 * Filter boards by template type and calculate task counts
 *
 * @param boards - Array of boards to filter
 * @returns Filtered board arrays and task counts
 */
export function useBoardTemplates(
  boards: BoardWithStats[]
): BoardTemplateGroups {
  const kanbanBoards = useMemo(
    () => boards.filter((b) => b.template_type === "kanban"),
    [boards]
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
  const kanbanTaskCount = useMemo(
    () =>
      kanbanBoards.reduce((sum, board) => sum + (board.total_tasks || 0), 0),
    [kanbanBoards]
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
    recipeBoards,
    jobBoards,
    kanbanTaskCount,
    recipeTaskCount,
    jobTaskCount,
  };
}
