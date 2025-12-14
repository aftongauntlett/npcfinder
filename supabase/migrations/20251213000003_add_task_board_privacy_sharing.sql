-- Migration: Add privacy and sharing to task boards
-- Date: 2025-12-13
-- Purpose: Mirror Media Lists privacy/sharing for Task Boards via is_public and task_board_members.

-- ----------------------------------------------------------------------------
-- TASK_BOARDS: public visibility flag
-- ----------------------------------------------------------------------------

ALTER TABLE public.task_boards
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.task_boards.is_public IS 'If true, friends can view this board. If false, only owner + explicit shares can view.';

-- ----------------------------------------------------------------------------
-- TABLE: task_board_members (mirrors media_list_members)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.task_board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.task_boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('viewer', 'editor')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_board_members_board_id ON public.task_board_members (board_id);
CREATE INDEX IF NOT EXISTS idx_task_board_members_user_id ON public.task_board_members (user_id);

DROP TRIGGER IF EXISTS update_task_board_members_updated_at_trigger ON public.task_board_members;
CREATE TRIGGER update_task_board_members_updated_at_trigger
BEFORE UPDATE ON public.task_board_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.task_board_members IS 'Explicit task board sharing entries (viewer/editor). Managed by board owner.';

-- ----------------------------------------------------------------------------
-- RLS: helper functions (avoid recursion)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_task_board_owner(check_board_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_boards tb
    WHERE tb.id = check_board_id
      AND tb.user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_task_board(check_board_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    OR public.is_task_board_owner(check_board_id, check_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.task_board_members m
      WHERE m.board_id = check_board_id
        AND m.user_id = check_user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.task_boards tb
      WHERE tb.id = check_board_id
        AND tb.is_public = true
        AND EXISTS (
          SELECT 1
          FROM public.connections c
          WHERE (c.user_id = check_user_id AND c.friend_id = tb.user_id)
             OR (c.friend_id = check_user_id AND c.user_id = tb.user_id)
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_task_board_tasks(check_board_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    OR public.is_task_board_owner(check_board_id, check_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.task_board_members m
      WHERE m.board_id = check_board_id
        AND m.user_id = check_user_id
        AND m.role = 'editor'
    );
$$;

-- Recipe boards do not support per-user sharing.
CREATE OR REPLACE FUNCTION public.can_share_task_board(check_board_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    OR (
      public.is_task_board_owner(check_board_id, check_user_id)
      AND EXISTS (
        SELECT 1
        FROM public.task_boards tb
        WHERE tb.id = check_board_id
          AND COALESCE(tb.template_type, '') <> 'recipe'
      )
    );
$$;

-- ----------------------------------------------------------------------------
-- ENABLE RLS
-- ----------------------------------------------------------------------------

ALTER TABLE public.task_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_board_sections ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- TASK_BOARDS policies
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_select_own_or_admin_all" ON public.task_boards;
CREATE POLICY "task_boards_select" ON public.task_boards
  FOR SELECT TO authenticated
  USING (public.can_view_task_board(id, auth.uid()));

-- Keep INSERT/UPDATE/DELETE restricted to owner (or admin/super_admin)
DROP POLICY IF EXISTS "users_insert_own_or_admin_all" ON public.task_boards;
CREATE POLICY "task_boards_insert" ON public.task_boards
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "users_update_own_or_admin_all" ON public.task_boards;
CREATE POLICY "task_boards_update" ON public.task_boards
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = user_id
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "users_delete_own_or_admin_all" ON public.task_boards;
CREATE POLICY "task_boards_delete" ON public.task_boards
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = user_id
  );

-- ----------------------------------------------------------------------------
-- TASK_BOARD_MEMBERS policies (mirror media_list_members)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "task_board_members_select" ON public.task_board_members;
CREATE POLICY "task_board_members_select" ON public.task_board_members
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR user_id = auth.uid()
    OR public.is_task_board_owner(board_id, auth.uid())
  );

DROP POLICY IF EXISTS "task_board_members_insert" ON public.task_board_members;
CREATE POLICY "task_board_members_insert" ON public.task_board_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR (
      invited_by = auth.uid()
      AND public.can_share_task_board(board_id, auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.connections c
        WHERE (c.user_id = auth.uid() AND c.friend_id = task_board_members.user_id)
           OR (c.friend_id = auth.uid() AND c.user_id = task_board_members.user_id)
      )
    )
  );

DROP POLICY IF EXISTS "task_board_members_update" ON public.task_board_members;
CREATE POLICY "task_board_members_update" ON public.task_board_members
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.can_share_task_board(board_id, auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.can_share_task_board(board_id, auth.uid())
  );

DROP POLICY IF EXISTS "task_board_members_delete" ON public.task_board_members;
CREATE POLICY "task_board_members_delete" ON public.task_board_members
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.is_task_board_owner(board_id, auth.uid())
  );

-- ----------------------------------------------------------------------------
-- TASK_BOARD_SECTIONS: allow viewing for shared/public boards
-- Keep writes restricted to owner/admin (existing pattern)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_select_sections_or_admin_all" ON public.task_board_sections;
CREATE POLICY "task_board_sections_select" ON public.task_board_sections
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.can_view_task_board(board_id, auth.uid())
  );

-- ----------------------------------------------------------------------------
-- TASKS policies: view board tasks for shared/public boards; edit requires editor role
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "users_select_own_or_admin_all" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR (board_id IS NULL AND user_id = auth.uid())
    OR (board_id IS NOT NULL AND public.can_view_task_board(board_id, auth.uid()))
  );

DROP POLICY IF EXISTS "users_insert_own_or_admin_all" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR (board_id IS NULL AND user_id = auth.uid())
    OR (board_id IS NOT NULL AND public.can_edit_task_board_tasks(board_id, auth.uid()))
  );

DROP POLICY IF EXISTS "users_update_own_or_admin_all" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR (board_id IS NULL AND user_id = auth.uid())
    OR (board_id IS NOT NULL AND public.can_edit_task_board_tasks(board_id, auth.uid()))
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR (board_id IS NULL AND user_id = auth.uid())
    OR (board_id IS NOT NULL AND public.can_edit_task_board_tasks(board_id, auth.uid()))
  );

DROP POLICY IF EXISTS "users_delete_own_or_admin_all" ON public.tasks;
CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR (board_id IS NULL AND user_id = auth.uid())
    OR (board_id IS NOT NULL AND public.can_edit_task_board_tasks(board_id, auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- VIEW: task_boards_with_stats should include is_public
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.task_boards_with_stats
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
FROM public.task_boards tb
LEFT JOIN public.task_board_sections tbs ON tbs.board_id = tb.id
LEFT JOIN public.tasks t ON t.board_id = tb.id
GROUP BY tb.id;

COMMENT ON VIEW public.task_boards_with_stats IS 'Board view with aggregated task and section statistics';
