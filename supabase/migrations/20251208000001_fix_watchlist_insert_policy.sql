-- Migration: Fix user_watchlist INSERT policy to include admin override
-- Description: The 20251207000006 migration updated SELECT/UPDATE/DELETE policies
--              but missed updating the INSERT policy for admin access
-- Date: 2025-12-08

-- Drop the old policy that only allows users to insert their own records
DROP POLICY IF EXISTS "Users can add to their own watchlist" ON user_watchlist;

-- Drop the new policy if it exists (in case this was run manually)
DROP POLICY IF EXISTS "users_insert_own_or_admin_all" ON user_watchlist;

-- Create new policy that allows users to insert their own records OR admins to insert any records
CREATE POLICY "users_insert_own_or_admin_all" ON user_watchlist
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- Add comment
COMMENT ON POLICY "users_insert_own_or_admin_all" ON user_watchlist IS 
  'Users can add items to their own watchlist. Admins can add items to any user watchlist (for bulk imports or support).';
