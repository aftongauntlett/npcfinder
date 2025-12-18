import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as tasksService from "../services/tasksService";
import { queryKeys } from "../lib/queryKeys";
import { useAuth } from "../contexts/AuthContext";
import {
  validateOwnership,
  createOwnershipError,
} from "../utils/ownershipHelpers";
import { invalidateBoardQueries } from "./taskQueryHelpers";
import { parseSupabaseError } from "../utils/errorUtils";
import type {
  Board,
  BoardSection,
  Task,
  CreateBoardData,
  CreateSectionData,
  CreateTaskData,
  TaskFilters,
  BoardMemberRole,
} from "../services/tasksService.types";

// =====================================================
// BOARD HOOKS
// =====================================================

/**
 * Get all boards for current user
 */
export function useBoards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.boards(user?.id),
    queryFn: async () => {
      const { data, error } = await tasksService.getBoardsWithStats();
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!user,
  });
}

/**
 * Get single board by ID
 * SECURITY: Validates ownership before querying to prevent unnecessary database calls
 */
export function useBoard(boardId: string) {
  const { user } = useAuth();
  const { data: boards } = useBoards();

  return useQuery({
    queryKey: queryKeys.tasks.board(boardId),
    queryFn: async () => {
      // SECURITY: Early ownership check
      if (!validateOwnership(boardId, boards)) {
        throw createOwnershipError("Board");
      }

      const { data, error } = await tasksService.getBoardById(boardId);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!user && !!boardId && !!boards,
  });
}

/**
 * Create a new board
 */
export function useCreateBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (boardData: CreateBoardData) => {
      const { data, error } = await tasksService.createBoard(boardData);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data!;
    },

    onSuccess: (data) => {
      // Use helper for consistent invalidation
      invalidateBoardQueries(queryClient, data.id, user?.id);
    },
  });
}

/**
 * Update a board
 */
export function useUpdateBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      boardId,
      updates,
    }: {
      boardId: string;
      updates: Partial<Board>;
    }) => {
      const { data, error } = await tasksService.updateBoard(boardId, updates);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data!;
    },

    onMutate: async ({ boardId, updates }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.tasks.board(boardId),
      });

      const previousBoard = queryClient.getQueryData<Board>(
        queryKeys.tasks.board(boardId)
      );

      if (previousBoard) {
        queryClient.setQueryData<Board>(queryKeys.tasks.board(boardId), {
          ...previousBoard,
          ...updates,
        });
      }

      return { previousBoard };
    },

    onError: (_err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          queryKeys.tasks.board(boardId),
          context.previousBoard
        );
      }
    },

    onSuccess: (_data, { boardId }) => {
      // Use helper for consistent invalidation
      invalidateBoardQueries(queryClient, boardId, user?.id);
    },
  });
}

/**
 * Delete a board
 */
export function useDeleteBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await tasksService.deleteBoard(boardId);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },

    onSuccess: (_data, boardId) => {
      // Use helper for consistent invalidation
      invalidateBoardQueries(queryClient, boardId, user?.id);
    },
  });
}

/**
 * Reorder boards
 */
export function useReorderBoards() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (boardIds: string[]) => {
      const { error } = await tasksService.reorderBoards(boardIds);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },

    onError: (error) => {
      console.error("Failed to reorder boards:", error);
    },

    onSuccess: () => {
      // Invalidate board list to update board order
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(user?.id),
      });
    },
  });
}

// =====================================================
// SECTION HOOKS
// =====================================================

/**
 * Get sections for a board
 */
export function useBoardSections(boardId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.boardSections(boardId),
    queryFn: async () => {
      const { data, error } = await tasksService.getBoardSections(boardId);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!user && !!boardId,
  });
}

/**
 * Create a new section
 */
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      sectionData,
    }: {
      boardId: string;
      sectionData: CreateSectionData;
    }) => {
      const { data, error } = await tasksService.createSection(
        boardId,
        sectionData
      );
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data!;
    },

    onSuccess: (_data, { boardId: _boardId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardSections(_boardId),
      });
    },
  });
}

/**
 * Update a section
 */
