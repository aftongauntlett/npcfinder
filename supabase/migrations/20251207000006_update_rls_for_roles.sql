-- Migration: Update RLS Policies for Role-Based System
-- Description: Updates all RLS policies to use get_user_role() instead of is_admin()
-- Also adds missing admin override policies and fixes security gaps
-- Author: System
-- Date: 2025-12-07

-- =============================================================================
-- PART 1: Update existing policies to use role-based checks
-- Pattern: Replace is_admin(auth.uid()) with get_user_role(auth.uid()) IN ('admin', 'super_admin')
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TASK_BOARDS: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own boards OR admins can view all" ON task_boards;
CREATE POLICY "users_select_own_or_admin_all" ON task_boards
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can update their own boards OR admins can update all" ON task_boards;
CREATE POLICY "users_update_own_or_admin_all" ON task_boards
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can delete their own boards OR admins can delete all" ON task_boards;
CREATE POLICY "users_delete_own_or_admin_all" ON task_boards
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- TASK_BOARD_SECTIONS: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view sections of their boards OR admins can view all" ON task_board_sections;
CREATE POLICY "users_select_sections_or_admin_all" ON task_board_sections
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = task_board_sections.board_id AND task_boards.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update sections in their boards OR admins can update all" ON task_board_sections;
CREATE POLICY "users_update_sections_or_admin_all" ON task_board_sections
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = task_board_sections.board_id AND task_boards.user_id = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = task_board_sections.board_id AND task_boards.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete sections from their boards OR admins can delete all" ON task_board_sections;
CREATE POLICY "users_delete_sections_or_admin_all" ON task_board_sections
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = task_board_sections.board_id AND task_boards.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- TASKS: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own tasks OR admins can view all" ON tasks;
CREATE POLICY "users_select_own_or_admin_all" ON tasks
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can update their own tasks OR admins can update all" ON tasks;
CREATE POLICY "users_update_own_or_admin_all" ON tasks
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can delete their own tasks OR admins can delete all" ON tasks;
CREATE POLICY "users_delete_own_or_admin_all" ON tasks
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- BOARD_SHARES: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view board shares OR admins can view all" ON board_shares;
CREATE POLICY "users_select_board_shares_or_admin_all" ON board_shares
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = board_shares.board_id AND task_boards.user_id = auth.uid()) OR
    shared_with_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Board owners can update shares OR admins can update all" ON board_shares;
CREATE POLICY "board_owners_update_shares_or_admin_all" ON board_shares
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = board_shares.board_id AND task_boards.user_id = auth.uid())
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = board_shares.board_id AND task_boards.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Board owners can delete shares OR admins can delete all" ON board_shares;
CREATE POLICY "board_owners_delete_shares_or_admin_all" ON board_shares
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = board_shares.board_id AND task_boards.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- USER_WATCHLIST: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own watchlist OR admins can view all" ON user_watchlist;
CREATE POLICY "users_select_own_or_admin_all" ON user_watchlist
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can update their own watchlist OR admins can update all" ON user_watchlist;
CREATE POLICY "users_update_own_or_admin_all" ON user_watchlist
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can delete from their own watchlist OR admins can delete all" ON user_watchlist;
CREATE POLICY "users_delete_own_or_admin_all" ON user_watchlist
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- USER_WATCHED_ARCHIVE: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own archive OR admins can view all" ON user_watched_archive;
CREATE POLICY "users_select_own_or_admin_all" ON user_watched_archive
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can update own archive OR admins can update all" ON user_watched_archive;
CREATE POLICY "users_update_own_or_admin_all" ON user_watched_archive
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can delete from own archive OR admins can delete all" ON user_watched_archive;
CREATE POLICY "users_delete_own_or_admin_all" ON user_watched_archive
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- READING_LIST: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own reading list OR admins can view all" ON reading_list;
CREATE POLICY "users_select_own_or_admin_all" ON reading_list
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can update their own reading list OR admins can update all" ON reading_list;
CREATE POLICY "users_update_own_or_admin_all" ON reading_list
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can delete from their own reading list OR admins can delete all" ON reading_list;
CREATE POLICY "users_delete_own_or_admin_all" ON reading_list
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- GAME_LIBRARY: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own game library OR admins can view all" ON game_library;
CREATE POLICY "users_select_own_or_admin_all" ON game_library
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can update own game library items OR admins can update all" ON game_library;
CREATE POLICY "users_update_own_or_admin_all" ON game_library
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can delete own game library items OR admins can delete all" ON game_library;
CREATE POLICY "users_delete_own_or_admin_all" ON game_library
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- MUSIC_LIBRARY: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own music library OR admins can view all" ON music_library;
CREATE POLICY "users_select_own_or_admin_all" ON music_library
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can update own music library items OR admins can update all" ON music_library;
CREATE POLICY "users_update_own_or_admin_all" ON music_library
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can delete own music library items OR admins can delete all" ON music_library;
CREATE POLICY "users_delete_own_or_admin_all" ON music_library
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- MEDIA_REVIEWS: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own reviews OR admins can view all" ON media_reviews;
CREATE POLICY "users_select_reviews_or_admin_all" ON media_reviews
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = user_id OR
    (
      is_public = true AND
      EXISTS (
        SELECT 1 FROM connections c
        WHERE (c.user_id = auth.uid() AND c.friend_id = media_reviews.user_id)
           OR (c.friend_id = auth.uid() AND c.user_id = media_reviews.user_id)
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own reviews OR admins can update all" ON media_reviews;
CREATE POLICY "users_update_own_or_admin_all" ON media_reviews
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can delete their own reviews OR admins can delete all" ON media_reviews;
CREATE POLICY "users_delete_own_or_admin_all" ON media_reviews
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- MOVIE_RECOMMENDATIONS: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view movie recommendations OR admins can view all" ON movie_recommendations;
CREATE POLICY "users_select_recommendations_or_admin_all" ON movie_recommendations
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  );

DROP POLICY IF EXISTS "Recipients can update movie recommendations OR admins can update all" ON movie_recommendations;
DROP POLICY IF EXISTS "Senders can update movie notes OR admins can update all" ON movie_recommendations;
CREATE POLICY "users_update_recommendations_or_admin_all" ON movie_recommendations
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  );

