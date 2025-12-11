-- Migration: Remove column_config from task_boards table
-- Purpose: Field is defined in schema but never read or written in TypeScript code
-- Date: 2024-12-10

-- First, drop the view that depends on this column
DROP VIEW IF EXISTS task_boards_with_stats;

-- Drop the column_config column from task_boards
ALTER TABLE task_boards DROP COLUMN IF EXISTS column_config;

-- Recreate the view without column_config
CREATE OR REPLACE VIEW task_boards_with_stats 
WITH (security_invoker = true)
AS
 SELECT tb.id,
    tb.user_id,
    tb.name,
    tb.description,
    tb.is_public,
    tb.board_type,
    tb.template_type,
    tb.field_config,
    tb.display_order,
    tb.created_at,
    tb.updated_at,
    count(t.id) AS total_tasks,
    count(t.id) FILTER (WHERE (t.status = 'done'::text)) AS completed_tasks,
    count(t.id) FILTER (WHERE (t.status = ANY (ARRAY['todo'::text, 'in_progress'::text]))) AS pending_tasks,
    count(t.id) FILTER (WHERE ((t.due_date < CURRENT_DATE) AND (t.status <> 'done'::text) AND (t.status <> 'archived'::text))) AS overdue_tasks
   FROM (task_boards tb
     LEFT JOIN tasks t ON ((t.board_id = tb.id)))
  GROUP BY tb.id;

-- Add comment explaining the view
COMMENT ON VIEW task_boards_with_stats IS 'Board view with aggregated task statistics';

-- Add comment explaining the change
COMMENT ON TABLE task_boards IS 'User-created task boards for organizing tasks. Board configuration is handled through field_config.';

