-- Migration: Recreate task_boards_with_stats view
-- Date: 2024-12-10
-- Purpose: Recreate the task_boards_with_stats view that was dropped in 20251210004300_remove_board_column_config.sql
-- This view provides board metadata with aggregated task and section statistics

CREATE OR REPLACE VIEW task_boards_with_stats
WITH (security_invoker = true)
AS
SELECT 
  tb.id,
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
  COUNT(DISTINCT tbs.id) AS section_count,
  COUNT(t.id) AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
  COUNT(t.id) FILTER (WHERE t.status IN ('todo', 'in_progress')) AS pending_tasks,
  COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done', 'archived')) AS overdue_tasks,
  MAX(t.created_at) AS most_recent_task_created_at
FROM task_boards tb
LEFT JOIN task_board_sections tbs ON tbs.board_id = tb.id
LEFT JOIN tasks t ON t.board_id = tb.id
GROUP BY tb.id;

COMMENT ON VIEW task_boards_with_stats IS 'Board view with aggregated task and section statistics';
