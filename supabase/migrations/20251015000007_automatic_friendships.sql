-- ============================================
-- AUTOMATIC CONNECTIONS SYSTEM
-- Every user is automatically connected with all other users
-- This creates an inclusive community with no cliques
-- ============================================

-- Drop the old friends table if it exists and create connections table
DROP TABLE IF EXISTS friends CASCADE;

CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  -- Prevent self-connections
  CHECK (user_id != friend_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_connections_user_id ON connections(user_id);
CREATE INDEX idx_connections_friend_id ON connections(friend_id);
CREATE INDEX idx_connections_status ON connections(status);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view all connections
CREATE POLICY "Users can view all connections"
  ON connections FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only system can insert/delete connections (via trigger)
CREATE POLICY "System can manage connections"
  ON connections FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================
-- FUNCTION: Create bidirectional connection
-- ============================================

CREATE OR REPLACE FUNCTION create_bidirectional_connection(
  user1_id UUID,
  user2_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
BEGIN
  -- Create connection from user1 to user2
  INSERT INTO connections (user_id, friend_id, status)
  VALUES (user1_id, user2_id, 'accepted')
  ON CONFLICT (user_id, friend_id) DO NOTHING;
  
  -- Create connection from user2 to user1
  INSERT INTO connections (user_id, friend_id, status)
  VALUES (user2_id, user1_id, 'accepted')
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$;

-- ============================================
-- FUNCTION: Connect new user to all existing users
-- ============================================

CREATE OR REPLACE FUNCTION connect_new_user_to_everyone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- For each existing user (except the new user)
  FOR existing_user_id IN 
    SELECT id FROM auth.users WHERE id != NEW.id
  LOOP
    -- Create bidirectional connection
    PERFORM create_bidirectional_connection(NEW.id, existing_user_id);
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGER: Auto-connect new users
-- ============================================

DROP TRIGGER IF EXISTS on_user_created_connect_friends ON auth.users;

CREATE TRIGGER on_user_created_connect_friends
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION connect_new_user_to_everyone();

-- ============================================
-- BACKFILL: Connect all existing users
-- ============================================

DO $$
DECLARE
  user1_record RECORD;
  user2_id UUID;
BEGIN
  -- Create connections between all existing users
  FOR user1_record IN SELECT id FROM auth.users LOOP
    FOR user2_id IN SELECT id FROM auth.users WHERE id > user1_record.id LOOP
      PERFORM create_bidirectional_connection(user1_record.id, user2_id);
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Backfilled connections for all existing users';
END;
$$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Uncomment to verify connections were created:
-- SELECT 
--   u.email,
--   COUNT(c.friend_id) as connection_count
-- FROM auth.users u
-- LEFT JOIN connections c ON u.id = c.user_id
-- GROUP BY u.id, u.email
-- ORDER BY u.email;
