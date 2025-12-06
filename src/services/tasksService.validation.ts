/**
 * Validation Schemas for Tasks Service
 * SECURITY: Server-side input validation using Zod
 */

import { z } from "zod";

// =====================================================
// BOARD VALIDATION SCHEMAS
// =====================================================

export const CreateBoardSchema = z.object({
  title: z
    .string()
    .min(1, "Board title is required")
    .max(200, "Board title too long"),
  description: z
    .string()
    .max(1000, "Board description too long")
    .nullable()
    .optional(),
  color: z.string().max(50, "Color value too long").nullable().optional(),
  icon: z.string().max(100, "Icon value too long").nullable().optional(),
  is_template: z.boolean().optional().default(false),
  category: z.string().max(100, "Category too long").nullable().optional(),
});

export const UpdateBoardSchema = CreateBoardSchema.partial();

export const BoardIdSchema = z.string().uuid("Invalid board ID");

// =====================================================
// SECTION VALIDATION SCHEMAS
// =====================================================

export const CreateSectionSchema = z.object({
  title: z
    .string()
    .min(1, "Section title is required")
    .max(200, "Section title too long"),
  board_id: z.string().uuid("Invalid board ID"),
  sort_order: z.number().int().min(0).optional(),
  color: z.string().max(50, "Color value too long").nullable().optional(),
});

export const UpdateSectionSchema = CreateSectionSchema.partial().extend({
  board_id: z.string().uuid("Invalid board ID").optional(),
});

export const SectionIdSchema = z.string().uuid("Invalid section ID");

// =====================================================
// TASK VALIDATION SCHEMAS
// =====================================================

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(500, "Task title too long"),
  description: z
    .string()
    .max(5000, "Task description too long")
    .nullable()
    .optional(),
  status: z.enum(["todo", "in_progress", "done", "archived"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  tags: z
    .array(z.string().max(50))
    .max(20, "Too many tags")
    .nullable()
    .optional(),
  board_id: z.string().uuid("Invalid board ID").nullable().optional(),
  section_id: z.string().uuid("Invalid section ID").nullable().optional(),
  parent_task_id: z
    .string()
    .uuid("Invalid parent task ID")
    .nullable()
    .optional(),
  sort_order: z.number().int().min(0).optional(),
  item_type: z.string().max(50, "Item type too long").nullable().optional(),
  item_data: z.record(z.string(), z.unknown()).nullable().optional(),
  is_favorite: z.boolean().optional().default(false),
  reminder_at: z.string().datetime().nullable().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskIdSchema = z.string().uuid("Invalid task ID");

// =====================================================
// FILTER VALIDATION SCHEMAS
// =====================================================

export const TaskFiltersSchema = z.object({
  status: z.enum(["todo", "in_progress", "done", "archived"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  board_id: z.string().uuid("Invalid board ID").optional(),
  section_id: z.string().uuid("Invalid section ID").optional(),
  is_favorite: z.boolean().optional(),
  search: z.string().max(200, "Search query too long").optional(),
  tags: z.array(z.string().max(50)).optional(),
  due_before: z.string().datetime().optional(),
  due_after: z.string().datetime().optional(),
});

// =====================================================
// BULK OPERATION SCHEMAS
// =====================================================

export const BulkTaskUpdateSchema = z.object({
  task_ids: z
    .array(z.string().uuid())
    .min(1)
    .max(100, "Too many tasks selected"),
  updates: UpdateTaskSchema,
});

export const ReorderTasksSchema = z.object({
  board_id: z.string().uuid("Invalid board ID").optional(),
  section_id: z.string().uuid("Invalid section ID").optional(),
  task_orders: z
    .array(
      z.object({
        task_id: z.string().uuid(),
        sort_order: z.number().int().min(0),
      })
    )
    .min(1)
    .max(1000, "Too many tasks to reorder"),
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Validate and parse input data with a schema
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Parsed and validated data
 * @throws ZodError if validation fails
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validate input and return result with error
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Object with success flag, data, and optional error
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
