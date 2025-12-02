-- Add repeatable task fields to tasks table
-- Migration: 20251202000000_add_repeatable_tasks.sql

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_repeatable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS repeat_frequency TEXT CHECK (repeat_frequency IN ('weekly', 'monthly', 'yearly', 'custom')),
  ADD COLUMN IF NOT EXISTS repeat_custom_days INTEGER CHECK (repeat_custom_days > 0 AND repeat_custom_days <= 365),
  ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMPTZ;

-- Add comment to explain the feature
COMMENT ON COLUMN tasks.is_repeatable IS 'Whether this task automatically reschedules after completion';
COMMENT ON COLUMN tasks.repeat_frequency IS 'How often the task repeats: weekly, monthly, yearly, or custom';
COMMENT ON COLUMN tasks.repeat_custom_days IS 'For custom frequency: number of days between repeats (1-365)';
COMMENT ON COLUMN tasks.last_completed_at IS 'Timestamp of when repeatable task was last completed (for tracking)';

-- Create index for querying repeatable tasks efficiently
CREATE INDEX IF NOT EXISTS idx_tasks_repeatable ON tasks(is_repeatable, due_date) WHERE is_repeatable = TRUE;
