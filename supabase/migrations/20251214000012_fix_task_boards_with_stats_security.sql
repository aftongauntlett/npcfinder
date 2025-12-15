-- Migration: Fix task_boards_with_stats view to respect RLS
-- Date: 2025-12-14
-- Purpose: Ensure the view properly filters boards based on can_view_task_board function

-- Drop and recreate the view with proper security filtering
DROP VIEW IF EXISTS task_boards_with_stats;

CREATE OR REPLACE VIEW task_boards_with_stats 
WITH (security_invoker = true)
AS
 SELECT tb.id,
    tb.user_id,
    tb.name,
    tb.icon,
    tb.icon_color,
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
  WHERE public.can_view_task_board(tb.id, auth.uid())
  GROUP BY tb.id;

COMMENT ON VIEW task_boards_with_stats IS 'Board view with aggregated task statistics (security-filtered)';