export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      boardId: _boardId,
      updates,
    }: {
      sectionId: string;
      boardId: string;
      updates: Partial<BoardSection>;
    }) => {
      const { data, error } = await tasksService.updateSection(
        sectionId,
        updates
      );
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data!;
    },

    onSuccess: (_data, { boardId: _boardId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardSections(_boardId),
      });
    },
  });
}

/**
 * Delete a section
 */
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      boardId: _boardId,
    }: {
      sectionId: string;
      boardId: string;
    }) => {
      const { error } = await tasksService.deleteSection(sectionId);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },

    onSuccess: (_data, { boardId: _boardId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardSections(_boardId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(_boardId),
      });
    },
  });
}

/**
 * Reorder sections
 */
export function useReorderSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionIds,
      boardId: _boardId,
    }: {
      sectionIds: string[];
      boardId: string;
    }) => {
      const { error } = await tasksService.reorderSections(sectionIds);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },

    onError: (error) => {
      console.error("Failed to reorder sections:", error);
    },

    onSuccess: (_data, { boardId: _boardId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardSections(_boardId),
      });
    },
  });
}

// =====================================================
// TASK HOOKS
// =====================================================

/**
 * Get single task by ID
 */
export function useTask(taskId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.task(taskId!),
    queryFn: async () => {
      const { data, error } = await tasksService.getTaskById(taskId!);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!user && !!taskId,
  });
}

/**
 * Get tasks with optional filters
 */
export function useTasks(boardId?: string, filters?: TaskFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: boardId
      ? [...queryKeys.tasks.boardTasks(boardId), { filters }]
      : [...queryKeys.tasks.boardTasks(null), { filters }],
    queryFn: async () => {
      const { data, error } = await tasksService.getTasks(boardId, filters);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!user,
  });
}

/**
 * Get today's tasks (due today or overdue)
 */
export function useTodayTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.todayTasks(user?.id),
    queryFn: async () => {
      const { data, error } = await tasksService.getTodayTasks();
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // Refresh more often for today's tasks
    gcTime: 1000 * 60 * 10,
    enabled: !!user,
  });
}

/**
 * Get upcoming tasks (due within 5 days)
 */
export function useUpcomingTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.upcomingTasks(user?.id),
    queryFn: async () => {
      const { data, error } = await tasksService.getUpcomingTasks();
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    enabled: !!user,
  });
}

/**
 * Get archived tasks
 */
export function useArchivedTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.archivedTasks(user?.id),
    queryFn: async () => {
      const { data, error } = await tasksService.getArchivedTasks();
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // Archive changes less frequently
    gcTime: 1000 * 60 * 30,
    enabled: !!user,
  });
}

/**
 * Get count of unassigned tasks (inbox)
 * Lightweight query that only fetches count, not full task data
 */
export function useUnassignedTasksCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.tasks.boardTasks(null), { count: true }],
    queryFn: async () => {
      const { data, error } = await tasksService.getUnassignedTasksCount();
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data || 0;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!user,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      const { data, error } = await tasksService.createTask(taskData);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data!;
    },

    onSuccess: (data) => {
      // Invalidate relevant queries (use exact: false to catch queries with filters)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
        exact: false,
      });
      // If no board_id (inbox task), also invalidate the inbox
      if (!data.board_id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.boardTasks(null),
          exact: false,
        });
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      // Invalidate board list to update task counts
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(user?.id),
      });
    },
  });
}

