-- Migration: Grant permissions on task_boards_with_stats view
-- Date: 2025-12-14
-- Purpose: Fix permission denied error on the view

GRANT SELECT ON task_boards_with_stats TO authenticated;
GRANT SELECT ON task_boards_with_stats TO anon;
