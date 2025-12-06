/**
 * TanStack Query hooks for Tasks
 * Provides optimistic updates with proper error handling and rollback
 * SECURITY: Includes frontend ownership validation to complement RLS
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as tasksService from "../services/tasksService";
import { queryKeys } from "../lib/queryKeys";
import { useAuth } from "../contexts/AuthContext";
import {
  validateOwnership,
  createOwnershipError,
} from "../utils/ownershipHelpers";
import type {
  Board,
  BoardSection,
  Task,
  CreateBoardData,
  CreateSectionData,
  CreateTaskData,
  TaskFilters,
} from "../services/tasksService.types";

// =====================================================
// BOARD HOOKS
// =====================================================

/**
 * Get all boards for current user
 * Auto-creates starter boards on first use
 */
export function useBoards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.boards(),
    queryFn: async () => {
      const { data, error } = await tasksService.getBoardsWithStats();
      if (error) throw error;

      // Temporarily disabled auto-creation - uncomment to re-enable
      // if (!data || data.length === 0) {
      //   const { data: starterData, error: starterError } =
      //     await tasksService.ensureStarterBoards();
      //   if (starterError) throw starterError;
      //   return starterData || [];
      // }

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
      if (error) throw error;
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

  return useMutation({
    mutationFn: async (boardData: CreateBoardData) => {
      const { data, error } = await tasksService.createBoard(boardData);
      if (error) throw error;
      return data!;
    },

    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
      });
      // Also invalidate the specific board query for the newly created board
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.board(data.id),
      });
    },
  });
}

/**
 * Update a board
 */
export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      updates,
    }: {
      boardId: string;
      updates: Partial<Board>;
    }) => {
      const { data, error } = await tasksService.updateBoard(boardId, updates);
      if (error) throw error;
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

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
      });
    },
  });
}

/**
 * Delete a board
 */
export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await tasksService.deleteBoard(boardId);
      if (error) throw error;
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
      });
    },
  });
}

/**
 * Reorder boards
 */
export function useReorderBoards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardIds: string[]) => {
      const { error } = await tasksService.reorderBoards(boardIds);
      if (error) throw error;
    },

    onError: (error) => {
      console.error("Failed to reorder boards:", error);
      // Note: Consider adding toast notification here for user feedback
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
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
      if (error) throw error;
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
      if (error) throw error;
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
      if (error) throw error;
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
      if (error) throw error;
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
      if (error) throw error;
    },

    onError: (error) => {
      console.error("Failed to reorder sections:", error);
      // Note: Consider adding toast notification here for user feedback
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
      if (error) throw error;
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
      if (error) throw error;
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
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // Refresh more often for today's tasks
    gcTime: 1000 * 60 * 10,
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
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // Archive changes less frequently
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
      if (error) throw error;
      return data!;
    },

    onSuccess: (data) => {
      // Invalidate relevant queries
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
      });
      // If no board_id (inbox task), also invalidate the inbox
      if (!data.board_id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.boardTasks(null),
        });
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
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
    }) => {
      const { data, error } = await tasksService.updateTask(taskId, updates);
      if (error) throw error;
      return data!;
    },

    onMutate: async ({ taskId, updates }) => {
      // Get current task to know which board it belongs to
      const boardTasks = queryClient.getQueriesData<Task[]>({
        queryKey: queryKeys.tasks.all,
      });

      let boardId: string | null | undefined;
      for (const [, tasks] of boardTasks) {
        const task = tasks?.find((t) => t.id === taskId);
        if (task) {
          boardId = task.board_id;
          break;
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
              task.id === taskId ? { ...task, ...updates } : task
            )
          );
        }

        return { previousTasks, boardId };
      }

      return {};
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTasks && context?.boardId) {
        queryClient.setQueryData(
          queryKeys.tasks.boardTasks(context.boardId),
          context.previousTasks
        );
      }
    },

    onSuccess: (data) => {
      // Invalidate the specific task query to ensure fresh data in modals
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.task(data.id),
      });
      // Invalidate all task queries to ensure UI updates everywhere
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
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
    mutationFn: async (taskId: string) => {
      const { error } = await tasksService.deleteTask(taskId);
      if (error) throw error;
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
      });
    },
  });
}

/**
 * Move task to different section (for drag and drop)
 */
export function useMoveTask() {
  const queryClient = useQueryClient();

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
      if (error) throw error;
      return data!;
    },

    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
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
      boardId: string;
    }) => {
      const { error } = await tasksService.reorderTasks(taskIds);
      if (error) throw error;
    },

    onError: (error) => {
      console.error("Failed to reorder tasks:", error);
      // Note: Consider adding toast notification here for user feedback
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
      if (error) throw error;
      return data!;
    },

    onMutate: async (taskId) => {
      // Find and update task optimistically
      const boardTasks = queryClient.getQueriesData<Task[]>({
        queryKey: queryKeys.tasks.all,
      });

      let boardId: string | null | undefined;
      for (const [, tasks] of boardTasks) {
        const task = tasks?.find((t) => t.id === taskId);
        if (task) {
          boardId = task.board_id;
          break;
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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boardTasks(data.board_id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.todayTasks(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.archivedTasks(user?.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.boards(),
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
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 0, // Always fetch fresh data
    enabled: !!user,
  });
}

/**
 * Start a task timer
 */
export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      durationMinutes,
      isUrgentAfter,
    }: {
      taskId: string;
      durationMinutes: number;
      isUrgentAfter?: boolean;
    }) => {
      const { data, error } = await tasksService.startTaskTimer(
        taskId,
        durationMinutes,
        isUrgentAfter
      );
      if (error) throw error;
      return data!;
    },

    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.activeTimers(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.task(data.id),
      });
      if (data.board_id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.boardTasks(data.board_id),
        });
      }
    },
  });
}

/**
 * Complete a task timer
 */
export function useCompleteTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await tasksService.completeTaskTimer(taskId);
      if (error) throw error;
      return data!;
    },

    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.activeTimers(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.task(data.id),
      });
      if (data.board_id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.boardTasks(data.board_id),
        });
      }
    },
  });
}

// =====================================================
// REMINDER HOOKS
// =====================================================

/**
 * Get upcoming reminders
 */
export function useUpcomingReminders(daysAhead = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.upcomingReminders(daysAhead),
    queryFn: async () => {
      const { data, error } = await tasksService.getUpcomingReminders(
        daysAhead
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user,
  });
}

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
      canEdit,
    }: {
      boardId: string;
      userIds: string[];
      canEdit?: boolean;
    }) => {
      const { data, error } = await tasksService.shareBoard(
        boardId,
        userIds,
        canEdit
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
 * Get board sharing information
 */
export function useBoardShares(boardId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.boardShares(boardId),
    queryFn: async () => {
      const { data, error } = await tasksService.getBoardShares(boardId);
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
    queryKey: queryKeys.tasks.sharedBoards(),
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
 * Update sharing permission
 */
export function useUpdateSharePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareId,
      canEdit,
      boardId: _boardId,
    }: {
      shareId: string;
      canEdit: boolean;
      boardId: string;
    }) => {
      const { data, error } = await tasksService.updateSharePermission(
        shareId,
        canEdit
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
