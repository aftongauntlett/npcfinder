-- Migration: Collections - mixed domain + authenticated-public visibility
-- Date: 2026-01-26
--
-- Phase 1 of the Collections-first Media refactor:
-- - Allow `media_domain = 'mixed'` for unified collections
-- - Redefine `is_public` to mean: any authenticated user can view read-only

-- -----------------------------------------------------------------------------
-- Allow mixed media domain
-- -----------------------------------------------------------------------------

ALTER TABLE public.media_lists
  DROP CONSTRAINT IF EXISTS media_lists_media_domain_check;

ALTER TABLE public.media_lists
  ADD CONSTRAINT media_lists_media_domain_check
  CHECK (media_domain IN ('movies-tv', 'books', 'games', 'music', 'mixed'));

COMMENT ON COLUMN public.media_lists.is_public IS 'If true, any authenticated user can view this collection read-only. If false, only owner + explicit members can view.';

-- -----------------------------------------------------------------------------
-- RLS helper: authenticated-public visibility
-- -----------------------------------------------------------------------------

-- Prior behavior required a friend connection to view a public list.
-- New behavior: any authenticated user can view when is_public=true.

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
    );
$$;
