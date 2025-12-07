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
  // Invalidate all task queries using the base prefix
  void queryClient.invalidateQueries({
    queryKey: queryKeys.tasks.all,
  });
  // Specifically invalidate boards for this user
  if (userId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.boards(userId),
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
    // Invalidate specific board queries
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.board(boardId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.boardTasks(boardId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.boardSections(boardId),
    });
  }

  // Invalidate boards list for this user
  if (userId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.boards(userId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tasks.todayTasks(userId),
    });
  }
}
