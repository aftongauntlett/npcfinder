-- Migration: Update board template types
-- Remove old templates (grocery, notes, todo) and add markdown
-- Date: 2025-12-01

-- Drop the old constraint
ALTER TABLE "public"."task_boards" 
  DROP CONSTRAINT IF EXISTS "task_boards_template_type_check";

-- Add new constraint with updated template types
ALTER TABLE "public"."task_boards" 
  ADD CONSTRAINT "task_boards_template_type_check" 
  CHECK (("template_type" IN ('job_tracker', 'markdown', 'recipe', 'kanban', 'custom')));

-- Update comment
COMMENT ON COLUMN "public"."task_boards"."template_type" IS 'Type of board template: job_tracker, markdown, recipe, kanban, or custom';

-- Migrate any existing boards with old template types to markdown
-- This is safe since the old templates (grocery, notes, todo) were all list-based
UPDATE "public"."task_boards"
SET "template_type" = 'markdown'
WHERE "template_type" IN ('grocery', 'notes', 'todo');
