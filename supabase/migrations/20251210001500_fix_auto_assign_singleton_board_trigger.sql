-- Migration: Fix auto_assign_singleton_board trigger
-- Issue: Trigger references non-existent column 'collection_type'
-- Solution: Remove trigger since singleton board assignment is handled by application logic

-- Drop the broken trigger
DROP TRIGGER IF EXISTS auto_assign_singleton_board_trigger ON tasks;

-- Drop the trigger function (keep ensure_singleton_board for manual use)
DROP FUNCTION IF EXISTS auto_assign_singleton_board();

COMMENT ON FUNCTION ensure_singleton_board IS 'Ensures a singleton board exists for global collection types (job_tracker, recipe, grocery). Called explicitly by application code, not by trigger. Uses search_path = public for security.';