/**
 * Update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Task>;
      boardId?: string | null;
    }) => {
      const { data, error } = await tasksService.updateTask(taskId, updates);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data!;
    },

    onMutate: async ({ taskId, updates, boardId }) => {
      if (boardId !== undefined) {
        // Cancel outgoing queries to prevent race conditions
        await queryClient.cancelQueries({
          queryKey: queryKeys.tasks.boardTasks(boardId),
        });

        const previousTasks = queryClient.getQueryData<Task[]>(
          queryKeys.tasks.boardTasks(boardId)
        );

        if (previousTasks) {
          // Apply optimistic update
          queryClient.setQueryData<Task[]>(
            queryKeys.tasks.boardTasks(boardId),
            previousTasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            )
          );
        }

        return { previousTasks, boardId };
      }

      return {};
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTasks && context?.boardId !== undefined) {
        queryClient.setQueryData(
          queryKeys.tasks.boardTasks(context.boardId),
          context.previousTasks
        );
      }
    },

    onSuccess: (data) => {
      // Invalidate all task list queries to ensure immediate UI updates
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
      });
      
      // Invalidate the specific task query to ensure fresh data in modals
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.task(data.id),
      });
      
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      
      // Invalidate board list to update task counts if status changed
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(user?.id),
      });
      
      // Invalidate active timers if this task has timer fields
      if (data.timer_duration_seconds || data.timer_started_at) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.activeTimers(),
        });
      }
    },
  });
}

/**
 * Complete a repeatable task and reschedule to next occurrence
 */
export function useCompleteRepeatableTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await tasksService.completeRepeatableTask(taskId);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data!;
    },

    onSuccess: (data) => {
      // Invalidate specific queries based on the rescheduled task
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.task(data.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(user?.id),
      });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ taskId, boardId }: { taskId: string; boardId: string | null }) => {
      const { error } = await tasksService.deleteTask(taskId);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return { taskId, boardId };
    },

    onSuccess: ({ boardId }) => {
      // Invalidate specific board tasks query
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(boardId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      // Invalidate board list to update task counts
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(user?.id),
      });
    },
  });
}
/**
 * Move task to different section (for drag and drop)
 */
export function useMoveTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      sectionId,
      newOrder,
    }: {
      taskId: string;
      sectionId: string | null;
      newOrder: number;
    }) => {
      const { data, error } = await tasksService.moveTask(
        taskId,
        sectionId,
        newOrder
      );
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data!;
    },

    onSuccess: (data) => {
      // Invalidate board tasks to reflect moved task
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
      });
      // Invalidate board list to update task counts if section changed
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(user?.id),
      });
    },
  });
}

/**
 * Reorder tasks within a section
 */
export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskIds,
      boardId: _boardId,
    }: {
      taskIds: string[];
      boardId: string | null;
    }) => {
      const { error } = await tasksService.reorderTasks(taskIds);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
    },

    onError: (error) => {
      console.error("Failed to reorder tasks:", error);
    },

    onSuccess: (_data, { boardId: _boardId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(_boardId),
      });
    },
  });
}

/**
 * Toggle task status between todo and done
 */
export function useToggleTaskStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await tasksService.toggleTaskStatus(taskId);
      if (error) {
        const parsedError = parseSupabaseError(error);
        throw parsedError;
      }
      return data!;
    },

    onMutate: async (taskId) => {
      // Find and update task optimistically
      const boardTasks = queryClient.getQueriesData<Task[]>({
        queryKey: queryKeys.tasks.all,
      });

      let boardId: string | null | undefined;
      for (const [, tasks] of boardTasks) {
        if (Array.isArray(tasks)) {
          const task = tasks.find((t) => t.id === taskId);
          if (task) {
            boardId = task.board_id;
            break;
          }
        }
      }

      if (boardId !== undefined) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.tasks.boardTasks(boardId),
        });

        const previousTasks = queryClient.getQueryData<Task[]>(
          queryKeys.tasks.boardTasks(boardId)
        );

        if (previousTasks) {
          queryClient.setQueryData<Task[]>(
            queryKeys.tasks.boardTasks(boardId),
            previousTasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status: task.status === "done" ? "todo" : "done",
                    completed_at:
                      task.status === "done" ? null : new Date().toISOString(),
                  }
                : task
            )
          );
        }

        return { previousTasks, boardId };
      }

      return {};
    },

    onError: (_err, _taskId, context) => {
      if (context?.previousTasks && context?.boardId) {
        queryClient.setQueryData(
          queryKeys.tasks.boardTasks(context.boardId),
          context.previousTasks
        );
      }
    },

    onSuccess: (data) => {
      // Invalidate board tasks to reflect status change
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      // Invalidate board list to update completed task counts
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(user?.id),
      });
    },
  });
}

/**
 * Archive a task
 */
