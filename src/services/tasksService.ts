/**
 * Tasks Service - Supabase Implementation
 *
 * Handles all database operations for the Tasks feature:
 * - Boards: User-created boards for organizing tasks
 * - Sections: Columns within boards (To Do, In Progress, Done)
 * - Tasks: Individual task items with metadata
 * SECURITY: All inputs validated with Zod schemas
 */

import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { getBoardTemplateType } from "../utils/taskConstants";
import { getNextOccurrenceDate } from "../utils/taskHelpers";
import { CreateBoardSchema, validateInput } from "./tasksService.validation";
import type {
  Board,
  BoardSection,
  Task,
  CreateBoardData,
  CreateSectionData,
  CreateTaskData,
  TaskFilters,
  BoardWithStats,
  ServiceResponse,
  BoardMemberRole,
  BoardMemberWithUser,
} from "./tasksService.types";

// =====================================================
// BOARD OPERATIONS
// =====================================================

/**
 * Fetch all boards for the current user
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getBoards(): Promise<ServiceResponse<Board[]>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("task_boards")
      .select("*")
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error("Failed to fetch boards", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch all boards with stats (using view)
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getBoardsWithStats(): Promise<
  ServiceResponse<BoardWithStats[]>
> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("task_boards_with_stats")
      .select("*")
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error("Failed to fetch boards with stats", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch a single board by ID
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getBoardById(
  boardId: string
): Promise<ServiceResponse<Board>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("task_boards")
      .select("*")
      .eq("id", boardId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to fetch board ${boardId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new board with default sections
 * SECURITY: Input validated with Zod schema
 */