DROP POLICY IF EXISTS "Senders can delete movie recommendations OR admins can delete all" ON movie_recommendations;
CREATE POLICY "senders_delete_or_admin_all" ON movie_recommendations
  FOR DELETE TO authenticated
  USING (
    auth.uid() = from_user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- BOOK_RECOMMENDATIONS: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view book recommendations OR admins can view all" ON book_recommendations;
CREATE POLICY "users_select_recommendations_or_admin_all" ON book_recommendations
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  );

DROP POLICY IF EXISTS "Book recipients can update recommendations OR admins can update all" ON book_recommendations;
DROP POLICY IF EXISTS "Book senders can update notes OR admins can update all" ON book_recommendations;
CREATE POLICY "users_update_recommendations_or_admin_all" ON book_recommendations
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  );

DROP POLICY IF EXISTS "Book senders can delete recommendations OR admins can delete all" ON book_recommendations;
CREATE POLICY "senders_delete_or_admin_all" ON book_recommendations
  FOR DELETE TO authenticated
  USING (
    auth.uid() = from_user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- GAME_RECOMMENDATIONS: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view game recommendations OR admins can view all" ON game_recommendations;
CREATE POLICY "users_select_recommendations_or_admin_all" ON game_recommendations
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  );

DROP POLICY IF EXISTS "Game recipients can update recommendations OR admins can update all" ON game_recommendations;
DROP POLICY IF EXISTS "Game senders can update notes OR admins can update all" ON game_recommendations;
CREATE POLICY "users_update_recommendations_or_admin_all" ON game_recommendations
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  );

DROP POLICY IF EXISTS "Game senders can delete recommendations OR admins can delete all" ON game_recommendations;
CREATE POLICY "senders_delete_or_admin_all" ON game_recommendations
  FOR DELETE TO authenticated
  USING (
    auth.uid() = from_user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- MUSIC_RECOMMENDATIONS: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view music recommendations OR admins can view all" ON music_recommendations;
CREATE POLICY "users_select_recommendations_or_admin_all" ON music_recommendations
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  );

DROP POLICY IF EXISTS "Recipients can update music recommendations OR admins can update all" ON music_recommendations;
DROP POLICY IF EXISTS "Senders can update music notes OR admins can update all" ON music_recommendations;
CREATE POLICY "users_update_recommendations_or_admin_all" ON music_recommendations
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id
  );

