-- Migration: Add Admin Override Policies
-- Purpose: Fix 403 errors by ensuring admin users have full access to all tables
-- Security: Uses is_admin() helper function for secure admin checks

-- =============================================================================
-- CLEANUP: Drop all old and new policies to ensure clean migration
-- This handles partial migration scenarios
-- =============================================================================

-- TASK_BOARDS
DROP POLICY IF EXISTS "Users can view their own boards" ON task_boards;
DROP POLICY IF EXISTS "Users can create their own boards" ON task_boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON task_boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON task_boards;
DROP POLICY IF EXISTS "Users can view their own boards OR admins can view all" ON task_boards;
DROP POLICY IF EXISTS "Users can update their own boards OR admins can update all" ON task_boards;
DROP POLICY IF EXISTS "Users can delete their own boards OR admins can delete all" ON task_boards;

-- TASK_BOARD_SECTIONS
DROP POLICY IF EXISTS "Users can view sections of their boards" ON task_board_sections;
DROP POLICY IF EXISTS "Users can create sections in their boards" ON task_board_sections;
DROP POLICY IF EXISTS "Users can update sections in their boards" ON task_board_sections;
DROP POLICY IF EXISTS "Users can delete sections from their boards" ON task_board_sections;
DROP POLICY IF EXISTS "Users can view sections of their boards OR admins can view all" ON task_board_sections;
DROP POLICY IF EXISTS "Users can update sections in their boards OR admins can update all" ON task_board_sections;
DROP POLICY IF EXISTS "Users can delete sections from their boards OR admins can delete all" ON task_board_sections;

-- TASKS
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their own tasks OR admins can view all" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks OR admins can update all" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks OR admins can delete all" ON tasks;

-- BOARD_SHARES
DROP POLICY IF EXISTS "Users can view board shares" ON board_shares;
DROP POLICY IF EXISTS "Board owners can create shares" ON board_shares;
DROP POLICY IF EXISTS "Board owners can update shares" ON board_shares;
DROP POLICY IF EXISTS "Board owners can delete shares" ON board_shares;
DROP POLICY IF EXISTS "Users can view board shares OR admins can view all" ON board_shares;
DROP POLICY IF EXISTS "Board owners can update shares OR admins can update all" ON board_shares;
DROP POLICY IF EXISTS "Board owners can delete shares OR admins can delete all" ON board_shares;

-- USER_WATCHLIST
DROP POLICY IF EXISTS "Users can view their own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can add to their own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can update their own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can delete from their own watchlist" ON user_watchlist;
DROP POLICY IF EXISTS "Users can view their own watchlist OR admins can view all" ON user_watchlist;
DROP POLICY IF EXISTS "Users can update their own watchlist OR admins can update all" ON user_watchlist;
DROP POLICY IF EXISTS "Users can delete from their own watchlist OR admins can delete all" ON user_watchlist;

-- USER_WATCHED_ARCHIVE
DROP POLICY IF EXISTS "Users can view own archive" ON user_watched_archive;
DROP POLICY IF EXISTS "Users can insert into own archive" ON user_watched_archive;
DROP POLICY IF EXISTS "Users can update own archive" ON user_watched_archive;
DROP POLICY IF EXISTS "Users can delete from own archive" ON user_watched_archive;
DROP POLICY IF EXISTS "Users can view own archive OR admins can view all" ON user_watched_archive;
DROP POLICY IF EXISTS "Users can update own archive OR admins can update all" ON user_watched_archive;
DROP POLICY IF EXISTS "Users can delete from own archive OR admins can delete all" ON user_watched_archive;

-- READING_LIST
DROP POLICY IF EXISTS "Users can view their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can add to their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can update their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can delete from their own reading list" ON reading_list;
DROP POLICY IF EXISTS "Users can view their own reading list OR admins can view all" ON reading_list;
DROP POLICY IF EXISTS "Users can update their own reading list OR admins can update all" ON reading_list;
DROP POLICY IF EXISTS "Users can delete from their own reading list OR admins can delete all" ON reading_list;

-- GAME_LIBRARY
DROP POLICY IF EXISTS "Users can view own game library" ON game_library;
DROP POLICY IF EXISTS "Users can insert own game library items" ON game_library;
DROP POLICY IF EXISTS "Users can update own game library items" ON game_library;
DROP POLICY IF EXISTS "Users can delete own game library items" ON game_library;
DROP POLICY IF EXISTS "Users can view own game library OR admins can view all" ON game_library;
DROP POLICY IF EXISTS "Users can update own game library items OR admins can update all" ON game_library;
DROP POLICY IF EXISTS "Users can delete own game library items OR admins can delete all" ON game_library;