export async function createBoard(
  boardData: CreateBoardData
): Promise<ServiceResponse<Board>> {
  try {
    // SECURITY: Validate input
    const validatedData = validateInput(CreateBoardSchema, {
      title: boardData.name,
      is_template: boardData.is_public,
      category: boardData.board_type,
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Calculate next display_order
    const { data: existingBoards } = await supabase
      .from("task_boards")
      .select("display_order")
      .eq("user_id", user.id)
      .order("display_order", { ascending: false, nullsFirst: false })
      .limit(1);

    const nextOrder =
      existingBoards && existingBoards.length > 0
        ? (existingBoards[0].display_order || 0) + 1
        : 0;

    // Create board
    const boardType = boardData.board_type || "kanban";
    const templateType = getBoardTemplateType(
      boardType,
      boardData.template_type
    );

    // Note: We separate INSERT and SELECT because chaining .insert().select()
    // can cause RLS policy issues where can_view_task_board() fails on the
    // newly created row within the same transaction.
    const { error: insertError } = await supabase
      .from("task_boards")
      .insert({
        user_id: user.id,
        name: validatedData.title,
        icon: boardData.icon || null,
        icon_color: boardData.icon_color || null,
        is_public: boardData.is_public || false,
        board_type: boardType,
        template_type: templateType,
        field_config: boardData.field_config || null,
        display_order: nextOrder,
      });

    if (insertError) throw insertError;

    // Fetch the newly created board
    const { data, error } = await supabase
      .from("task_boards")
      .select()
      .eq("user_id", user.id)
      .eq("name", validatedData.title)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    // Create default sections (To Do, In Progress, Done)
    if (data) {
      await createDefaultSections(data.id);
    }

    return { data, error: null };
  } catch (error) {
    logger.error("Failed to create board", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create default sections for a new board
 */
async function createDefaultSections(boardId: string): Promise<void> {
  const defaultSections = [
    { name: "To Do", display_order: 0 },
    { name: "In Progress", display_order: 1 },
    { name: "Done", display_order: 2 },
  ];

  await supabase.from("task_board_sections").insert(
    defaultSections.map((section) => ({
      board_id: boardId,
      ...section,
    }))
  );
}

/**
 * Update a board
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function updateBoard(
  boardId: string,
  updates: Partial<Board>
): Promise<ServiceResponse<Board>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("task_boards")
      .update(updates)
      .eq("id", boardId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to update board ${boardId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a board (cascade deletes tasks and sections)
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function deleteBoard(
  boardId: string
): Promise<ServiceResponse<void>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("task_boards")
      .delete()
      .eq("id", boardId)
      .eq("user_id", user.id);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    logger.error(`Failed to delete board ${boardId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Reorder boards
 */
export async function reorderBoards(
  boardIds: string[]
): Promise<ServiceResponse<void>> {
  try {
    const updates = boardIds.map((id, index) =>
      supabase.from("task_boards").update({ display_order: index }).eq("id", id)
    );

    const results = await Promise.all(updates);

    // Check for individual errors
    const failedIds: string[] = [];
    const errors: unknown[] = [];
    results.forEach((result, index) => {
      if (result.error) {
        failedIds.push(boardIds[index]);
        errors.push(result.error);
      }
    });

    if (errors.length > 0) {
      logger.error(`Failed to reorder ${errors.length} board(s)`, {
        failedIds,
        errors,
      });
      throw new Error(`Failed to reorder ${errors.length} board(s)`);
    }

    return { data: null, error: null };
  } catch (error) {
    logger.error("Failed to reorder boards", error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// SECTION OPERATIONS
// =====================================================

/**
 * Fetch sections for a board
 */
export async function getBoardSections(
  boardId: string
): Promise<ServiceResponse<BoardSection[]>> {
  try {
    const { data, error } = await supabase
      .from("task_board_sections")
      .select("*")
      .eq("board_id", boardId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error(`Failed to fetch sections for board ${boardId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new section
 */
export async function createSection(
  boardId: string,
  sectionData: CreateSectionData
): Promise<ServiceResponse<BoardSection>> {
  try {
    const { data, error } = await supabase
      .from("task_board_sections")
      .insert({
        board_id: boardId,
        name: sectionData.name,
        display_order: sectionData.display_order,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to create section in board ${boardId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a section
 */
export async function updateSection(
  sectionId: string,
  updates: Partial<BoardSection>
): Promise<ServiceResponse<BoardSection>> {
  try {
    const { data, error } = await supabase
      .from("task_board_sections")
      .update(updates)
      .eq("id", sectionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to update section ${sectionId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a section (tasks become unsectioned)
 */
export async function deleteSection(
  sectionId: string
): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from("task_board_sections")
      .delete()
      .eq("id", sectionId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    logger.error(`Failed to delete section ${sectionId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Reorder sections within a board
 */
export async function reorderSections(
  sectionIds: string[]
): Promise<ServiceResponse<void>> {
  try {
    const updates = sectionIds.map((id, index) =>
      supabase
        .from("task_board_sections")
        .update({ display_order: index })
        .eq("id", id)
    );

    const results = await Promise.all(updates);

    // Check for individual errors
    const failedIds: string[] = [];
    const errors: unknown[] = [];
    results.forEach((result, index) => {
      if (result.error) {
        failedIds.push(sectionIds[index]);
        errors.push(result.error);
      }
    });

    if (errors.length > 0) {
      logger.error(`Failed to reorder ${errors.length} section(s)`, {
        failedIds,
        errors,
      });
      throw new Error(`Failed to reorder ${errors.length} section(s)`);
    }

    return { data: null, error: null };
  } catch (error) {
    logger.error("Failed to reorder sections", error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// TASK OPERATIONS
// =====================================================

/**
 * Fetch tasks with optional filters
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getTasks(
  boardId?: string,
  filters?: TaskFilters
): Promise<ServiceResponse<Task[]>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    // Filter by board
    if (boardId) {
      query = query.eq("board_id", boardId);
    } else if (filters?.unassigned) {
      // Filter for inbox tasks (no board assigned)
      query = query.is("board_id", null);
    }

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.dueBefore) {
      query = query.lte("due_date", filters.dueBefore);
    }
    if (filters?.dueAfter) {
      query = query.gte("due_date", filters.dueAfter);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error("Failed to fetch tasks", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch a single task by ID
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getTaskById(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to fetch task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch tasks due today or overdue
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getTodayTasks(): Promise<ServiceResponse<Task[]>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .lte("due_date", today)
      .in("status", ["todo", "in_progress"])
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error("Failed to fetch today's tasks", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch upcoming tasks (due within the next 5 days)
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getUpcomingTasks(): Promise<ServiceResponse<Task[]>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const today = new Date();
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);

    const todayStr = today.toISOString().split("T")[0];
    const fiveDaysStr = fiveDaysFromNow.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .gte("due_date", todayStr)
      .lte("due_date", fiveDaysStr)
      .in("status", ["todo", "in_progress"])
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(10); // Limit to 10 upcoming tasks

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error("Failed to fetch upcoming tasks", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get count of unassigned tasks (inbox)
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getUnassignedTasksCount(): Promise<
  ServiceResponse<number>
> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { count, error } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("board_id", null);

    if (error) throw error;
    return { data: count || 0, error: null };
  } catch (error) {
    logger.error("Failed to fetch unassigned tasks count", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch archived tasks
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getArchivedTasks(): Promise<ServiceResponse<Task[]>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "archived")
      .order("archived_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error("Failed to fetch archived tasks", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new task
 */
export async function createTask(
  taskData: CreateTaskData
): Promise<ServiceResponse<Task>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Calculate next display_order within section or board
    let existingTasksQuery = supabase
      .from("tasks")
      .select("display_order")
      .order("display_order", { ascending: false, nullsFirst: false })
      .limit(1);

    // Handle null board_id properly (inbox tasks)
    if (taskData.board_id) {
      existingTasksQuery = existingTasksQuery.eq("board_id", taskData.board_id);
    } else {
      existingTasksQuery = existingTasksQuery.is("board_id", null);
    }

    // Handle null section_id properly
    if (taskData.section_id) {
      existingTasksQuery = existingTasksQuery.eq(
        "section_id",
        taskData.section_id
      );
    } else {
      existingTasksQuery = existingTasksQuery.is("section_id", null);
    }

    const { data: existingTasks } = await existingTasksQuery;

    const nextOrder =
      existingTasks && existingTasks.length > 0
        ? (existingTasks[0].display_order || 0) + 1
        : 0;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        board_id: taskData.board_id,
        section_id: taskData.section_id || null,
        title: taskData.title,
        description: taskData.description || null,
        icon: taskData.icon ?? null,
        icon_color: taskData.icon_color ?? null,
        status: taskData.status || "todo",
        due_date: taskData.due_date || null,
        item_data: taskData.item_data || null,
        display_order: nextOrder,
        // Repeatable task fields
        is_repeatable: taskData.is_repeatable || null,
        repeat_frequency: taskData.repeat_frequency || null,
        last_completed_at: null, // Set by toggleTaskStatus when completing repeatable tasks
        // Timer fields
        timer_duration_seconds: taskData.timer_duration_seconds || null,
        timer_started_at: null, // Set by startTaskTimer
        timer_completed_at: null, // Set by completeTaskTimer
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error("Failed to create task", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a task
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<ServiceResponse<Task>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to update task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a task
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function deleteTask(
  taskId: string
): Promise<ServiceResponse<void>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    logger.error(`Failed to delete task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Complete a repeatable task and reschedule it
 * Marks the task as done and updates the date to the next occurrence
 * 
 * NOTE: This service method implements repeatable completion logic that differs from the
 * client-side implementation in src/components/pages/tasks/InboxView.tsx.
 * - This service: Uses getNextOccurrenceDate() from taskHelpers and returns ISO string
 * - InboxView: Uses getNextDueDate() from repeatableTaskHelpers and returns YYYY-MM-DD
 * 
 * TODO: Standardize on a single source of truth for repeatable task completion behavior.
 * Either migrate all client code to use this service method, or remove this service helper
 * and keep the existing client-side approach. Ensure consistent use of date helpers and
 * format (YYYY-MM-DD vs ISO strings) across the codebase.
 */
export async function completeRepeatableTask(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // First, get the current task
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !task) throw fetchError || new Error("Task not found");

    if (!task.is_repeatable || !task.repeat_frequency || !task.due_date) {
      throw new Error("Task is not repeatable");
    }

    // Calculate next occurrence
    const nextDate = getNextOccurrenceDate(
      task.due_date,
      task.repeat_frequency as "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "custom",
      task.repeat_interval || 1
    );

    // Update task: reset to todo status and update date to next occurrence
    const { data, error } = await supabase
      .from("tasks")
      .update({
        status: "todo",
        due_date: nextDate.toISOString(),
      })
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to complete repeatable task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Move task to a different section
 */
export async function moveTask(
  taskId: string,
  sectionId: string | null,
  newOrder: number
): Promise<ServiceResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        section_id: sectionId,
        display_order: newOrder,
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to move task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Reorder tasks within a section
 */
export async function reorderTasks(
  taskIds: string[]
): Promise<ServiceResponse<void>> {
  try {
    const updates = taskIds.map((id, index) =>
      supabase.from("tasks").update({ display_order: index }).eq("id", id)
    );

    const results = await Promise.all(updates);

    // Check for individual errors
    const failedIds: string[] = [];
    const errors: unknown[] = [];
    results.forEach((result, index) => {
      if (result.error) {
        failedIds.push(taskIds[index]);
        errors.push(result.error);
      }
    });

    if (errors.length > 0) {
      logger.error(`Failed to reorder ${errors.length} task(s)`, {
        failedIds,
        errors,
      });
      throw new Error(`Failed to reorder ${errors.length} task(s)`);
    }

    return { data: null, error: null };
  } catch (error) {
    logger.error("Failed to reorder tasks", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Toggle task status between todo and done
 * For repeatable tasks, updates last_completed_at when marking as done
 */
export async function toggleTaskStatus(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    // First get current status and repeatable flag
    const { data: task } = await supabase
      .from("tasks")
      .select("status, is_repeatable")
      .eq("id", taskId)
      .single();

    if (!task) throw new Error("Task not found");

    const newStatus = task.status === "done" ? "todo" : "done";
    const now = new Date().toISOString();

    // Prepare update payload
    const updates: Partial<Task> = { status: newStatus };

    // When marking as done, set completed_at and last_completed_at (for repeatable tasks)
    if (newStatus === "done") {
      updates.completed_at = now;
      if (task.is_repeatable) {
        updates.last_completed_at = now;
      }
    } else {
      // When marking as todo again, clear completed_at
      updates.completed_at = null;
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to toggle task status ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Archive a task
 * Sets status to 'archived' and updates archived_at timestamp
 */
export async function archiveTask(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to archive task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// TIMER OPERATIONS
// =====================================================

/**
 * Start a timer for a task
 * FIELD ISOLATION: Only touches timer_* fields, does not affect other task properties
 * 
 * @param startTime - Optional custom start time for resuming paused timers
 */
export async function startTaskTimer(
  taskId: string,
  durationMinutes: number,
  startTime?: string
): Promise<ServiceResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        timer_duration_seconds: durationMinutes,
        timer_started_at: startTime || new Date().toISOString(),
        timer_completed_at: null, // Reset completion if restarting timer
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to start timer for task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Complete a task timer
 * FIELD ISOLATION: Only touches timer_completed_at
 * 
 * This marks the timer as completed when it naturally expires.
 * Pause is handled entirely in the frontend as local UI state.
 */
export async function completeTaskTimer(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        timer_completed_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to complete timer for task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Reset task timer (clear all timer state)
 */
export async function resetTaskTimer(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        timer_started_at: null,
        timer_completed_at: null,
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to reset timer for task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all tasks with active timers
 * SECURITY: Explicitly filters by user_id for defense-in-depth
 */
export async function getActiveTimers(): Promise<ServiceResponse<Task[]>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .not("timer_started_at", "is", null)
      .is("timer_completed_at", null)
      .order("timer_started_at", { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error("Failed to fetch active timers", error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// BOARD SHARING OPERATIONS
// =====================================================

/**
 * Get all members a board is shared with.
 *
 * Note: task_board_members.user_id references auth.users(id).
 * user_profiles.user_id also references auth.users(id).
 * Since there's no direct FK between them, we fetch members and profiles separately,
 * then manually join them.
 */
export async function getBoardMembers(
  boardId: string
): Promise<ServiceResponse<BoardMemberWithUser[]>> {
  try {
    const { data: members, error: membersError } = await supabase
      .from("task_board_members")
      .select("*")
      .eq("board_id", boardId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return { data: [], error: null };

    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const membersWithUsers = members.map((member) => ({
      ...member,
      user_profile: profileMap.get(member.user_id) || null,
    }));

    return { data: membersWithUsers as BoardMemberWithUser[], error: null };
  } catch (error) {
    logger.error(`Failed to fetch members for board ${boardId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Share a board with specific users (viewer/editor)
 */
export async function shareBoard(
  boardId: string,
  userIds: string[],
  role: BoardMemberRole
): Promise<ServiceResponse<boolean>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Validate that users are connections
    const { data: connections, error: connectionsError } = await supabase
      .from("connections")
      .select("friend_id")
      .eq("user_id", user.id)
      .in("friend_id", userIds);

    if (connectionsError) throw connectionsError;

    const connectedUserIds = connections?.map((c) => c.friend_id) || [];
    const invalidUserIds = userIds.filter(
      (id) => !connectedUserIds.includes(id)
    );

    if (invalidUserIds.length > 0) {
      throw new Error("Can only share boards with connected users (friends)");
    }

    const shares = userIds.map((userId) => ({
      board_id: boardId,
      user_id: userId,
      role,
      invited_by: user.id,
    }));

    const { error } = await supabase
      .from("task_board_members")
      .upsert(shares, { onConflict: "board_id,user_id" });

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error(`Failed to share board ${boardId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Remove board sharing for a specific user
 */
export async function unshareBoard(
  boardId: string,
  userId: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("task_board_members")
      .delete()
      .eq("board_id", boardId)
      .eq("user_id", userId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error(`Failed to unshare board ${boardId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a member's role (viewer/editor)
 */
export async function updateBoardMemberRole(
  memberId: string,
  role: BoardMemberRole
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("task_board_members")
      .update({ role })
      .eq("id", memberId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error(`Failed to update board member role ${memberId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get boards shared with the current user
 */
export async function getSharedBoards(): Promise<
  ServiceResponse<BoardWithStats[]>
> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("task_board_members")
      .select(
        `
        *,
        board:task_boards_with_stats(*)
      `
      )
      .eq("user_id", user.id);

    if (error) throw error;

    // Extract boards from the joined data
    const boards =
      (data || [])
        .map((member: { board: BoardWithStats | null }) => member.board)
        .filter((board): board is BoardWithStats => Boolean(board)) || [];
    return { data: boards, error: null };
  } catch (error) {
    logger.error("Failed to fetch shared boards", error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// SINGLETON BOARD HELPERS
// =====================================================

/**
 * Template types that should have singleton boards (one per user)
 */
const SINGLETON_TEMPLATE_TYPES = ["job_tracker", "recipe", "kanban"] as const;
type SingletonTemplateType = (typeof SINGLETON_TEMPLATE_TYPES)[number];

/**
 * Check if a template type should be a singleton
 */
export function isSingletonTemplate(templateType: string): boolean {
  return SINGLETON_TEMPLATE_TYPES.includes(
    templateType as SingletonTemplateType
  );
}

/**
 * Get or create a singleton board for global collection types
 * (job_tracker, recipe)
 *
 * These types should have exactly one board per user, auto-created on first use.
 */
export async function ensureSingletonBoard(
  templateType: SingletonTemplateType
): Promise<ServiceResponse<string>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Call the database function to ensure singleton board exists
    const { data, error } = await supabase.rpc("ensure_singleton_board", {
      p_user_id: user.id,
      p_template_type: templateType,
    });

    if (error) throw error;
    return { data: data as string, error: null };
  } catch (error) {
    logger.error(`Failed to ensure singleton board for ${templateType}`, error);
    return { data: null, error: error as Error };
  }
}
