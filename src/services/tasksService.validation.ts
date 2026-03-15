/**
 * Validation Schemas for Tasks Service
 * SECURITY: Server-side input validation using Zod
 */

import { z } from "zod";

// =====================================================
// BOARD VALIDATION SCHEMAS
// =====================================================

export const CreateBoardSchema = z.object({
  name: z
    .string()
    .min(1, "Board name is required")
    .max(200, "Board name too long"),
  is_public: z.boolean().optional().default(false),
  board_type: z.string().max(100, "Board type too long").nullable().optional(),
  template_type: z
    .enum(["job_tracker", "markdown", "recipe", "kanban", "custom"])
    .nullable()
    .optional(),
});

export const UpdateBoardSchema = CreateBoardSchema.partial();

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
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD")
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
