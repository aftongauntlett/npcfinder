/**
 * Task Query Cache Helpers
 * Reusable helpers for invalidating task-related queries
 */

import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";

/**
 * Invalidate all task queries (boards, board tasks, today tasks)
 */
export function invalidateAllTaskQueries(
  queryClient: QueryClient,
  userId?: string
) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.tasks.all,
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.tasks.boards(),
  });
  if (userId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.todayTasks(userId),
    });
  }
}

/**
 * Invalidate queries for a specific board
 */
export function invalidateBoardQueries(
  queryClient: QueryClient,
  boardId: string | null,
  userId?: string
) {
  if (boardId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.boardTasks(boardId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.boardSections(boardId),
    });
  }

  void queryClient.invalidateQueries({
    queryKey: queryKeys.tasks.boards(),
  });

  if (userId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.todayTasks(userId),
    });
  }
}
