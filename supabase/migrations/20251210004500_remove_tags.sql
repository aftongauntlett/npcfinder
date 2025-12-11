-- Migration: Remove tags from tasks table
-- Purpose: Tags are still wired through services and types but explicitly hidden from UI with TODO comment
-- Decision: Fully remove tags as they're not being used and can be reintroduced later if needed
-- Date: 2024-12-10

-- Drop the tags column from tasks
ALTER TABLE tasks DROP COLUMN IF EXISTS tags;

-- Add comment explaining the removal
COMMENT ON TABLE tasks IS 'User tasks with flexible metadata. Tags have been removed; task organization is handled through boards and sections.';
