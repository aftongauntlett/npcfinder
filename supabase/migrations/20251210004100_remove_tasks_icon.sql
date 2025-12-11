-- Migration: Remove icon column from tasks table
-- Purpose: Icon field exists in schema but is never read or rendered in the UI
-- Date: 2024-12-10

-- Drop the icon column from tasks
ALTER TABLE tasks DROP COLUMN IF EXISTS icon;

-- Add comment explaining the removal
COMMENT ON TABLE tasks IS 'User tasks with flexible metadata. Task appearance is determined by priority and status rather than custom icons.';
