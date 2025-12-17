/**
 * Remove Priority from Tasks
 * 
 * Removes the priority column from tasks table as it's no longer needed.
 * Priority was originally used to flag urgent or important tasks, but has been
 * superseded by other organizational methods (due dates, timers, sections).
 */

-- Drop the priority column
ALTER TABLE tasks DROP COLUMN IF EXISTS priority;

-- Update table comment to reflect removal
COMMENT ON TABLE tasks IS 'User tasks with flexible metadata. Tasks are organized by boards, sections, due dates, and timers.';
