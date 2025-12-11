-- Migration: Remove repeat_custom_days from tasks table
-- Purpose: Field is deprecated and no longer used by UI or logic
-- Date: 2024-12-10

-- Drop the check constraint first
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_repeat_custom_days_check;

-- Drop the repeat_custom_days column
ALTER TABLE tasks DROP COLUMN IF EXISTS repeat_custom_days;

-- Add comment explaining the removal
COMMENT ON TABLE tasks IS 'User tasks with flexible metadata. Repeatable tasks now use predefined frequencies only (daily, weekly, biweekly, monthly, yearly).';
