-- Disable auto-connect trigger to prevent O(N) scalability issues
--
-- ISSUE:
-- The auto_connect_new_user trigger creates O(N) database inserts on every signup,
-- where N = number of existing users. This causes:
-- - Slow signup times as user base grows
-- - Database load spikes during registration
-- - Potential timeouts with hundreds/thousands of users
-- - Unnecessary connections in production (not everyone needs to be connected)
--
-- SCALABILITY PROBLEM:
-- - 10 users: 9 inserts per signup (18 total rows - bidirectional)
-- - 100 users: 99 inserts per signup (198 total rows)
-- - 1000 users: 999 inserts per signup (1998 total rows)
-- - Trigger latency increases linearly with user count
--
-- SOLUTION:
-- 1. Disable the trigger in production
-- 2. Keep helper functions for manual/selective connections
-- 3. Provide admin endpoint for batch connecting small groups if needed
-- 4. Consider alternative: connection requests, mutual friends, etc.

-- ============================================
-- STEP 1: Disable the Auto-Connect Trigger
-- ============================================

-- Drop the trigger from auth.users
DO $$
BEGIN
  DROP TRIGGER IF EXISTS auto_connect_new_user ON auth.users;
  RAISE NOTICE '✓ Auto-connect trigger disabled';
EXCEPTION 
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Could not drop trigger on auth.users - insufficient privileges. Run via Supabase Dashboard.';
  WHEN OTHERS THEN
    RAISE WARNING 'Could not drop trigger: %', SQLERRM;
END $$;

-- ============================================
-- STEP 2: Keep Helper Functions for Manual Use
-- ============================================

-- The existing functions remain available for selective use:
-- - create_bidirectional_connection(uuid, uuid) 
-- - connect_new_user_to_everyone() [can be called manually if needed]

-- Add comment explaining why trigger is disabled
COMMENT ON FUNCTION public.connect_new_user_to_everyone IS 
  'DEPRECATED: Auto-connect trigger disabled for scalability.
   This function creates O(N) inserts per signup, causing poor performance at scale.
   
   Keep function for manual use in development/testing only.
   For production: implement selective connections, friend requests, or group-based connections.
   
   To manually connect a specific user to everyone (dev/testing only):
   SELECT connect_new_user_to_everyone() FROM auth.users WHERE id = ''user-id'';';

COMMENT ON FUNCTION public.create_bidirectional_connection IS 
  'Creates bidirectional connection between two users.
   Available for manual connections or future friend request features.
   
   Usage:
   - Manual connection: SELECT create_bidirectional_connection(user1_id, user2_id);
   - Friend requests: Call after both users accept
   - Group connections: Batch connect members of same group/org';

-- ============================================
-- STEP 3: Create Configuration Flag
-- ============================================

-- Create app_config table for runtime feature flags
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert auto-connect flag (disabled by default)
INSERT INTO public.app_config (key, value, description)
VALUES (
  'auto_connect_enabled',
  'false',
  'Enable auto-connecting new users to all existing users. WARNING: O(N) scalability issue - only enable in small dev environments.'
)
ON CONFLICT (key) DO UPDATE
SET value = 'false',  -- Force disable even if previously enabled
    description = EXCLUDED.description,
    updated_at = NOW();

-- Grant read access to authenticated users
GRANT SELECT ON public.app_config TO authenticated;

-- Only admins can modify config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config"
  ON public.app_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify config"
  ON public.app_config
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- STEP 4: Create Manual Batch Connect Function (Admin Only)
-- ============================================

-- Safe alternative: Admin can manually connect specific users
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
   Use for:
   - Small group/team connections
   - Testing with specific users
   - One-time migrations
   
   Example: SELECT batch_connect_users(ARRAY[''user1-id'', ''user2-id'', ''user3-id'']);';

GRANT EXECUTE ON FUNCTION public.batch_connect_users TO authenticated;

-- ============================================
-- STEP 5: Add Indexes for Manual Connection Queries
-- ============================================

-- Ensure indexes exist for manual connection features
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_friend_id ON public.connections(friend_id);
CREATE INDEX IF NOT EXISTS idx_connections_created_at ON public.connections(created_at);

-- ============================================
-- STEP 6: Logging and Verification
-- ============================================

DO $$
DECLARE
  total_connections INTEGER;
  total_users INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO total_connections FROM public.connections;
  
  -- Check if trigger still exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_connect_new_user'
  ) INTO trigger_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Auto-Connect Trigger Disabled';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Existing connections: %', total_connections;
  RAISE NOTICE 'Trigger active: %', CASE WHEN trigger_exists THEN '✗ Still active (ERROR)' ELSE '✓ Disabled' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '- Existing connections remain intact';
  RAISE NOTICE '- New signups will NOT auto-connect';
  RAISE NOTICE '- Use batch_connect_users() for manual connections';
  RAISE NOTICE '- Consider implementing friend requests or group-based connections';
  RAISE NOTICE '========================================';
END $$;
