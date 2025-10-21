-- Automatic Friendships System
-- Creates connections table where all users are automatically connected to each other
-- New users are auto-connected to all existing users via trigger
-- Future-proof: Can add add/remove/hide features later by adding columns/status

-- ============================================
-- CLEANUP: Drop existing objects if re-running
-- ============================================

-- Drop trigger first
DROP TRIGGER IF EXISTS auto_connect_new_user ON auth.users;

-- Drop all versions of the functions using DO block to handle errors
DO $$ 
BEGIN
  -- Drop all overloads of connect_new_user_to_everyone
  EXECUTE 'DROP FUNCTION IF EXISTS public.connect_new_user_to_everyone() CASCADE';
EXCEPTION WHEN OTHERS THEN
  -- If there are multiple versions, drop them all
  EXECUTE 'DROP FUNCTION IF EXISTS public.connect_new_user_to_everyone CASCADE';
END $$;

DO $$ 
BEGIN
  -- Drop all overloads of create_bidirectional_connection
  EXECUTE 'DROP FUNCTION IF EXISTS public.create_bidirectional_connection(UUID, UUID) CASCADE';
EXCEPTION WHEN OTHERS THEN
  EXECUTE 'DROP FUNCTION IF EXISTS public.create_bidirectional_connection CASCADE';
END $$;

-- Drop policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own connections" ON public.connections;
  DROP POLICY IF EXISTS "Users can create connections" ON public.connections;
  DROP POLICY IF EXISTS "Users can update their own connections" ON public.connections;
  DROP POLICY IF EXISTS "Users can delete their own connections" ON public.connections;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist yet, ignore
END $$;

-- ============================================
-- STEP 1: Create Connections Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)  -- No self-connections
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_friend_id ON public.connections(friend_id);

-- Enable Row Level Security
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;

-- ============================================
-- STEP 2: Row-Level Security Policies
-- ============================================

-- Policy 1: Users can view their own connections
CREATE POLICY "Users can view their own connections"
  ON public.connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy 2: Users can insert connections (for future manual friend features)
-- Currently only used by trigger, but allows future add-friend functionality
CREATE POLICY "Users can create connections"
  ON public.connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy 3: Users can update their own connections (for future hide/remove features)
CREATE POLICY "Users can update their own connections"
  ON public.connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy 4: Users can delete their own connections (for future unfriend features)
CREATE POLICY "Users can delete their own connections"
  ON public.connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- STEP 3: Helper Function for Bidirectional Connections
-- ============================================

-- Creates connections in BOTH directions (A→B and B→A)
-- This ensures getFriends() works regardless of which direction we query
CREATE OR REPLACE FUNCTION public.create_bidirectional_connection(
  user_a UUID,
  user_b UUID
)
RETURNS VOID AS $$
BEGIN
  -- Don't create self-connections
  IF user_a = user_b THEN
    RETURN;
  END IF;

  -- Insert A → B
  INSERT INTO public.connections (user_id, friend_id)
  VALUES (user_a, user_b)
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  -- Insert B → A
  INSERT INTO public.connections (user_id, friend_id)
  VALUES (user_b, user_a)
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_bidirectional_connection IS 
  'Creates bidirectional connection between two users. Used by auto-friend trigger and backfill.';

-- ============================================
-- STEP 4: Auto-Connect New Users Trigger
-- ============================================

-- When a new user signs up, connect them to ALL existing users
CREATE OR REPLACE FUNCTION public.connect_new_user_to_everyone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Loop through all existing users (except the new user)
  FOR existing_user_id IN 
    SELECT id 
    FROM auth.users 
    WHERE id != NEW.id
  LOOP
    -- Create bidirectional connection
    PERFORM public.create_bidirectional_connection(NEW.id, existing_user_id);
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.connect_new_user_to_everyone IS 
  'Trigger function that auto-connects new users to all existing users. Creates bidirectional connections.';

-- Create trigger to auto-connect new users
-- This needs to be created by a superuser or the auth schema owner
DO $$
BEGIN
  DROP TRIGGER IF EXISTS auto_connect_new_user ON auth.users;
  
  CREATE TRIGGER auto_connect_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.connect_new_user_to_everyone();
    
  RAISE NOTICE 'Trigger created successfully';
EXCEPTION 
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Could not create trigger on auth.users - insufficient privileges. Run this migration via Supabase Dashboard SQL Editor.';
  WHEN OTHERS THEN
    RAISE WARNING 'Could not create trigger: %', SQLERRM;
END $$;

-- ============================================
-- STEP 5: Backfill Existing Users
-- ============================================

-- Connect all existing users to each other
DO $$
DECLARE
  user_a_id UUID;
  user_b_id UUID;
  user_count INTEGER;
  connection_count INTEGER := 0;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  RAISE NOTICE 'Starting backfill: Found % existing users', user_count;

  -- Create connections between all pairs of users
  FOR user_a_id IN SELECT id FROM auth.users ORDER BY created_at
  LOOP
    FOR user_b_id IN SELECT id FROM auth.users WHERE id > user_a_id ORDER BY created_at
    LOOP
      -- Create bidirectional connection
      PERFORM public.create_bidirectional_connection(user_a_id, user_b_id);
      connection_count := connection_count + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Backfill complete: Created % connection pairs (% total rows including bidirectional)', 
    connection_count, connection_count * 2;
END $$;

-- ============================================
-- STEP 6: Verification
-- ============================================

-- Log final state
DO $$
DECLARE
  total_connections INTEGER;
  total_users INTEGER;
  expected_connections INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO total_connections FROM public.connections;
  
  -- Each user should have N-1 connections in each direction
  -- For N users: N * (N-1) total connection rows (bidirectional)
  expected_connections := total_users * (total_users - 1);
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Connections Table Created Successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Total connection rows: %', total_connections;
  RAISE NOTICE 'Expected connections: %', expected_connections;
  
  IF total_connections = expected_connections THEN
    RAISE NOTICE 'Status: ✓ All users connected correctly';
  ELSE
    RAISE WARNING 'Status: ⚠ Connection count mismatch (expected %, got %)', expected_connections, total_connections;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