DROP POLICY IF EXISTS "Senders can delete music recommendations OR admins can delete all" ON music_recommendations;
CREATE POLICY "senders_delete_or_admin_all" ON music_recommendations
  FOR DELETE TO authenticated
  USING (
    auth.uid() = from_user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- -----------------------------------------------------------------------------
-- CONNECTIONS: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own connections OR admins can view all" ON connections;
CREATE POLICY "users_select_connections_or_admin_all" ON connections
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = user_id OR
    auth.uid() = friend_id
  );

DROP POLICY IF EXISTS "Users can update their own connections OR admins can update all" ON connections;
CREATE POLICY "users_update_connections_or_admin_all" ON connections
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = user_id OR
    auth.uid() = friend_id
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = user_id OR
    auth.uid() = friend_id
  );

DROP POLICY IF EXISTS "Users can delete their own connections OR admins can delete all" ON connections;
CREATE POLICY "users_delete_connections_or_admin_all" ON connections
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin') OR
    auth.uid() = user_id OR
    auth.uid() = friend_id
  );

-- -----------------------------------------------------------------------------
-- USER_PROFILES: Update to role-based checks
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can update own profile OR admins can update any" ON user_profiles;
CREATE POLICY "users_update_own_or_admin_all" ON user_profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

-- =============================================================================
-- PART 2: Fix security gaps - Add missing admin policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- APP_CONFIG: Restrict access to admins only (was open to all authenticated)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can read config" ON app_config;
DROP POLICY IF EXISTS "Only admins can modify config" ON app_config;

CREATE POLICY "admins_can_read_config" ON app_config
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "admins_can_modify_config" ON app_config
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "admins_can_update_config" ON app_config
  FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "admins_can_delete_config" ON app_config
  FOR DELETE TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- -----------------------------------------------------------------------------
-- INVITE_CODES: Update to allow admins to view all codes
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can validate invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Only admins can create invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Only admins can update invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Only admins can delete invite codes" ON invite_codes;

-- Allow public validation of active codes OR admin view of all
CREATE POLICY "public_validate_or_admins_view_all" ON invite_codes
  FOR SELECT TO authenticated
  USING (
    is_active = true 
    OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "admins_can_create_codes" ON invite_codes
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "admins_can_update_codes" ON invite_codes
  FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "admins_can_delete_codes" ON invite_codes
  FOR DELETE TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- -----------------------------------------------------------------------------
-- ADMIN_AUDIT_LOG: Add admin policies (only super admin can delete)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Only admins can view audit logs" ON admin_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON admin_audit_log;

CREATE POLICY "admins_can_view_audit_logs" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "admins_can_insert_audit_logs" ON admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Only super admin can delete audit logs (for cleanup/privacy)
CREATE POLICY "super_admins_can_delete_audit_logs" ON admin_audit_log
  FOR DELETE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'super_admin');

-- -----------------------------------------------------------------------------
-- RATE_LIMITS: Add admin policies
-- NOTE: The SELECT policy is intentionally not recreated here due to column name issue
-- It will be properly fixed in migration 20251207000008_fix_rate_limits_rls_identifier_column.sql
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own rate limits" ON rate_limits;

-- Admins can reset rate limits by deleting records
CREATE POLICY "admins_can_reset_rate_limits" ON rate_limits
  FOR DELETE TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- -----------------------------------------------------------------------------
-- INVITE_CODE_AUDIT_LOG: Verify admin-only access
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Only admins can view invite audit logs" ON invite_code_audit_log;
DROP POLICY IF EXISTS "System can insert invite audit logs" ON invite_code_audit_log;

CREATE POLICY "admins_can_view_invite_audit" ON invite_code_audit_log
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "admins_can_insert_invite_audit" ON invite_code_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- =============================================================================
-- PART 3: Add comments for documentation
-- =============================================================================

COMMENT ON POLICY "users_select_own_or_admin_all" ON task_boards IS 
  'Standard pattern: Users can view own data, admins can view all data';

COMMENT ON POLICY "admins_can_read_config" ON app_config IS 
  'Security fix: Only admins can read config (previously open to all authenticated users)';

COMMENT ON POLICY "public_validate_or_admins_view_all" ON invite_codes IS 
  'Allows public validation of active codes while admins can view all codes';

COMMENT ON POLICY "super_admins_can_delete_audit_logs" ON admin_audit_log IS 
  'Only super admin can delete audit logs to prevent tampering';
