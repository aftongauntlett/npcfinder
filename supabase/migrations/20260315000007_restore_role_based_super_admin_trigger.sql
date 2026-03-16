-- Security hardening: protect all super_admin role holders from demotion

CREATE OR REPLACE FUNCTION public.prevent_super_admin_revoke()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Prevent changing super_admin role to anything else
  IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
    RAISE EXCEPTION 'Cannot change role of super administrator'
      USING ERRCODE = '42501';
  END IF;
  -- Belt-and-suspenders: force super_admin to stay
  IF OLD.role = 'super_admin' THEN
    NEW.role := 'super_admin';
  END IF;
  RETURN NEW;
END;
$$;