-- MUSIC_LIBRARY
DROP POLICY IF EXISTS "Users can view own music library" ON music_library;
DROP POLICY IF EXISTS "Users can insert own music library items" ON music_library;
DROP POLICY IF EXISTS "Users can update own music library items" ON music_library;
DROP POLICY IF EXISTS "Users can delete own music library items" ON music_library;
DROP POLICY IF EXISTS "Users can view own music library OR admins can view all" ON music_library;
DROP POLICY IF EXISTS "Users can update own music library items OR admins can update all" ON music_library;
DROP POLICY IF EXISTS "Users can delete own music library items OR admins can delete all" ON music_library;

-- MEDIA_REVIEWS
DROP POLICY IF EXISTS "Users can view their own reviews" ON media_reviews;
DROP POLICY IF EXISTS "Users can view public reviews from friends" ON media_reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON media_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON media_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON media_reviews;
DROP POLICY IF EXISTS "Users can view their own reviews OR admins can view all" ON media_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews OR admins can update all" ON media_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews OR admins can delete all" ON media_reviews;

-- RECOMMENDATIONS (all types)
DROP POLICY IF EXISTS "Users can view recommendations sent to them" ON movie_recommendations;
DROP POLICY IF EXISTS "Users can view recommendations they sent" ON movie_recommendations;
DROP POLICY IF EXISTS "Users can send recommendations" ON movie_recommendations;
DROP POLICY IF EXISTS "Recipients can update their recommendations" ON movie_recommendations;
DROP POLICY IF EXISTS "Senders can update their notes" ON movie_recommendations;
DROP POLICY IF EXISTS "Senders can delete recommendations they sent" ON movie_recommendations;
DROP POLICY IF EXISTS "Users can view movie recommendations OR admins can view all" ON movie_recommendations;
DROP POLICY IF EXISTS "Users can send movie recommendations" ON movie_recommendations;
DROP POLICY IF EXISTS "Recipients can update movie recommendations OR admins can update all" ON movie_recommendations;
DROP POLICY IF EXISTS "Senders can update movie notes OR admins can update all" ON movie_recommendations;
DROP POLICY IF EXISTS "Senders can delete movie recommendations OR admins can delete all" ON movie_recommendations;

DROP POLICY IF EXISTS "Users can view book recommendations sent to them" ON book_recommendations;
DROP POLICY IF EXISTS "Users can view book recommendations they sent" ON book_recommendations;
DROP POLICY IF EXISTS "Users can send book recommendations" ON book_recommendations;
DROP POLICY IF EXISTS "Book recipients can update their recommendations" ON book_recommendations;
DROP POLICY IF EXISTS "Book senders can update their notes" ON book_recommendations;
DROP POLICY IF EXISTS "Book senders can delete recommendations they sent" ON book_recommendations;
DROP POLICY IF EXISTS "Users can view book recommendations OR admins can view all" ON book_recommendations;
DROP POLICY IF EXISTS "Users can send book recommendations" ON book_recommendations;
DROP POLICY IF EXISTS "Book recipients can update recommendations OR admins can update all" ON book_recommendations;
DROP POLICY IF EXISTS "Book senders can update notes OR admins can update all" ON book_recommendations;
DROP POLICY IF EXISTS "Book senders can delete recommendations OR admins can delete all" ON book_recommendations;

DROP POLICY IF EXISTS "Users can view game recommendations sent to them" ON game_recommendations;
DROP POLICY IF EXISTS "Users can view game recommendations they sent" ON game_recommendations;
DROP POLICY IF EXISTS "Users can send game recommendations" ON game_recommendations;
DROP POLICY IF EXISTS "Game recipients can update their recommendations" ON game_recommendations;
DROP POLICY IF EXISTS "Game senders can update their notes" ON game_recommendations;
DROP POLICY IF EXISTS "Game senders can delete recommendations they sent" ON game_recommendations;
DROP POLICY IF EXISTS "Users can view game recommendations OR admins can view all" ON game_recommendations;
DROP POLICY IF EXISTS "Users can send game recommendations" ON game_recommendations;
DROP POLICY IF EXISTS "Game recipients can update recommendations OR admins can update all" ON game_recommendations;
DROP POLICY IF EXISTS "Game senders can update notes OR admins can update all" ON game_recommendations;
DROP POLICY IF EXISTS "Game senders can delete recommendations OR admins can delete all" ON game_recommendations;

