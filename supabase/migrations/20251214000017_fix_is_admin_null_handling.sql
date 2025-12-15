-- Migration: Fix is_admin function to handle NULL roles
-- Date: 2025-12-14
-- Purpose: Make is_admin return false instead of NULL when user has no profile

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN COALESCE(
    get_user_role(check_user_id) IN ('admin', 'super_admin'),
    false
  );
END;
$$;
