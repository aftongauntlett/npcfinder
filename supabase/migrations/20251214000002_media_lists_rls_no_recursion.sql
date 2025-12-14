-- Migration: Media Lists - Fix RLS recursion
-- Fixes Postgres RLS infinite recursion caused by policies that cross-reference
-- media_lists <-> media_list_members.

-- SECURITY DEFINER helpers bypass row-level security to avoid recursive policy evaluation.

CREATE OR REPLACE FUNCTION public.is_media_list_owner(check_list_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.media_lists ml
    WHERE ml.id = check_list_id
      AND ml.owner_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_media_list(check_list_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    OR public.is_media_list_owner(check_list_id, check_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.media_list_members m
      WHERE m.list_id = check_list_id
        AND m.user_id = check_user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.media_lists ml
      WHERE ml.id = check_list_id
        AND ml.is_public = true
        AND EXISTS (
          SELECT 1
          FROM public.connections c
          WHERE (c.user_id = check_user_id AND c.friend_id = ml.owner_id)
             OR (c.friend_id = check_user_id AND c.user_id = ml.owner_id)
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_media_list_items(check_list_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    OR public.is_media_list_owner(check_list_id, check_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.media_list_members m
      WHERE m.list_id = check_list_id
        AND m.user_id = check_user_id
        AND m.role = 'editor'
    );
$$;

-- MEDIA_LISTS
DROP POLICY IF EXISTS "media_lists_select" ON public.media_lists;
CREATE POLICY "media_lists_select" ON public.media_lists
  FOR SELECT TO authenticated
  USING (public.can_view_media_list(id, auth.uid()));

-- Keep INSERT/UPDATE/DELETE restricted to owner (or admin/super_admin)
DROP POLICY IF EXISTS "media_lists_insert" ON public.media_lists;
CREATE POLICY "media_lists_insert" ON public.media_lists
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = owner_id
  );

DROP POLICY IF EXISTS "media_lists_update" ON public.media_lists;
CREATE POLICY "media_lists_update" ON public.media_lists
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = owner_id
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = owner_id
  );

DROP POLICY IF EXISTS "media_lists_delete" ON public.media_lists;
CREATE POLICY "media_lists_delete" ON public.media_lists
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = owner_id
  );

-- MEDIA_LIST_MEMBERS
DROP POLICY IF EXISTS "media_list_members_select" ON public.media_list_members;
CREATE POLICY "media_list_members_select" ON public.media_list_members
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR user_id = auth.uid()
    OR public.is_media_list_owner(list_id, auth.uid())
  );

DROP POLICY IF EXISTS "media_list_members_insert" ON public.media_list_members;
CREATE POLICY "media_list_members_insert" ON public.media_list_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR (
      invited_by = auth.uid()
      AND public.is_media_list_owner(list_id, auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.connections c
        WHERE (c.user_id = auth.uid() AND c.friend_id = media_list_members.user_id)
           OR (c.friend_id = auth.uid() AND c.user_id = media_list_members.user_id)
      )
    )
  );

DROP POLICY IF EXISTS "media_list_members_update" ON public.media_list_members;
CREATE POLICY "media_list_members_update" ON public.media_list_members
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.is_media_list_owner(list_id, auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.is_media_list_owner(list_id, auth.uid())
  );

DROP POLICY IF EXISTS "media_list_members_delete" ON public.media_list_members;
CREATE POLICY "media_list_members_delete" ON public.media_list_members
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR public.is_media_list_owner(list_id, auth.uid())
  );

-- MEDIA_LIST_ITEMS
DROP POLICY IF EXISTS "media_list_items_select" ON public.media_list_items;
CREATE POLICY "media_list_items_select" ON public.media_list_items
  FOR SELECT TO authenticated
  USING (public.can_view_media_list(list_id, auth.uid()));

DROP POLICY IF EXISTS "media_list_items_insert" ON public.media_list_items;
CREATE POLICY "media_list_items_insert" ON public.media_list_items
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_media_list_items(list_id, auth.uid()));

DROP POLICY IF EXISTS "media_list_items_update" ON public.media_list_items;
CREATE POLICY "media_list_items_update" ON public.media_list_items
  FOR UPDATE TO authenticated
  USING (public.can_edit_media_list_items(list_id, auth.uid()))
  WITH CHECK (public.can_edit_media_list_items(list_id, auth.uid()));

DROP POLICY IF EXISTS "media_list_items_delete" ON public.media_list_items;
CREATE POLICY "media_list_items_delete" ON public.media_list_items
  FOR DELETE TO authenticated
  USING (public.can_edit_media_list_items(list_id, auth.uid()));