DROP POLICY IF EXISTS "Users can view recommendations sent to them" ON music_recommendations;
DROP POLICY IF EXISTS "Users can view recommendations they sent" ON music_recommendations;
DROP POLICY IF EXISTS "Users can send recommendations" ON music_recommendations;
DROP POLICY IF EXISTS "Recipients can update their recommendations" ON music_recommendations;
DROP POLICY IF EXISTS "Senders can update their notes" ON music_recommendations;
DROP POLICY IF EXISTS "Senders can delete recommendations they sent" ON music_recommendations;
DROP POLICY IF EXISTS "Users can view music recommendations OR admins can view all" ON music_recommendations;
DROP POLICY IF EXISTS "Users can send music recommendations" ON music_recommendations;
DROP POLICY IF EXISTS "Recipients can update music recommendations OR admins can update all" ON music_recommendations;
DROP POLICY IF EXISTS "Senders can update music notes OR admins can update all" ON music_recommendations;
DROP POLICY IF EXISTS "Senders can delete music recommendations OR admins can delete all" ON music_recommendations;

-- CONNECTIONS
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON connections;
DROP POLICY IF EXISTS "Users can view their own connections OR admins can view all" ON connections;
DROP POLICY IF EXISTS "Users can update their own connections OR admins can update all" ON connections;
DROP POLICY IF EXISTS "Users can delete their own connections OR admins can delete all" ON connections;

-- USER_PROFILES
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile OR admins can update any" ON user_profiles;

-- =============================================================================
-- ADMIN OVERRIDE POLICIES
-- All tables now include admin override logic so admins can access all rows
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TASK_BOARDS: Admin Override Policies
-- -----------------------------------------------------------------------------

-- Recreate with admin override
CREATE POLICY "Users can view their own boards OR admins can view all" ON task_boards
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own boards" ON task_boards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards OR admins can update all" ON task_boards
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own boards OR admins can delete all" ON task_boards
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- TASK_BOARD_SECTIONS: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view sections of their boards OR admins can view all" ON task_board_sections
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = task_board_sections.board_id AND task_boards.user_id = auth.uid())
  );

CREATE POLICY "Users can create sections in their boards" ON task_board_sections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = task_board_sections.board_id AND task_boards.user_id = auth.uid())
  );

CREATE POLICY "Users can update sections in their boards OR admins can update all" ON task_board_sections
  FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = task_board_sections.board_id AND task_boards.user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = task_board_sections.board_id AND task_boards.user_id = auth.uid())
  );

CREATE POLICY "Users can delete sections from their boards OR admins can delete all" ON task_board_sections
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid()) OR
    EXISTS (SELECT 1 FROM task_boards WHERE task_boards.id = task_board_sections.board_id AND task_boards.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- TASKS: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view their own tasks OR admins can view all" ON tasks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks OR admins can update all" ON tasks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own tasks OR admins can delete all" ON tasks
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- BOARD_SHARES: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view board shares OR admins can view all" ON board_shares
  FOR SELECT
  USING (
    public.is_admin(auth.uid()) OR
    shared_with_user_id = auth.uid() OR
    shared_by_user_id = auth.uid() OR
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid())
  );

CREATE POLICY "Board owners can create shares" ON board_shares
  FOR INSERT
  WITH CHECK (
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid())
  );

CREATE POLICY "Board owners can update shares OR admins can update all" ON board_shares
  FOR UPDATE
  USING (
    public.is_admin(auth.uid()) OR
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid())
  );

CREATE POLICY "Board owners can delete shares OR admins can delete all" ON board_shares
  FOR DELETE
  USING (
    public.is_admin(auth.uid()) OR
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- USER_WATCHLIST: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view their own watchlist OR admins can view all" ON user_watchlist
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can add to their own watchlist" ON user_watchlist
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist OR admins can update all" ON user_watchlist
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete from their own watchlist OR admins can delete all" ON user_watchlist
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- USER_WATCHED_ARCHIVE: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own archive OR admins can view all" ON user_watched_archive
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert into own archive" ON user_watched_archive
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own archive OR admins can update all" ON user_watched_archive
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete from own archive OR admins can delete all" ON user_watched_archive
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- READING_LIST: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view their own reading list OR admins can view all" ON reading_list
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can add to their own reading list" ON reading_list
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading list OR admins can update all" ON reading_list
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete from their own reading list OR admins can delete all" ON reading_list
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- GAME_LIBRARY: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own game library OR admins can view all" ON game_library
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own game library items" ON game_library
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game library items OR admins can update all" ON game_library
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own game library items OR admins can delete all" ON game_library
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- MUSIC_LIBRARY: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view own music library OR admins can view all" ON music_library
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own music library items" ON music_library
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own music library items OR admins can update all" ON music_library
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own music library items OR admins can delete all" ON music_library
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- MEDIA_REVIEWS: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view their own reviews OR admins can view all" ON media_reviews
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_admin(auth.uid()) OR
    (is_public = true AND EXISTS (
      SELECT 1 FROM connections 
      WHERE (user_id = auth.uid() AND friend_id = media_reviews.user_id) 
         OR (friend_id = auth.uid() AND user_id = media_reviews.user_id)
    ))
  );

