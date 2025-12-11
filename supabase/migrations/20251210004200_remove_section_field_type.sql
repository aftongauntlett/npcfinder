-- Migration: Remove field_type from task_board_sections table
-- Purpose: Field is never referenced in code; sections only use id, board_id, name, display_order, created_at
-- Date: 2024-12-10

-- Drop the check constraint first
ALTER TABLE task_board_sections DROP CONSTRAINT IF EXISTS task_board_sections_field_type_check;

-- Drop the field_type column
ALTER TABLE task_board_sections DROP COLUMN IF EXISTS field_type;

-- Add comment explaining the removal
COMMENT ON TABLE task_board_sections IS 'Sections within task boards for organizing tasks (e.g., To Do, In Progress, Done).';
