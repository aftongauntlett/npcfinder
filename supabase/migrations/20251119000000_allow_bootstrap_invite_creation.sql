-- Allow bootstrap invite code creation on fresh databases
-- Fixes: create-bootstrap-code.js script blocked by RLS
-- Solution: Allow inserts when zero users exist (initial setup only)

CREATE OR REPLACE FUNCTION public.is_bootstrap_allowed()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth, pg_temp
AS $$
BEGIN
  -- Allow if no users exist yet (initial bootstrap)
  RETURN NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1);
END;
$$;

ALTER FUNCTION public.is_bootstrap_allowed() OWNER TO postgres;

COMMENT ON FUNCTION public.is_bootstrap_allowed() IS 
'Returns true only when database has zero users, allowing bootstrap invite code creation.
Used by create-bootstrap-code.js script for initial admin setup.
Auto-returns false after first user signup (security).';

-- Add policy to allow bootstrap inserts when no users exist
CREATE POLICY "allow_bootstrap_insert"
ON public.invite_codes
FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.is_bootstrap_allowed()
);

COMMENT ON POLICY "allow_bootstrap_insert" ON public.invite_codes IS
'Allows unauthenticated bootstrap script to create first invite code when database has no users.
Auto-disables after first user signup. Required for create-bootstrap-code.js to work.
Security: Only works on empty databases (zero users in auth.users).';
