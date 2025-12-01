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
      boardData.template_type || (boardType === "list" ? "notes" : "kanban");

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
      .eq("board_id", taskData.board_id)
      .order("display_order", { ascending: false, nullsFirst: false })
      .limit(1);

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
 */
export async function toggleTaskStatus(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    // First get current status
    const { data: task } = await supabase
      .from("tasks")
      .select("status")
      .eq("id", taskId)
      .single();

    if (!task) throw new Error("Task not found");

    const newStatus = task.status === "done" ? "todo" : "done";

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
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
 */
export async function archiveTask(
  taskId: string
): Promise<ServiceResponse<Task>> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "archived" })
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
