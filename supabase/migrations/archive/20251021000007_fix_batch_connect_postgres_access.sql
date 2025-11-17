-- Allow postgres superuser to run batch_connect_users in SQL editor
-- 
-- ISSUE:
-- batch_connect_users() checks `is_admin(auth.uid())` which fails when
-- run from SQL editor as postgres superuser (no auth context).
--
-- FIX:
-- Allow EITHER:
-- - postgres role (SQL editor, migrations)
-- - authenticated admin users (frontend)

CREATE OR REPLACE FUNCTION public.batch_connect_users(user_ids uuid[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  user_a uuid;
  user_b uuid;
  connections_created integer := 0;
  user_count integer;
BEGIN
  -- Security: Only admins or postgres superuser can batch connect
  -- Allow postgres role (SQL editor) OR authenticated admins (frontend)
  IF current_user != 'postgres' AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can batch connect users';
  END IF;

  user_count := array_length(user_ids, 1);
  
  -- Safety check: Prevent accidentally connecting too many users
  IF user_count > 100 THEN
    RAISE EXCEPTION 'Batch connect limited to 100 users max. Got % users.', user_count;
  END IF;

  -- Connect all pairs
  FOR i IN 1..user_count LOOP
    user_a := user_ids[i];
    FOR j IN (i+1)..user_count LOOP
      user_b := user_ids[j];
      
      PERFORM public.create_bidirectional_connection(user_a, user_b);
      connections_created := connections_created + 1;
    END LOOP;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'users_connected', user_count,
    'connection_pairs_created', connections_created,
    'total_rows_inserted', connections_created * 2
  );
END;
$$;

COMMENT ON FUNCTION public.batch_connect_users IS 
  'Admin-only function to manually connect a group of users (max 100).
   Can be run by:
   - postgres superuser in SQL editor
   - authenticated admin users via frontend
   
   Use for:
   - Small group/team connections
   - Testing with specific users
   - One-time migrations
   
   Example: SELECT batch_connect_users(ARRAY[''user1-id'', ''user2-id'', ''user3-id'']);
   Example: SELECT batch_connect_users(ARRAY(SELECT id FROM auth.users));';