export function useArchiveTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await tasksService.archiveTask(taskId);
      if (error) throw error;
      return data!;
    },

    onSuccess: (data) => {
      // Invalidate board tasks to remove archived task from view
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.archivedTasks(user?.id),
      });
      // Invalidate board list to update task counts
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(user?.id),
      });
    },
  });
}

// =====================================================
// TIMER HOOKS
// =====================================================

/**
 * Get all active timers with polling
 */
export function useActiveTimers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.activeTimers(),
    queryFn: async () => {
      const { data, error } = await tasksService.getActiveTimers();
      if (error) throw error;
      return data || [];
    },
    refetchInterval: false, // No polling - TimerWidget handles countdown locally
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true, // Check once when user returns to window
    refetchOnMount: true, // Check once on mount
    enabled: !!user,
  });
}

/**
 * Helper: Update task in all list caches
 */
function updateTaskInListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  updater: (task: Task) => Task
) {
  // Update all possible task list queries
  queryClient.setQueriesData<Task[]>(
    { queryKey: queryKeys.tasks.all },
    (oldTasks) => {
      if (!oldTasks) return oldTasks;
      // Ensure we're working with an array (list cache), not a single task
      if (!Array.isArray(oldTasks)) return oldTasks;
      return oldTasks.map((task) => (task.id === taskId ? updater(task) : task));
    }
  );
}

/**
 * Start a task timer
 * 
 * Supports both starting fresh and resuming from pause by accepting custom startTime.
 */
export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      durationMinutes,
      startTime,
    }: {
      taskId: string;
      durationMinutes: number;
      startTime?: string;
    }) => {
      const { data, error } = await tasksService.startTaskTimer(
        taskId,
        durationMinutes,
        startTime
      );
      if (error) throw error;
      return data!;
    },

    // Optimistic update for instant UI feedback
    onMutate: async ({ taskId, durationMinutes, startTime }) => {
      const now = startTime || new Date().toISOString();
      
      // Get the task to know its board_id
      const previousTask = queryClient.getQueryData<Task>(queryKeys.tasks.task(taskId));
      
      // Cancel specific query refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.task(taskId) });
      if (previousTask?.board_id !== undefined) {
        await queryClient.cancelQueries({ queryKey: queryKeys.tasks.boardTasks(previousTask.board_id) });
      }

      // Optimistically update single task query
      if (previousTask) {
        queryClient.setQueryData<Task>(queryKeys.tasks.task(taskId), {
          ...previousTask,
          timer_started_at: now,
          timer_completed_at: null,
          timer_duration_seconds: durationMinutes,
        });
      }

      // Optimistically update all task lists
      updateTaskInListCaches(queryClient, taskId, (task) => ({
        ...task,
        timer_started_at: now,
        timer_completed_at: null,
        timer_duration_seconds: durationMinutes,
      }));

      return { previousTask };
    },

    onError: (_err, { taskId }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(queryKeys.tasks.task(taskId), context.previousTask);
        updateTaskInListCaches(queryClient, taskId, () => context.previousTask!);
      }
    },

    onSettled: (data) => {
      // Refetch to ensure consistency
      if (data) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.task(data.id),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.boardTasks(data.board_id),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.activeTimers(),
        });
      }
    },
  });
}

/**
 * Complete a task timer
 * 
 * Marks the timer as completed when it naturally expires.
 * Pause is now handled entirely in the frontend as local UI state.
 */