CREATE POLICY "Users can insert their own reviews" ON media_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews OR admins can update all" ON media_reviews
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own reviews OR admins can delete all" ON media_reviews
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- MOVIE_RECOMMENDATIONS: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view movie recommendations OR admins can view all" ON movie_recommendations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Users can send movie recommendations" ON movie_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients can update movie recommendations OR admins can update all" ON movie_recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = to_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Senders can update movie notes OR admins can update all" ON movie_recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = from_user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = from_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Senders can delete movie recommendations OR admins can delete all" ON movie_recommendations
  FOR DELETE TO authenticated
  USING (auth.uid() = from_user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- BOOK_RECOMMENDATIONS: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view book recommendations OR admins can view all" ON book_recommendations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Users can send book recommendations" ON book_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Book recipients can update recommendations OR admins can update all" ON book_recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = to_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Book senders can update notes OR admins can update all" ON book_recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = from_user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = from_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Book senders can delete recommendations OR admins can delete all" ON book_recommendations
  FOR DELETE TO authenticated
  USING (auth.uid() = from_user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- GAME_RECOMMENDATIONS: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view game recommendations OR admins can view all" ON game_recommendations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Users can send game recommendations" ON game_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Game recipients can update recommendations OR admins can update all" ON game_recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = to_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Game senders can update notes OR admins can update all" ON game_recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = from_user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = from_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Game senders can delete recommendations OR admins can delete all" ON game_recommendations
  FOR DELETE TO authenticated
  USING (auth.uid() = from_user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- MUSIC_RECOMMENDATIONS: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view music recommendations OR admins can view all" ON music_recommendations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = to_user_id OR
    auth.uid() = from_user_id OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Users can send music recommendations" ON music_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients can update music recommendations OR admins can update all" ON music_recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = to_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Senders can update music notes OR admins can update all" ON music_recommendations
  FOR UPDATE TO authenticated
  USING (auth.uid() = from_user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = from_user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Senders can delete music recommendations OR admins can delete all" ON music_recommendations
  FOR DELETE TO authenticated
  USING (auth.uid() = from_user_id OR public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- CONNECTIONS: Admin Override Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can view their own connections OR admins can view all" ON connections
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() = friend_id OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Users can create connections" ON connections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can update their own connections OR admins can update all" ON connections
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() = friend_id OR
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() = friend_id OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Users can delete their own connections OR admins can delete all" ON connections
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() = friend_id OR
    public.is_admin(auth.uid())
  );

-- -----------------------------------------------------------------------------
-- USER_PROFILES: Admin Override Policy (already has "Anyone can view profiles")
-- Keep existing policies, just ensure admin can update
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can update own profile OR admins can update any" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Note: "Admins can update any profile" policy already exists for is_admin field changes
-- This policy handles all other profile updates

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON POLICY "Users can view their own boards OR admins can view all" ON task_boards IS 
  'Allows users to view boards they own, and admins to view all boards';

COMMENT ON POLICY "Users can view their own tasks OR admins can view all" ON tasks IS 
  'Allows users to view tasks they own, and admins to view all tasks';

COMMENT ON POLICY "Users can view their own watchlist OR admins can view all" ON user_watchlist IS 
  'Allows users to view their own watchlist, and admins to view all watchlists';

COMMENT ON POLICY "Users can view their own reading list OR admins can view all" ON reading_list IS 
  'Allows users to view their own reading list, and admins to view all reading lists';

COMMENT ON POLICY "Users can view own game library OR admins can view all" ON game_library IS 
  'Allows users to view their own game library, and admins to view all game libraries';

COMMENT ON POLICY "Users can view own music library OR admins can view all" ON music_library IS 
  'Allows users to view their own music library, and admins to view all music libraries';
