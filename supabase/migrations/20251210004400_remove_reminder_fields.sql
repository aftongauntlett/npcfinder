-- Migration: Remove reminder fields from tasks table
-- Purpose: Reminder fields (reminder_date, reminder_time, reminder_sent_at) are only used in backend helpers and never surfaced to UI
-- Date: 2024-12-10

-- Drop the index on reminder_date first
DROP INDEX IF EXISTS idx_tasks_reminder_date;

-- Drop the reminder columns from tasks
ALTER TABLE tasks DROP COLUMN IF EXISTS reminder_date;
ALTER TABLE tasks DROP COLUMN IF EXISTS reminder_time;
ALTER TABLE tasks DROP COLUMN IF EXISTS reminder_sent_at;

-- Add comment explaining the removal
COMMENT ON TABLE tasks IS 'User tasks with flexible metadata. Reminders are not currently in scope for the application roadmap.';