export function useCompleteTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await tasksService.completeTaskTimer(taskId);
      if (error) throw error;
      return data!;
    },

    // Optimistic update for instant UI feedback
    onMutate: async (taskId) => {
      const now = new Date().toISOString();
      
      // Get the task to know its board_id
      const previousTask = queryClient.getQueryData<Task>(queryKeys.tasks.task(taskId));
      
      // Cancel specific query refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.task(taskId) });
      if (previousTask?.board_id !== undefined) {
        await queryClient.cancelQueries({ queryKey: queryKeys.tasks.boardTasks(previousTask.board_id) });
      }

      // Optimistically update single task query
      if (previousTask) {
        queryClient.setQueryData<Task>(queryKeys.tasks.task(taskId), {
          ...previousTask,
          timer_completed_at: now,
        });
      }

      // Optimistically update all task lists
      updateTaskInListCaches(queryClient, taskId, (task) => ({
        ...task,
        timer_completed_at: now,
      }));

      return { previousTask };
    },

    onError: (_err, taskId, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(queryKeys.tasks.task(taskId), context.previousTask);
        updateTaskInListCaches(queryClient, taskId, () => context.previousTask!);
      }
    },

    onSettled: (data) => {
      // Refetch to ensure consistency
      if (data) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.task(data.id),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.boardTasks(data.board_id),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.activeTimers(),
        });
      }
    },
  });
}

/**
 * Reset a task timer
 */
export function useResetTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await tasksService.resetTaskTimer(taskId);
      if (error) throw error;
      return data!;
    },

    // Optimistic update for instant UI feedback
    onMutate: async (taskId) => {
      // Get the task to know its board_id
      const previousTask = queryClient.getQueryData<Task>(queryKeys.tasks.task(taskId));
      
      // Cancel specific query refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.task(taskId) });
      if (previousTask?.board_id !== undefined) {
        await queryClient.cancelQueries({ queryKey: queryKeys.tasks.boardTasks(previousTask.board_id) });
      }

      // Optimistically update single task query
      if (previousTask) {
        queryClient.setQueryData<Task>(queryKeys.tasks.task(taskId), {
          ...previousTask,
          timer_started_at: null,
          timer_completed_at: null,
        });
      }

      // Optimistically update all task lists
      updateTaskInListCaches(queryClient, taskId, (task) => ({
        ...task,
        timer_started_at: null,
        timer_completed_at: null,
      }));

      return { previousTask };
    },

    onError: (_err, taskId, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(queryKeys.tasks.task(taskId), context.previousTask);
        updateTaskInListCaches(queryClient, taskId, () => context.previousTask!);
      }
    },

    onSettled: (data) => {
      // Refetch to ensure consistency
      if (data) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.task(data.id),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.boardTasks(data.board_id),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.activeTimers(),
        });
      }
    },
  });
}

// =====================================================
// REMINDER HOOKS
// =====================================================

// =====================================================
// BOARD SHARING HOOKS
// =====================================================

/**
 * Share a board with users
 */
export function useShareBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      userIds,
      role,
    }: {
      boardId: string;
      userIds: string[];
      role: BoardMemberRole;
    }) => {
      const { data, error } = await tasksService.shareBoard(
        boardId,
        userIds,
        role
      );
      if (error) throw error;
      return data!;
    },

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardShares(variables.boardId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.board(variables.boardId),
      });
    },
  });
}

/**
 * Remove board sharing for a user
 */
export function useUnshareBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      userId,
    }: {
      boardId: string;
      userId: string;
    }) => {
      const { data, error } = await tasksService.unshareBoard(boardId, userId);
      if (error) throw error;
      return data!;
    },

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardShares(variables.boardId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.board(variables.boardId),
      });
    },
  });
}

/**
 * Get board members (sharing information)
 */
export function useBoardMembers(boardId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.boardShares(boardId),
    queryFn: async () => {
      const { data, error } = await tasksService.getBoardMembers(boardId);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user && !!boardId && boardId.length > 0,
  });
}

/**
 * Get boards shared with current user
 */
export function useSharedBoards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.sharedBoards(user?.id),
    queryFn: async () => {
      const { data, error } = await tasksService.getSharedBoards();
      // Gracefully handle permission errors - board_shares may not be accessible
      if (error) {
        console.warn("Failed to fetch shared boards:", error);
        return [];
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });
}

/**
 * Update member role (viewer/editor)
 */
export function useUpdateBoardMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
      boardId: _boardId,
    }: {
      memberId: string;
      role: BoardMemberRole;
      boardId: string;
    }) => {
      const { data, error } = await tasksService.updateBoardMemberRole(
        memberId,
        role
      );
      if (error) throw error;
      return data!;
    },

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardShares(variables.boardId),
      });
    },
  });
}
