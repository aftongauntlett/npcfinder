-- Migration: Fix task_boards_with_stats view permissions
-- Date: 2024-12-10
-- Purpose: Grant proper SELECT permissions on the recreated task_boards_with_stats view

-- Grant SELECT permission to authenticated users
GRANT SELECT ON task_boards_with_stats TO authenticated;

-- Grant SELECT permission to service_role (for admin operations)
GRANT SELECT ON task_boards_with_stats TO service_role;

-- Add RLS policy to ensure users can only see their own boards or public boards
ALTER VIEW task_boards_with_stats SET (security_invoker = true);

-- Create policy to allow users to view their own boards
-- Note: Views with security_invoker=true inherit the permissions of the underlying tables
-- and respect their RLS policies, so this should work through the task_boards RLS policies
