/**
 * Tasks Service - Supabase Implementation
 *
 * Handles all database operations for the Tasks feature:
 * - Boards: User-created boards for organizing tasks
 * - Sections: Columns within boards (To Do, In Progress, Done)
 * - Tasks: Individual task items with metadata
 */

import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
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
  BoardShareWithUser,
  SharedBoardData,
} from "./tasksService.types";

// =====================================================
// BOARD OPERATIONS
// =====================================================

/**
 * Fetch all boards for the current user
 */
export async function getBoards(): Promise<ServiceResponse<Board[]>> {
  try {
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
 */
export async function getBoardsWithStats(): Promise<
  ServiceResponse<BoardWithStats[]>
> {
  try {
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
 */
export async function getBoardById(
  boardId: string
): Promise<ServiceResponse<Board>> {
  try {
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
 */
export async function createBoard(
  boardData: CreateBoardData
): Promise<ServiceResponse<Board>> {
  try {
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
    const templateType =
      boardData.template_type || (boardType === "list" ? "markdown" : "kanban");

    const { data, error } = await supabase
      .from("task_boards")
      .insert({
        user_id: user.id,
        name: boardData.name,
        description: boardData.description || null,
        icon: boardData.icon || null,
        color: boardData.color || "#9333ea",
        is_public: boardData.is_public || false,
        board_type: boardType,
        template_type: templateType,
        field_config: boardData.field_config || null,
        display_order: nextOrder,
      })
      .select()
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
 */
export async function updateBoard(
  boardId: string,
  updates: Partial<Board>
): Promise<ServiceResponse<Board>> {
  try {
    const { data, error } = await supabase
      .from("task_boards")
      .update(updates)
      .eq("id", boardId)
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
 */
export async function deleteBoard(
  boardId: string
): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from("task_boards")
      .delete()
      .eq("id", boardId);

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

    await Promise.all(updates);
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

    await Promise.all(updates);
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
 */
export async function getTasks(
  boardId?: string,
  filters?: TaskFilters
): Promise<ServiceResponse<Task[]>> {
  try {
    let query = supabase
      .from("tasks")
      .select("*")
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
    if (filters?.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps("tags", filters.tags);
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
 */
export async function getTaskById(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
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
 */
export async function getTodayTasks(): Promise<ServiceResponse<Task[]>> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .lte("due_date", today)
      .in("status", ["todo", "in_progress"])
      .order("due_date", { ascending: true })
      .order("priority", { ascending: false, nullsFirst: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error("Failed to fetch today's tasks", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Fetch archived tasks
 */
export async function getArchivedTasks(): Promise<ServiceResponse<Task[]>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
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
        status: taskData.status || "todo",
        priority: taskData.priority || null,
        due_date: taskData.due_date || null,
        tags: taskData.tags || null,
        item_data: taskData.item_data || null,
        display_order: nextOrder,
        // Repeatable task fields
        is_repeatable: taskData.is_repeatable || null,
        repeat_frequency: taskData.repeat_frequency || null,
        repeat_custom_days: taskData.repeat_custom_days || null,
        last_completed_at: null, // Set by toggleTaskStatus when completing repeatable tasks
        // Timer fields
        timer_duration_minutes: taskData.timer_duration_minutes || null,
        timer_started_at: null, // Set by startTaskTimer
        timer_completed_at: null, // Set by completeTaskTimer
        is_urgent_after_timer: taskData.is_urgent_after_timer || null,
        // Reminder fields
        reminder_date: taskData.reminder_date || null,
        reminder_time: taskData.reminder_time || null,
        reminder_sent_at: null, // Set by markReminderSent or backend reminder service
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
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<ServiceResponse<Task>> {
  try {
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
 */
export async function deleteTask(
  taskId: string
): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    logger.error(`Failed to delete task ${taskId}`, error);
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

    await Promise.all(updates);
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
// ONBOARDING & STARTER TEMPLATES
// =====================================================

/**
 * Create default starter boards for new users
 * Creates Job Applications and Recipe Collection boards
 */
export async function createStarterBoards(): Promise<ServiceResponse<Board[]>> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Check if user already has boards
    const { data: existingBoards } = await supabase
      .from("task_boards")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (existingBoards && existingBoards.length > 0) {
      // User already has boards, skip creation
      return { data: [], error: null };
    }

    const starterBoards: CreateBoardData[] = [
      {
        name: "Job Applications",
        description: "Track your job search and application progress",
        icon: "Briefcase",
        color: "#3b82f6",
        board_type: "job_tracker",
        template_type: "job_tracker",
        field_config: { starter: true },
      },
      {
        name: "Recipe Collection",
        description: "Save and organize your favorite recipes",
        icon: "ChefHat",
        color: "#f59e0b",
        board_type: "list",
        template_type: "recipe",
        field_config: { starter: true },
      },
    ];

    const createdBoards: Board[] = [];

    for (const boardData of starterBoards) {
      const result = await createBoard(boardData);
      if (result.data) {
        createdBoards.push(result.data);
      }
    }

    return { data: createdBoards, error: null };
  } catch (error) {
    logger.error("Failed to create starter boards", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Ensure starter boards exist for the current user
 * Call this on first getBoardsWithStats when empty
 */
export async function ensureStarterBoards(): Promise<
  ServiceResponse<BoardWithStats[]>
> {
  try {
    // First attempt to create starter boards
    await createStarterBoards();

    // Then fetch all boards with stats
    return await getBoardsWithStats();
  } catch (error) {
    logger.error("Failed to ensure starter boards", error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// TIMER OPERATIONS
// =====================================================

/**
 * Start a timer for a task
 * FIELD ISOLATION: Only touches timer_* fields, does not affect other task properties
 */
export async function startTaskTimer(
  taskId: string,
  durationMinutes: number,
  isUrgentAfter = false
): Promise<ServiceResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        timer_duration_minutes: durationMinutes,
        timer_started_at: new Date().toISOString(),
        timer_completed_at: null, // Reset completion if restarting timer
        is_urgent_after_timer: isUrgentAfter,
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
 * FIELD ISOLATION: Only touches timer_completed_at, does not affect other task properties
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
 * Get all tasks with active timers
 */
export async function getActiveTimers(): Promise<ServiceResponse<Task[]>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
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
// REMINDER OPERATIONS
// =====================================================

/**
 * Get tasks with upcoming reminders
 */
export async function getUpcomingReminders(
  daysAhead = 7
): Promise<ServiceResponse<Task[]>> {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .not("reminder_date", "is", null)
      .gte("reminder_date", today.toISOString().split("T")[0])
      .lte("reminder_date", futureDate.toISOString().split("T")[0])
      .order("reminder_date", { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error("Failed to fetch upcoming reminders", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Mark a reminder as sent
 * FIELD ISOLATION: Only touches reminder_sent_at, does not affect other task properties
 * NOTE: reminder_sent_at is typically set by a backend reminder service but can be manually
 * triggered via this helper. Frontend does not currently auto-send reminders.
 */
export async function markReminderSent(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        reminder_sent_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    logger.error(`Failed to mark reminder sent for task ${taskId}`, error);
    return { data: null, error: error as Error };
  }
}

// =====================================================
// BOARD SHARING OPERATIONS
// =====================================================

/**
 * Share a board with specific users
 */
export async function shareBoard(
  boardId: string,
  userIds: string[],
  canEdit = false
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

    // Create shares
    const shares = userIds.map((userId) => ({
      board_id: boardId,
      shared_by_user_id: user.id,
      shared_with_user_id: userId,
      can_edit: canEdit,
    }));

    const { error } = await supabase.from("board_shares").insert(shares);

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
      .from("board_shares")
      .delete()
      .eq("board_id", boardId)
      .eq("shared_with_user_id", userId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error(`Failed to unshare board ${boardId}`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all users a board is shared with
 * Note: After migration 20251204000001, shared_with_user_id references auth.users(id).
 * We join to user_profiles where user_profiles.user_id = board_shares.shared_with_user_id.
 * PostgREST infers this join since both columns reference the same auth.users(id).
 */
export async function getBoardShares(
  boardId: string
): Promise<ServiceResponse<BoardShareWithUser[]>> {
  try {
    const { data, error } = await supabase
      .from("board_shares")
      .select(
        `
        *,
        shared_with_user:user_profiles!shared_with_user_id(user_id, display_name)
      `
      )
      .eq("board_id", boardId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    logger.error(`Failed to fetch shares for board ${boardId}`, error);
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
      .from("board_shares")
      .select(
        `
        *,
        board:task_boards_with_stats(*)
      `
      )
      .eq("shared_with_user_id", user.id);

    if (error) throw error;

    // Extract boards from the joined data
    const boards =
      data?.map((share: SharedBoardData) => share.board).filter(Boolean) || [];
    return { data: boards, error: null };
  } catch (error) {
    logger.error("Failed to fetch shared boards", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update sharing permission for a user
 */
export async function updateSharePermission(
  shareId: string,
  canEdit: boolean
): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("board_shares")
      .update({ can_edit: canEdit })
      .eq("id", shareId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    logger.error(`Failed to update share permission ${shareId}`, error);
    return { data: null, error: error as Error };
  }
}
