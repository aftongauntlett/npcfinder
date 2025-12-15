-- Migration: Add icon/icon_color to task_boards and remove description
-- Date: 2025-12-14
-- Purpose: Add visual customization (icon + icon_color) to boards and remove unused description field

-- First, drop the view that depends on these columns
DROP VIEW IF EXISTS task_boards_with_stats;

-- Add icon and icon_color columns, remove description
ALTER TABLE public.task_boards
  ADD COLUMN IF NOT EXISTS icon text NULL,
  ADD COLUMN IF NOT EXISTS icon_color text NULL,
  DROP COLUMN IF EXISTS description;

COMMENT ON COLUMN public.task_boards.icon IS 'Optional icon identifier for the board (curated UI icon set).';
COMMENT ON COLUMN public.task_boards.icon_color IS 'Optional hex color (e.g. #3B82F6) used for board icon background.';

-- Recreate the view without description column but with icon columns
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
  GROUP BY tb.id;

-- Add comment explaining the view
COMMENT ON VIEW task_boards_with_stats IS 'Board view with aggregated task statistics';
