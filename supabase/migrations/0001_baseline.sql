--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--
-- Note: Skipping CREATE SCHEMA public - Supabase already provides this


--
-- Name: batch_connect_users(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.batch_connect_users(user_ids uuid[]) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: FUNCTION batch_connect_users(user_ids uuid[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.batch_connect_users(user_ids uuid[]) IS 'Admin-only function to manually connect a group of users (max 100).
   Can be run by:
   - postgres superuser in SQL editor
   - authenticated admin users via frontend
   
   Use for:
   - Small group/team connections
   - Testing with specific users
   - One-time migrations
   
   Example: SELECT batch_connect_users(ARRAY[''user1-id'', ''user2-id'', ''user3-id'']);
   Example: SELECT batch_connect_users(ARRAY(SELECT id FROM auth.users));';


--
-- Name: connect_new_user_to_everyone(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.connect_new_user_to_everyone() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
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


--
-- Name: FUNCTION connect_new_user_to_everyone(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.connect_new_user_to_everyone() IS 'DEPRECATED: Auto-connect trigger disabled for scalability.
   This function creates O(N) inserts per signup, causing poor performance at scale.
   
   Keep function for manual use in development/testing only.
   For production: implement selective connections, friend requests, or group-based connections.
   
   To manually connect a specific user to everyone (dev/testing only):
   SELECT connect_new_user_to_everyone() FROM auth.users WHERE id = ''user-id'';';


--
-- Name: consume_invite_code(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consume_invite_code(code_value text, user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'pg_temp'
    AS $$
DECLARE
    invite_record RECORD;
    code_exists BOOLEAN;
BEGIN
    -- Security guard: Verify user_id matches authenticated user
    IF user_id != auth.uid() THEN
        RAISE EXCEPTION 'User ID mismatch: cannot consume invite code for another user';
    END IF;
    
    -- Check if code exists and is valid
    SELECT EXISTS(
        SELECT 1 
        FROM public.invite_codes
        WHERE code = code_value
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND current_uses < max_uses
    ) INTO code_exists;
    
    IF NOT code_exists THEN
        RETURN false;
    END IF;
    
    -- Get the invite code record with row lock to prevent race conditions
    SELECT * INTO invite_record
    FROM public.invite_codes
    WHERE code = code_value
    FOR UPDATE;
    
    -- Update the code usage tracking
    UPDATE public.invite_codes
    SET 
        current_uses = current_uses + 1,
        used_by = CASE 
            WHEN current_uses = 0 THEN user_id 
            ELSE used_by 
        END,
        used_at = CASE 
            WHEN current_uses = 0 THEN NOW() 
            ELSE used_at 
        END
    WHERE code = code_value;
    
    -- Insert audit log entry to track all code usage
    -- (invite_code_audit_log table has: id, code_id, used_by, used_at)
    INSERT INTO public.invite_code_audit_log (code_id, used_by, used_at)
    VALUES (invite_record.id, user_id, NOW());
    
    RETURN true;
END;
$$;


--
-- Name: FUNCTION consume_invite_code(code_value text, user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.consume_invite_code(code_value text, user_id uuid) IS 'Consumes an invite code for user registration. 
Features:
- Validates user_id matches authenticated caller (security)
- Uses row-level locking to prevent race conditions
- Increments current_uses counter
- Sets used_by and used_at on first use
- Inserts audit log entry for all usages
- Returns true on success, false if code invalid/expired/maxed out';


--
-- Name: create_bidirectional_connection(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_bidirectional_connection(user_a uuid, user_b uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
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
$$;


--
-- Name: FUNCTION create_bidirectional_connection(user_a uuid, user_b uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_bidirectional_connection(user_a uuid, user_b uuid) IS 'Creates bidirectional connection between two users.
   Available for manual connections or future friend request features.
   
   Usage:
   - Manual connection: SELECT create_bidirectional_connection(user1_id, user2_id);
   - Friend requests: Call after both users accept
   - Group connections: Batch connect members of same group/org';


--
-- Name: generate_invite_code(integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invite_code(p_max_uses integer DEFAULT NULL::integer, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  new_code TEXT;
  characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  -- Generate 12 character code (XXX-XXX-XXX-XXX format)
  new_code := '';
  FOR i IN 1..12 LOOP
    IF i % 4 = 1 AND i > 1 THEN
      new_code := new_code || '-';
    END IF;
    new_code := new_code || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  
  INSERT INTO invite_codes (code, created_by, max_uses, expires_at)
  VALUES (new_code, auth.uid(), p_max_uses, p_expires_at);
  
  RETURN new_code;
END;
$$;


--
-- Name: get_friend_ids(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_friend_ids(target_user_id uuid) RETURNS TABLE(friend_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT c.friend_id
  FROM connections c
  WHERE c.user_id = target_user_id;
END;
$$;


--
-- Name: get_friends_ratings_for_movie(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_friends_ratings_for_movie(target_user_id uuid, target_external_id text) RETURNS TABLE(friend_id uuid, display_name text, rating integer, review text, watched_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uwa.user_id as friend_id,
    up.display_name,
    uwa.rating,
    uwa.review,
    uwa.watched_at
  FROM user_watched_archive uwa
  JOIN user_profiles up ON uwa.user_id = up.user_id
  WHERE uwa.external_id = target_external_id
    AND uwa.user_id IN (
      SELECT friend_id FROM connections WHERE user_id = target_user_id
    )
    AND uwa.rating IS NOT NULL
  ORDER BY uwa.watched_at DESC;
END;
$$;


--
-- Name: get_friends_with_names(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_friends_with_names(target_user_id uuid) RETURNS TABLE(friend_id uuid, display_name text, profile_picture_url text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.friend_id,
    up.display_name,
    up.profile_picture_url
  FROM connections c
  JOIN user_profiles up ON c.friend_id = up.user_id
  WHERE c.user_id = target_user_id
  ORDER BY up.display_name;
END;
$$;


--
-- Name: handle_media_review_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_media_review_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = now();
    -- Only mark as edited if it's not a brand new insert
    IF TG_OP = 'UPDATE' AND OLD.created_at < now() - interval '1 minute' THEN
        NEW.is_edited = true;
        NEW.edited_at = now();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.email
    ),
    NEW.email  -- Add email sync
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    display_name = COALESCE(user_profiles.display_name, EXCLUDED.display_name);
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION handle_new_user(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function (AFTER INSERT on auth.users) that creates user_profiles row.
   Sets display_name from metadata OR email, and syncs email field.
   Called by: on_auth_user_created trigger
   Coverage: INSERT operations on auth.users';


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(check_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_profiles.user_id = check_user_id 
    AND user_profiles.is_admin = true
  );
END;
$$;


--
-- Name: FUNCTION is_admin(check_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_admin(check_user_id uuid) IS 'Returns true if the specified user has admin privileges. SECURITY DEFINER with fixed search_path to prevent schema hijacking.';


--
-- Name: is_bootstrap_allowed(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_bootstrap_allowed() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'pg_temp'
    AS $$
BEGIN
  -- Allow if no users exist yet (initial bootstrap)
  RETURN NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1);
END;
$$;


--
-- Name: FUNCTION is_bootstrap_allowed(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_bootstrap_allowed() IS 'Returns true only when database has zero users, allowing bootstrap invite code creation.
Used by create-bootstrap-code.js script for initial admin setup.
Auto-returns false after first user signup (security).';


--
-- Name: prevent_admin_escalation_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_admin_escalation_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- If is_admin field is being changed
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    -- Only allow change if current user is an admin
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Permission denied: Only admins can modify admin status'
        USING HINT = 'Contact an administrator to change your privileges.',
              ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION prevent_admin_escalation_update(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_admin_escalation_update() IS 'Trigger function that blocks is_admin changes unless caller is already admin. SECURITY DEFINER with fixed search_path.';


--
-- Name: prevent_admin_self_grant(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_admin_self_grant() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- If user is creating their own profile
  IF NEW.user_id = auth.uid() THEN
    -- Force is_admin to false unless they're already an admin
    -- (edge case: admin creating a new profile for themselves)
    IF NOT public.is_admin(auth.uid()) THEN
      NEW.is_admin := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION prevent_admin_self_grant(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_admin_self_grant() IS 'Trigger function that prevents users from granting themselves admin during profile creation. SECURITY DEFINER with fixed search_path.';


--
-- Name: prevent_is_admin_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_is_admin_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth', 'pg_temp'
    AS $$
BEGIN
  -- If is_admin is being changed
  IF OLD.is_admin != NEW.is_admin THEN
    -- Allow change if current role is postgres (superuser in dashboard)
    IF current_user = 'postgres' THEN
      RETURN NEW;
    END IF;
    
    -- Check if the current user is an admin
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    ) THEN
      RAISE EXCEPTION 'Only administrators can change admin status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: prevent_super_admin_revoke(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_super_admin_revoke() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
    super_admin_id UUID;
BEGIN
    -- Get the super admin ID
    super_admin_id := 'adfa92d6-532b-47be-9101-bbfced9f73b4'::UUID;
    
    -- Only check if this is the super admin AND the is_admin field is being changed
    -- Using IS DISTINCT FROM to properly handle NULL cases
    IF NEW.user_id = super_admin_id AND (OLD.is_admin IS DISTINCT FROM NEW.is_admin) THEN
        -- If someone tries to revoke admin privileges from super admin
        IF NEW.is_admin = false AND OLD.is_admin = true THEN
            RAISE EXCEPTION 'Cannot revoke admin privileges from the super admin account'
                USING HINT = 'This account is permanently protected. Contact database administrator if you need to make changes.';
        END IF;
        
        -- Force is_admin to always be true for super admin
        NEW.is_admin := true;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION prevent_super_admin_revoke(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.prevent_super_admin_revoke() IS 'Prevents the super admin account (adfa92d6-532b-47be-9101-bbfced9f73b4) from having admin privileges revoked. Updated to only check when is_admin field is actually being modified, allowing other profile updates.';


--
-- Name: sync_user_email_on_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_user_email_on_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Update user_profiles when auth.users email changes
  UPDATE public.user_profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION sync_user_email_on_update(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sync_user_email_on_update() IS 'Trigger function (AFTER UPDATE OF email on auth.users) that syncs email changes.
   Updates user_profiles.email when auth.users.email changes.
   Called by: on_auth_user_email_updated trigger
   Coverage: UPDATE operations on auth.users (email column only)';


--
-- Name: trigger_connect_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_connect_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  PERFORM connect_new_user_to_everyone(NEW.user_id);
  RETURN NEW;
END;
$$;


--
-- Name: update_book_rec_read_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_book_rec_read_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('read', 'hit', 'miss') THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_game_library_played_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_game_library_played_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF NEW.played = true AND OLD.played = false AND NEW.played_at IS NULL THEN
    NEW.played_at = NOW();
  END IF;
  
  IF NEW.played = false AND OLD.played = true THEN
    NEW.played_at = NULL;
  END IF;
  
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;


--
-- Name: update_game_recommendation_played_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_game_recommendation_played_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF NEW.status IN ('played', 'hit', 'miss') 
     AND OLD.status = 'pending' 
     AND NEW.played_at IS NULL THEN
    NEW.played_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_movie_rec_watched_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_movie_rec_watched_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- If status is being changed from 'pending' to watched/hit/miss, set watched_at
  IF OLD.status = 'pending' AND NEW.status IN ('watched', 'hit', 'miss') THEN
    NEW.watched_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_music_library_listened_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_music_library_listened_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF NEW.listened = true AND OLD.listened = false AND NEW.listened_at IS NULL THEN
    NEW.listened_at = NOW();
  END IF;
  
  IF NEW.listened = false AND OLD.listened = true THEN
    NEW.listened_at = NULL;
  END IF;
  
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;


--
-- Name: update_music_rec_consumed_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_music_rec_consumed_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- If status is being changed from 'pending' to consumed/hit/miss, set consumed_at
  IF OLD.status = 'pending' AND NEW.status IN ('consumed', 'hit', 'miss') THEN
    NEW.consumed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_reading_list_timestamps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_reading_list_timestamps() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.read = true AND OLD.read = false THEN
      NEW.read_at = NOW();
    END IF;
    
    IF NEW.read = false AND OLD.read = true THEN
      NEW.read_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_task_boards_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_task_boards_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_tasks_timestamps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_tasks_timestamps() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  
  IF TG_OP = 'UPDATE' THEN
    -- Set completed_at when status changes to done
    IF NEW.status = 'done' AND OLD.status != 'done' THEN
      NEW.completed_at = NOW();
    END IF;
    
    -- Clear completed_at when status changes from done (but NOT to archived)
    IF NEW.status != 'done' AND NEW.status != 'archived' AND OLD.status = 'done' THEN
      NEW.completed_at = NULL;
    END IF;
    
    -- Set archived_at when status changes to archived
    IF NEW.status = 'archived' AND OLD.status != 'archived' THEN
      NEW.archived_at = NOW();
      -- If task was completed, preserve completed_at
      IF OLD.status = 'done' AND OLD.completed_at IS NOT NULL THEN
        NEW.completed_at = OLD.completed_at;
      ELSIF OLD.completed_at IS NULL THEN
        -- If archiving without completing, set completed_at to now
        NEW.completed_at = NOW();
      END IF;
    END IF;
    
    -- Clear archived_at when status changes from archived
    IF NEW.status != 'archived' AND OLD.status = 'archived' THEN
      NEW.archived_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_profiles_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_profiles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_watchlist_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_watchlist_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Only update watched_at if this is an UPDATE operation (not INSERT)
  IF TG_OP = 'UPDATE' THEN
    -- Set watched_at when watched status changes to true
    IF NEW.watched = true AND OLD.watched = false THEN
      NEW.watched_at = NOW();
    END IF;
    
    -- Clear watched_at when watched status changes to false
    IF NEW.watched = false AND OLD.watched = true THEN
      NEW.watched_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: validate_invite_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_invite_code(code_value text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Find the invite code
    SELECT * INTO invite_record
    FROM public.invite_codes
    WHERE code = code_value
    AND is_active = true;
    
    -- Code doesn't exist or is inactive
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if code has reached max uses
    IF invite_record.current_uses >= invite_record.max_uses THEN
        RETURN false;
    END IF;
    
    -- Check if code has expired
    IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < NOW() THEN
        RETURN false;
    END IF;
    
    -- Code is valid
    RETURN true;
END;
$$;


--
-- Name: FUNCTION validate_invite_code(code_value text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_invite_code(code_value text) IS 'Validates an invite code without consuming it. Returns true if code is valid and available.';


--
-- Name: validate_invite_code(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_invite_code(code_value text, user_email text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
    code_record RECORD;
BEGIN
    SELECT * INTO code_record
    FROM public.invite_codes
    WHERE code = code_value;

    -- Code doesn't exist
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Code is not active
    IF NOT code_record.is_active THEN
        RETURN false;
    END IF;

    -- Code has expired
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
        RETURN false;
    END IF;

    -- Code has reached max uses
    IF code_record.current_uses >= code_record.max_uses THEN
        RETURN false;
    END IF;

    -- SECURITY FIX: If code has an intended email, email validation is REQUIRED
    -- This prevents bypass by omitting the email parameter
    IF code_record.intended_email IS NOT NULL THEN
        -- Email must be provided
        IF user_email IS NULL THEN
            RETURN false;
        END IF;
        
        -- Email must match (case-insensitive)
        IF LOWER(code_record.intended_email) != LOWER(user_email) THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$;


--
-- Name: FUNCTION validate_invite_code(code_value text, user_email text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.validate_invite_code(code_value text, user_email text) IS 'Validates an invite code with strict email checking.
If the code has an intended_email:
  - user_email MUST be provided (cannot be null)
  - user_email MUST match intended_email (case-insensitive)
Otherwise validation fails, preventing bypass attacks.';


--
-- Name: verify_data_integrity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_data_integrity() RETURNS TABLE(table_name text, invalid_count bigint, message text)
    LANGUAGE plpgsql
    SET search_path TO 'public', 'auth', 'pg_temp'
    AS $$
BEGIN
  -- Check user_profiles
  RETURN QUERY
  SELECT 
    'user_profiles'::TEXT,
    COUNT(*)::BIGINT,
    'Orphaned profiles (user deleted from auth.users)'::TEXT
  FROM user_profiles up
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = up.user_id);
  
  -- Check connections
  RETURN QUERY
  SELECT 
    'connections'::TEXT,
    COUNT(*)::BIGINT,
    'Connections with invalid user_id'::TEXT
  FROM connections c
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = c.user_id);
  
  RETURN QUERY
  SELECT 
    'connections'::TEXT,
    COUNT(*)::BIGINT,
    'Connections with invalid friend_id'::TEXT
  FROM connections c
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = c.friend_id);
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_config (
    key text NOT NULL,
    value text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: board_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_shares (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    board_id uuid NOT NULL,
    shared_by_user_id uuid NOT NULL,
    shared_with_user_id uuid NOT NULL,
    can_edit boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT no_self_share CHECK ((shared_by_user_id <> shared_with_user_id))
);


--
-- Name: TABLE board_shares; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.board_shares IS 'Manages user-specific board sharing with permission levels';


--
-- Name: COLUMN board_shares.can_edit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.board_shares.can_edit IS 'Permission level: true allows editing, false is view-only';


--
-- Name: book_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    external_id text NOT NULL,
    title text NOT NULL,
    authors text,
    thumbnail_url text,
    published_date text,
    description text,
    isbn text,
    page_count integer,
    recommendation_type text DEFAULT 'read'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    sent_message text,
    sender_note text,
    recipient_note text,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    opened_at timestamp with time zone,
    CONSTRAINT book_recommendations_check CHECK ((from_user_id <> to_user_id)),
    CONSTRAINT book_recommendations_recommendation_type_check CHECK ((recommendation_type = ANY (ARRAY['read'::text, 'reread'::text]))),
    CONSTRAINT book_recommendations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'read'::text, 'hit'::text, 'miss'::text])))
);


--
-- Name: TABLE book_recommendations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.book_recommendations IS 'Book recommendations between users';


--
-- Name: COLUMN book_recommendations.external_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.book_recommendations.external_id IS 'Google Books Volume ID';


--
-- Name: COLUMN book_recommendations.authors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.book_recommendations.authors IS 'Comma-separated list of author names (plural to match Google Books API)';


--
-- Name: COLUMN book_recommendations.recommendation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.book_recommendations.recommendation_type IS 'Whether suggesting to read or reread';


--
-- Name: COLUMN book_recommendations.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.book_recommendations.status IS 'Recipient status: pending, read, hit (loved it), or miss (did not enjoy)';


--
-- Name: COLUMN book_recommendations.sent_message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.book_recommendations.sent_message IS 'Optional message from sender when recommending';


--
-- Name: COLUMN book_recommendations.sender_note; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.book_recommendations.sender_note IS 'Private note for sender only';


--
-- Name: COLUMN book_recommendations.recipient_note; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.book_recommendations.recipient_note IS 'Recipient notes/review after reading';


--
-- Name: COLUMN book_recommendations.read_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.book_recommendations.read_at IS 'Timestamp when recipient marked as read/hit/miss';


--
-- Name: COLUMN book_recommendations.opened_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.book_recommendations.opened_at IS 'Timestamp when recipient first opened the recommendation';


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    user_id uuid NOT NULL,
    display_name text,
    theme_color text DEFAULT '#9333ea'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_admin boolean DEFAULT false NOT NULL,
    bio text,
    profile_picture_url text,
    visible_cards text[],
    email text,
    CONSTRAINT user_profiles_theme_color_check CHECK (((theme_color ~ '^#[0-9A-Fa-f]{6}$'::text) OR (theme_color IS NULL)))
);

ALTER TABLE ONLY public.user_profiles FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE user_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_profiles IS 'User profiles with role-based access control. 
   
   RLS CONFIGURATION:
   - FORCE RLS enforced at ALL privilege levels (including table owner)
   - Client connections use authenticated role (via JWT from VITE_SUPABASE_ANON_KEY)
   - postgres role limited to: SECURITY DEFINER functions, admin dashboard, migrations
   - See __is_admin_helper_policy__ for details on postgres role access boundaries
   
   SECURITY LAYERS:
   1. RLS policies control WHO can access rows (role-based)
   2. Triggers control WHAT values can be changed (prevent privilege escalation)
   3. SECURITY DEFINER functions have fixed search_path (prevent schema hijacking)
   4. Client never has postgres credentials (connection string not exposed)';


--
-- Name: COLUMN user_profiles.theme_color; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.theme_color IS 'User theme accent color as a hex code (#RRGGBB). This color is applied to buttons, links, and accents throughout the application. Users can customize this via the color picker in Settings.';


--
-- Name: COLUMN user_profiles.is_admin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.is_admin IS 'Indicates whether the user has admin privileges (access to admin panel, invite code management, etc.)';


--
-- Name: COLUMN user_profiles.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_profiles.email IS 'User email synced from auth.users.email.
   Sync behavior:
   - INSERT: Set by handle_new_user() trigger (on_auth_user_created)
   - UPDATE: Synced by sync_user_email_on_update() trigger (on_auth_user_email_updated)
   - Can be NULL if auth.users.email is NULL (e.g., OAuth without email)
   
   Future: Consider NOT NULL constraint if app requires email for all users.';


--
-- Name: book_recommendations_with_users; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.book_recommendations_with_users WITH (security_barrier='true') AS
 SELECT br.id,
    br.from_user_id,
    br.to_user_id,
    br.external_id,
    br.title,
    br.authors,
    br.thumbnail_url,
    br.published_date,
    br.description,
    br.isbn,
    br.page_count,
    br.recommendation_type,
    br.status,
    br.sent_message,
    br.sender_note,
    br.recipient_note,
    br.created_at,
    br.read_at,
    br.opened_at,
    from_profile.display_name AS sender_name,
    to_profile.display_name AS recipient_name
   FROM ((public.book_recommendations br
     LEFT JOIN public.user_profiles from_profile ON ((br.from_user_id = from_profile.user_id)))
     LEFT JOIN public.user_profiles to_profile ON ((br.to_user_id = to_profile.user_id)));


--
-- Name: connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    friend_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT connections_check CHECK ((user_id <> friend_id))
);


--
-- Name: game_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    external_id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    released text,
    background_image text,
    platforms text,
    genres text,
    rating numeric(3,2),
    metacritic integer,
    playtime integer,
    played boolean DEFAULT false,
    personal_rating integer,
    personal_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    played_at timestamp with time zone,
    description_raw text,
    CONSTRAINT game_library_personal_rating_check CHECK (((personal_rating >= 1) AND (personal_rating <= 5)))
);


--
-- Name: TABLE game_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.game_library IS 'Personal game library for tracking games to play and completed games';


--
-- Name: COLUMN game_library.external_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_library.external_id IS 'RAWG API game ID';


--
-- Name: COLUMN game_library.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_library.slug IS 'URL-friendly game identifier from RAWG';


--
-- Name: COLUMN game_library.platforms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_library.platforms IS 'Comma-separated list of platform names';


--
-- Name: COLUMN game_library.genres; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_library.genres IS 'Comma-separated list of genre names';


--
-- Name: COLUMN game_library.rating; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_library.rating IS 'RAWG community rating (0.00-5.00)';


--
-- Name: COLUMN game_library.metacritic; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_library.metacritic IS 'Metacritic score (0-100)';


--
-- Name: COLUMN game_library.playtime; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_library.playtime IS 'Average playtime in hours';


--
-- Name: COLUMN game_library.played; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_library.played IS 'False = playing/backlog, True = played/completed';


--
-- Name: COLUMN game_library.description_raw; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_library.description_raw IS 'Raw game description from RAWG API (may contain HTML)';


--
-- Name: game_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    external_id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    released text,
    background_image text,
    platforms text,
    genres text,
    rating numeric(3,2),
    metacritic integer,
    playtime integer,
    recommendation_type text DEFAULT 'play'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    sent_message text,
    sender_note text,
    recipient_note text,
    created_at timestamp with time zone DEFAULT now(),
    played_at timestamp with time zone,
    opened_at timestamp with time zone,
    CONSTRAINT game_recommendations_check CHECK ((from_user_id <> to_user_id)),
    CONSTRAINT game_recommendations_recommendation_type_check CHECK ((recommendation_type = ANY (ARRAY['play'::text, 'replay'::text]))),
    CONSTRAINT game_recommendations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'played'::text, 'hit'::text, 'miss'::text])))
);


--
-- Name: TABLE game_recommendations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.game_recommendations IS 'Game recommendations between users with tracking of play status and ratings';


--
-- Name: COLUMN game_recommendations.external_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_recommendations.external_id IS 'RAWG API game ID';


--
-- Name: COLUMN game_recommendations.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_recommendations.slug IS 'URL-friendly game identifier from RAWG';


--
-- Name: COLUMN game_recommendations.platforms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_recommendations.platforms IS 'Comma-separated list of platform names';


--
-- Name: COLUMN game_recommendations.genres; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_recommendations.genres IS 'Comma-separated list of genre names';


--
-- Name: COLUMN game_recommendations.rating; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_recommendations.rating IS 'RAWG community rating (0.00-5.00)';


--
-- Name: COLUMN game_recommendations.metacritic; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_recommendations.metacritic IS 'Metacritic score (0-100)';


--
-- Name: COLUMN game_recommendations.playtime; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_recommendations.playtime IS 'Average playtime in hours';


--
-- Name: COLUMN game_recommendations.recommendation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_recommendations.recommendation_type IS 'Type: play (first time) or replay (play again)';


--
-- Name: COLUMN game_recommendations.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_recommendations.status IS 'Tracking status: pending, played, hit (loved it), miss (did not like)';


--
-- Name: game_recommendations_with_users; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.game_recommendations_with_users WITH (security_barrier='true') AS
 SELECT gr.id,
    gr.from_user_id,
    gr.to_user_id,
    gr.external_id,
    gr.slug,
    gr.name,
    gr.released,
    gr.background_image,
    gr.platforms,
    gr.genres,
    gr.rating,
    gr.metacritic,
    gr.playtime,
    gr.recommendation_type,
    gr.status,
    gr.sent_message,
    gr.sender_note,
    gr.recipient_note,
    gr.created_at,
    gr.played_at,
    gr.opened_at,
    from_profile.display_name AS sender_name,
    to_profile.display_name AS recipient_name
   FROM ((public.game_recommendations gr
     LEFT JOIN public.user_profiles from_profile ON ((gr.from_user_id = from_profile.user_id)))
     LEFT JOIN public.user_profiles to_profile ON ((gr.to_user_id = to_profile.user_id)));


--
-- Name: VIEW game_recommendations_with_users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.game_recommendations_with_users IS 'Game recommendations with sender and recipient display names for easier querying';


--
-- Name: index_usage; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.index_usage AS
 SELECT schemaname,
    relname AS tablename,
    indexrelname AS indexname,
    idx_scan AS times_used,
    pg_size_pretty(pg_relation_size((indexrelid)::regclass)) AS index_size
   FROM pg_stat_user_indexes i
  WHERE (schemaname = 'public'::name)
  ORDER BY idx_scan DESC;


--
-- Name: invite_code_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invite_code_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code_id uuid,
    used_by uuid,
    used_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE invite_code_audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.invite_code_audit_log IS 'Audit log tracking all invite code usage.
   
   RLS Policies:
   - SELECT: Admin-only (via is_admin check)
   - INSERT: System-wide (WITH CHECK true) for trigger functions
   - UPDATE: Admin-only (for corrections/cleanup)
   - DELETE: Admin-only (for cleanup/GDPR/testing)
   
   Security Model:
   - Regular users cannot view audit logs
   - Only SECURITY DEFINER functions can insert (via triggers)
   - Admins have full access for management
   - Designed for immutability (updates/deletes should be rare)';


--
-- Name: invite_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invite_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    created_by uuid,
    used_by uuid,
    is_active boolean DEFAULT true NOT NULL,
    max_uses integer DEFAULT 1 NOT NULL,
    current_uses integer DEFAULT 0 NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    used_at timestamp with time zone,
    notes text,
    intended_email text,
    CONSTRAINT used_at_requires_used_by CHECK (((used_at IS NULL) OR (used_by IS NOT NULL))),
    CONSTRAINT valid_current_uses CHECK (((current_uses >= 0) AND (current_uses <= max_uses))),
    CONSTRAINT valid_max_uses CHECK ((max_uses > 0))
);


--
-- Name: TABLE invite_codes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.invite_codes IS 'Manages invite codes for secure user registration. Supports single-use and multi-use codes with expiration dates.';


--
-- Name: media_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    external_id text NOT NULL,
    media_type text NOT NULL,
    title text NOT NULL,
    rating integer,
    review_text text,
    is_public boolean DEFAULT true NOT NULL,
    watched_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_edited boolean DEFAULT false NOT NULL,
    edited_at timestamp with time zone,
    CONSTRAINT media_reviews_media_type_check CHECK ((media_type = ANY (ARRAY['movie'::text, 'tv'::text, 'song'::text, 'album'::text, 'playlist'::text, 'game'::text, 'book'::text]))),
    CONSTRAINT media_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: TABLE media_reviews; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.media_reviews IS 'User reviews for all media types (movies, TV, music, games, books) with 1-5 star ratings, markdown-enabled comments, and public/private visibility';


--
-- Name: COLUMN media_reviews.rating; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.media_reviews.rating IS '1-5 star rating (optional)';


--
-- Name: COLUMN media_reviews.review_text; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.media_reviews.review_text IS 'User review text with markdown support';


--
-- Name: COLUMN media_reviews.is_public; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.media_reviews.is_public IS 'Whether friends can see this review';


--
-- Name: COLUMN media_reviews.is_edited; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.media_reviews.is_edited IS 'Tracks if review has been edited after creation';


--
-- Name: movie_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movie_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    external_id text NOT NULL,
    media_type text NOT NULL,
    title text NOT NULL,
    release_date text,
    overview text,
    poster_url text,
    year integer,
    recommendation_type text DEFAULT 'watch'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    sent_message text,
    sender_note text,
    recipient_note text,
    created_at timestamp with time zone DEFAULT now(),
    watched_at timestamp with time zone,
    opened_at timestamp with time zone,
    CONSTRAINT movie_recommendations_check CHECK ((from_user_id <> to_user_id)),
    CONSTRAINT movie_recommendations_media_type_check CHECK ((media_type = ANY (ARRAY['movie'::text, 'tv'::text]))),
    CONSTRAINT movie_recommendations_recommendation_type_check CHECK ((recommendation_type = ANY (ARRAY['watch'::text, 'rewatch'::text]))),
    CONSTRAINT movie_recommendations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'watched'::text, 'hit'::text, 'miss'::text])))
);


--
-- Name: movie_recommendations_with_users; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.movie_recommendations_with_users WITH (security_barrier='true') AS
 SELECT mr.id,
    mr.from_user_id,
    mr.to_user_id,
    mr.external_id,
    mr.media_type,
    mr.title,
    mr.release_date,
    mr.overview,
    mr.poster_url,
    mr.year,
    mr.recommendation_type,
    mr.status,
    mr.sent_message,
    mr.sender_note,
    mr.recipient_note,
    mr.created_at,
    mr.watched_at,
    mr.opened_at,
    from_profile.display_name AS sender_name,
    to_profile.display_name AS recipient_name
   FROM ((public.movie_recommendations mr
     LEFT JOIN public.user_profiles from_profile ON ((mr.from_user_id = from_profile.user_id)))
     LEFT JOIN public.user_profiles to_profile ON ((mr.to_user_id = to_profile.user_id)));


--
-- Name: music_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.music_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    external_id text NOT NULL,
    title text NOT NULL,
    artist text NOT NULL,
    album text,
    media_type text NOT NULL,
    release_date text,
    album_cover_url text,
    preview_url text,
    listened boolean DEFAULT false,
    personal_rating integer,
    personal_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    listened_at timestamp with time zone,
    genre text,
    track_duration integer,
    track_count integer,
    CONSTRAINT music_library_media_type_check CHECK ((media_type = ANY (ARRAY['song'::text, 'album'::text, 'playlist'::text]))),
    CONSTRAINT music_library_personal_rating_check CHECK (((personal_rating >= 1) AND (personal_rating <= 5)))
);


--
-- Name: TABLE music_library; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.music_library IS 'Personal music library for tracking songs and albums';


--
-- Name: COLUMN music_library.media_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.music_library.media_type IS 'Type of media: song, album, or playlist';


--
-- Name: COLUMN music_library.release_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.music_library.release_date IS 'Release date in text format (YYYY-MM-DD or YYYY) to match music_recommendations';


--
-- Name: COLUMN music_library.listened; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.music_library.listened IS 'False = listening/queue, True = listened/completed';


--
-- Name: COLUMN music_library.genre; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.music_library.genre IS 'Music genre from iTunes API';


--
-- Name: COLUMN music_library.track_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.music_library.track_duration IS 'Track duration in milliseconds (for songs)';


--
-- Name: COLUMN music_library.track_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.music_library.track_count IS 'Number of tracks (for albums)';


--
-- Name: music_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.music_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    external_id text NOT NULL,
    media_type text NOT NULL,
    title text NOT NULL,
    artist text,
    album text,
    release_date text,
    poster_url text,
    preview_url text,
    recommendation_type text DEFAULT 'listen'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    sent_message text,
    sender_note text,
    recipient_note text,
    created_at timestamp with time zone DEFAULT now(),
    consumed_at timestamp with time zone,
    opened_at timestamp with time zone,
    CONSTRAINT music_recommendations_check CHECK ((from_user_id <> to_user_id)),
    CONSTRAINT music_recommendations_media_type_check CHECK ((media_type = ANY (ARRAY['song'::text, 'album'::text, 'playlist'::text]))),
    CONSTRAINT music_recommendations_recommendation_type_check CHECK ((recommendation_type = ANY (ARRAY['listen'::text, 'watch'::text, 'study'::text]))),
    CONSTRAINT music_recommendations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'consumed'::text, 'hit'::text, 'miss'::text])))
);


--
-- Name: music_recommendations_with_users; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.music_recommendations_with_users AS
 SELECT mr.id,
    mr.from_user_id,
    mr.to_user_id,
    mr.external_id,
    mr.media_type,
    mr.title,
    mr.artist,
    mr.album,
    mr.release_date,
    mr.poster_url,
    mr.preview_url,
    mr.recommendation_type,
    mr.status,
    mr.sent_message,
    mr.sender_note,
    mr.recipient_note,
    mr.created_at,
    mr.consumed_at,
    mr.opened_at,
    from_profile.display_name AS sender_name,
    to_profile.display_name AS recipient_name
   FROM ((public.music_recommendations mr
     LEFT JOIN public.user_profiles from_profile ON ((mr.from_user_id = from_profile.user_id)))
     LEFT JOIN public.user_profiles to_profile ON ((mr.to_user_id = to_profile.user_id)));


--
-- Name: reading_list; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reading_list (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    external_id text NOT NULL,
    title text NOT NULL,
    authors text,
    thumbnail_url text,
    published_date text,
    description text,
    isbn text,
    page_count integer,
    read boolean DEFAULT false,
    personal_rating integer,
    personal_notes text,
    added_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    categories text,
    CONSTRAINT reading_list_personal_rating_check CHECK (((personal_rating >= 1) AND (personal_rating <= 5)))
);


--
-- Name: TABLE reading_list; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.reading_list IS 'Personal reading list for books users want to read or have read';


--
-- Name: COLUMN reading_list.external_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reading_list.external_id IS 'Google Books Volume ID';


--
-- Name: COLUMN reading_list.authors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reading_list.authors IS 'Comma-separated author names (plural to match Google Books API)';


--
-- Name: COLUMN reading_list.categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.reading_list.categories IS 'Comma-separated list of book categories/genres from Google Books API';


--
-- Name: task_board_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_board_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    board_id uuid NOT NULL,
    name text NOT NULL,
    field_type text DEFAULT 'text'::text,
    display_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT task_board_sections_field_type_check CHECK ((field_type = ANY (ARRAY['text'::text, 'number'::text, 'date'::text, 'url'::text, 'select'::text, 'multiline'::text])))
);


--
-- Name: TABLE task_board_sections; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.task_board_sections IS 'Sections within a board (e.g., To Do, In Progress, Done)';


--
-- Name: COLUMN task_board_sections.field_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_board_sections.field_type IS 'Type of field for List-style boards: text, number, date, url, etc. Used to provide appropriate input controls and validation.';


--
-- Name: task_boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_boards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    is_public boolean DEFAULT false NOT NULL,
    board_type text,
    template_type text DEFAULT 'kanban'::text,
    column_config jsonb,
    field_config jsonb,
    display_order integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT task_boards_name_check CHECK ((length(name) > 0)),
    CONSTRAINT task_boards_template_type_check CHECK ((template_type = ANY (ARRAY['job_tracker'::text, 'markdown'::text, 'recipe'::text, 'kanban'::text, 'grocery'::text, 'custom'::text])))
);


--
-- Name: TABLE task_boards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.task_boards IS 'User-created task boards for organizing tasks (e.g., Job Search, Daily Tasks, Recipes)';


--
-- Name: COLUMN task_boards.template_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_boards.template_type IS 'Type of board template: job_tracker, markdown, recipe, kanban, grocery, or custom';


--
-- Name: COLUMN task_boards.column_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_boards.column_config IS 'Flexible configuration for board columns/fields. For Grid boards: stores column names and max count. For List boards: stores field definitions (name, type, required, etc.)';


--
-- Name: COLUMN task_boards.field_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.task_boards.field_config IS 'JSON configuration of custom fields for this board template';


--
-- Name: task_boards_with_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.task_boards_with_stats AS
SELECT
    NULL::uuid AS id,
    NULL::uuid AS user_id,
    NULL::text AS name,
    NULL::text AS description,
    NULL::text AS icon,
    NULL::text AS color,
    NULL::boolean AS is_public,
    NULL::text AS board_type,
    NULL::text AS template_type,
    NULL::jsonb AS column_config,
    NULL::jsonb AS field_config,
    NULL::integer AS display_order,
    NULL::timestamp with time zone AS created_at,
    NULL::timestamp with time zone AS updated_at,
    NULL::bigint AS total_tasks,
    NULL::bigint AS completed_tasks,
    NULL::bigint AS pending_tasks,
    NULL::bigint AS overdue_tasks;


--
-- Name: VIEW task_boards_with_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.task_boards_with_stats IS 'Board view with aggregated task statistics';


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    board_id uuid,
    section_id uuid,
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo'::text NOT NULL,
    priority text,
    due_date date,
    tags text[],
    item_data jsonb DEFAULT '{}'::jsonb,
    display_order integer,
    completed_at timestamp with time zone,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    icon text,
    is_repeatable boolean DEFAULT false,
    repeat_frequency text,
    repeat_custom_days integer,
    last_completed_at timestamp with time zone,
    timer_duration_minutes integer,
    timer_started_at timestamp with time zone,
    timer_completed_at timestamp with time zone,
    reminder_date date,
    reminder_time time without time zone,
    reminder_sent_at timestamp with time zone,
    is_urgent_after_timer boolean DEFAULT false,
    CONSTRAINT tasks_priority_check CHECK (((priority IS NULL) OR (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])))),
    CONSTRAINT tasks_repeat_custom_days_check CHECK (((repeat_custom_days > 0) AND (repeat_custom_days <= 365))),
    CONSTRAINT tasks_repeat_frequency_check CHECK ((repeat_frequency = ANY (ARRAY['weekly'::text, 'monthly'::text, 'yearly'::text, 'custom'::text]))),
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text, 'archived'::text]))),
    CONSTRAINT tasks_title_check CHECK ((length(title) > 0))
);


--
-- Name: TABLE tasks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tasks IS 'Individual tasks with metadata (priority, tags, due dates, etc.)';


--
-- Name: COLUMN tasks.board_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.board_id IS 'Board this task belongs to. NULL for inbox/unassigned tasks.';


--
-- Name: COLUMN tasks.item_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.item_data IS 'JSON data specific to the board template (e.g., company_name, salary_range for job_tracker)';


--
-- Name: COLUMN tasks.icon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.icon IS 'Optional icon identifier for the task';


--
-- Name: COLUMN tasks.is_repeatable; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.is_repeatable IS 'Whether this task automatically reschedules after completion';


--
-- Name: COLUMN tasks.repeat_frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.repeat_frequency IS 'How often the task repeats: weekly, monthly, yearly, or custom';


--
-- Name: COLUMN tasks.repeat_custom_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.repeat_custom_days IS 'For custom frequency: number of days between repeats (1-365)';


--
-- Name: COLUMN tasks.last_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.last_completed_at IS 'Timestamp of when repeatable task was last completed (for tracking)';


--
-- Name: COLUMN tasks.timer_duration_minutes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.timer_duration_minutes IS 'Duration in minutes for timer-based tasks';


--
-- Name: COLUMN tasks.timer_started_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.timer_started_at IS 'Timestamp when the timer was started';


--
-- Name: COLUMN tasks.timer_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.timer_completed_at IS 'Timestamp when the timer completed';


--
-- Name: COLUMN tasks.reminder_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.reminder_date IS 'Date for date-based reminders (birthdays, anniversaries, etc.)';


--
-- Name: COLUMN tasks.reminder_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.reminder_time IS 'Optional time for the reminder';


--
-- Name: COLUMN tasks.reminder_sent_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.reminder_sent_at IS 'Timestamp tracking when reminder was sent';


--
-- Name: COLUMN tasks.is_urgent_after_timer; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tasks.is_urgent_after_timer IS 'Flag to mark task as urgent after timer completes';


--
-- Name: user_watched_archive; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_watched_archive (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    external_id text NOT NULL,
    title text NOT NULL,
    media_type text NOT NULL,
    poster_url text,
    release_date text,
    overview text,
    director text,
    "cast" text[],
    genres text[],
    vote_average numeric(3,1),
    vote_count integer,
    runtime integer,
    awards text[],
    rating integer,
    review text,
    is_favorite boolean DEFAULT false,
    watched_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_watched_archive_media_type_check CHECK ((media_type = ANY (ARRAY['movie'::text, 'tv'::text]))),
    CONSTRAINT user_watched_archive_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: TABLE user_watched_archive; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_watched_archive IS 'Archive of watched movies/TV with ratings. Frontend enforces max 1000 items per user. See DATABASE_QUERY_LIMITS.md';


--
-- Name: user_watchlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_watchlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    external_id text NOT NULL,
    media_type text NOT NULL,
    title text NOT NULL,
    poster_url text,
    release_date text,
    overview text,
    director text,
    cast_members text[],
    genres text[],
    vote_average numeric(3,1),
    vote_count integer,
    runtime integer,
    watched boolean DEFAULT false,
    list_order integer,
    notes text,
    added_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    watched_at timestamp with time zone,
    CONSTRAINT user_watchlist_media_type_check CHECK ((media_type = ANY (ARRAY['movie'::text, 'tv'::text])))
);


--
-- Name: TABLE user_watchlist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_watchlist IS 'Personal watchlist for movies and TV shows users want to watch';


--
-- Name: COLUMN user_watchlist.external_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_watchlist.external_id IS 'TMDB movie or TV show ID';


--
-- Name: COLUMN user_watchlist.watched; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_watchlist.watched IS 'Whether the user has watched this item';


--
-- Name: COLUMN user_watchlist.list_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_watchlist.list_order IS 'Order in list for drag-drop (future feature)';


--
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_config
    ADD CONSTRAINT app_config_pkey PRIMARY KEY (key);


--
-- Name: board_shares board_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_shares
    ADD CONSTRAINT board_shares_pkey PRIMARY KEY (id);


--
-- Name: book_recommendations book_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_recommendations
    ADD CONSTRAINT book_recommendations_pkey PRIMARY KEY (id);


--
-- Name: connections connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_pkey PRIMARY KEY (id);


--
-- Name: connections connections_user_id_friend_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_user_id_friend_id_key UNIQUE (user_id, friend_id);


--
-- Name: game_library game_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_library
    ADD CONSTRAINT game_library_pkey PRIMARY KEY (id);


--
-- Name: game_library game_library_user_id_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_library
    ADD CONSTRAINT game_library_user_id_external_id_key UNIQUE (user_id, external_id);


--
-- Name: game_recommendations game_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_recommendations
    ADD CONSTRAINT game_recommendations_pkey PRIMARY KEY (id);


--
-- Name: invite_code_audit_log invite_code_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_code_audit_log
    ADD CONSTRAINT invite_code_audit_log_pkey PRIMARY KEY (id);


--
-- Name: invite_codes invite_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_code_key UNIQUE (code);


--
-- Name: invite_codes invite_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_pkey PRIMARY KEY (id);


--
-- Name: media_reviews media_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_reviews
    ADD CONSTRAINT media_reviews_pkey PRIMARY KEY (id);


--
-- Name: media_reviews media_reviews_user_media_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_reviews
    ADD CONSTRAINT media_reviews_user_media_unique UNIQUE (user_id, external_id, media_type);


--
-- Name: movie_recommendations movie_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_recommendations
    ADD CONSTRAINT movie_recommendations_pkey PRIMARY KEY (id);


--
-- Name: music_library music_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_library
    ADD CONSTRAINT music_library_pkey PRIMARY KEY (id);


--
-- Name: music_library music_library_user_id_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_library
    ADD CONSTRAINT music_library_user_id_external_id_key UNIQUE (user_id, external_id);


--
-- Name: music_recommendations music_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_recommendations
    ADD CONSTRAINT music_recommendations_pkey PRIMARY KEY (id);


--
-- Name: reading_list reading_list_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_list
    ADD CONSTRAINT reading_list_pkey PRIMARY KEY (id);


--
-- Name: reading_list reading_list_user_id_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_list
    ADD CONSTRAINT reading_list_user_id_external_id_key UNIQUE (user_id, external_id);


--
-- Name: task_board_sections task_board_sections_board_id_display_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_board_sections
    ADD CONSTRAINT task_board_sections_board_id_display_order_key UNIQUE (board_id, display_order);


--
-- Name: task_board_sections task_board_sections_board_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_board_sections
    ADD CONSTRAINT task_board_sections_board_id_name_key UNIQUE (board_id, name);


--
-- Name: task_board_sections task_board_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_board_sections
    ADD CONSTRAINT task_board_sections_pkey PRIMARY KEY (id);


--
-- Name: task_boards task_boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_boards
    ADD CONSTRAINT task_boards_pkey PRIMARY KEY (id);


--
-- Name: task_boards task_boards_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_boards
    ADD CONSTRAINT task_boards_user_id_name_key UNIQUE (user_id, name);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: board_shares unique_board_share; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_shares
    ADD CONSTRAINT unique_board_share UNIQUE (board_id, shared_with_user_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: user_watched_archive user_watched_archive_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_watched_archive
    ADD CONSTRAINT user_watched_archive_pkey PRIMARY KEY (id);


--
-- Name: user_watched_archive user_watched_archive_user_id_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_watched_archive
    ADD CONSTRAINT user_watched_archive_user_id_external_id_key UNIQUE (user_id, external_id);


--
-- Name: user_watchlist user_watchlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_watchlist
    ADD CONSTRAINT user_watchlist_pkey PRIMARY KEY (id);


--
-- Name: user_watchlist user_watchlist_user_id_external_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_watchlist
    ADD CONSTRAINT user_watchlist_user_id_external_id_key UNIQUE (user_id, external_id);


--
-- Name: idx_audit_log_code_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_code_id ON public.invite_code_audit_log USING btree (code_id);


--
-- Name: idx_audit_log_used_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_used_at ON public.invite_code_audit_log USING btree (used_at DESC);


--
-- Name: idx_board_shares_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_board_shares_board_id ON public.board_shares USING btree (board_id);


--
-- Name: idx_board_shares_shared_with; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_board_shares_shared_with ON public.board_shares USING btree (shared_with_user_id);


--
-- Name: idx_book_recs_authors; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_book_recs_authors ON public.book_recommendations USING gin (to_tsvector('english'::regconfig, authors));


--
-- Name: idx_book_recs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_book_recs_created_at ON public.book_recommendations USING btree (created_at DESC);


--
-- Name: idx_book_recs_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_book_recs_external_id ON public.book_recommendations USING btree (external_id);


--
-- Name: idx_book_recs_from_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_book_recs_from_user ON public.book_recommendations USING btree (from_user_id);


--
-- Name: idx_book_recs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_book_recs_status ON public.book_recommendations USING btree (status);


--
-- Name: idx_book_recs_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_book_recs_title ON public.book_recommendations USING gin (to_tsvector('english'::regconfig, title));


--
-- Name: idx_book_recs_to_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_book_recs_to_user ON public.book_recommendations USING btree (to_user_id, status);


--
-- Name: idx_connections_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_created_at ON public.connections USING btree (created_at);


--
-- Name: idx_connections_friend_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_friend_id ON public.connections USING btree (friend_id);


--
-- Name: idx_connections_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_user_id ON public.connections USING btree (user_id);


--
-- Name: idx_game_library_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_library_created_at ON public.game_library USING btree (user_id, created_at DESC);


--
-- Name: idx_game_library_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_library_external_id ON public.game_library USING btree (external_id);


--
-- Name: idx_game_library_played; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_library_played ON public.game_library USING btree (user_id, played);


--
-- Name: idx_game_library_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_library_rating ON public.game_library USING btree (user_id, personal_rating DESC) WHERE (personal_rating IS NOT NULL);


--
-- Name: idx_game_library_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_library_user_id ON public.game_library USING btree (user_id);


--
-- Name: idx_game_recs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_recs_created_at ON public.game_recommendations USING btree (created_at DESC);


--
-- Name: idx_game_recs_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_recs_external_id ON public.game_recommendations USING btree (external_id);


--
-- Name: idx_game_recs_from_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_recs_from_user ON public.game_recommendations USING btree (from_user_id);


--
-- Name: idx_game_recs_genres; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_recs_genres ON public.game_recommendations USING gin (to_tsvector('english'::regconfig, genres));


--
-- Name: idx_game_recs_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_recs_name ON public.game_recommendations USING gin (to_tsvector('english'::regconfig, name));


--
-- Name: idx_game_recs_platforms; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_recs_platforms ON public.game_recommendations USING gin (to_tsvector('english'::regconfig, platforms));


--
-- Name: idx_game_recs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_recs_status ON public.game_recommendations USING btree (status);


--
-- Name: idx_game_recs_to_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_recs_to_user ON public.game_recommendations USING btree (to_user_id, status);


--
-- Name: idx_invite_audit_code_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_audit_code_id ON public.invite_code_audit_log USING btree (code_id);


--
-- Name: idx_invite_audit_used_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_audit_used_by ON public.invite_code_audit_log USING btree (used_by);


--
-- Name: idx_invite_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_code ON public.invite_codes USING btree (code);


--
-- Name: idx_invite_codes_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_created_by ON public.invite_codes USING btree (created_by);


--
-- Name: idx_invite_codes_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_expires_at ON public.invite_codes USING btree (expires_at);


--
-- Name: idx_invite_codes_intended_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_intended_email ON public.invite_codes USING btree (intended_email);


--
-- Name: idx_invite_codes_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_is_active ON public.invite_codes USING btree (is_active);


--
-- Name: idx_invite_codes_used_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_used_by ON public.invite_codes USING btree (used_by);


--
-- Name: idx_invite_codes_validation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invite_codes_validation ON public.invite_codes USING btree (code, is_active, expires_at, current_uses, max_uses);


--
-- Name: idx_movie_recs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_created_at ON public.movie_recommendations USING btree (created_at DESC);


--
-- Name: idx_movie_recs_from_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_from_user ON public.movie_recommendations USING btree (from_user_id);


--
-- Name: idx_movie_recs_from_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_from_user_created ON public.movie_recommendations USING btree (from_user_id, created_at DESC);


--
-- Name: idx_movie_recs_media_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_media_type ON public.movie_recommendations USING btree (media_type);


--
-- Name: idx_movie_recs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_status ON public.movie_recommendations USING btree (status);


--
-- Name: idx_movie_recs_to_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_to_user ON public.movie_recommendations USING btree (to_user_id, status);


--
-- Name: idx_movie_recs_to_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_to_user_created ON public.movie_recommendations USING btree (to_user_id, created_at DESC);


--
-- Name: idx_movie_recs_to_user_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_to_user_status_created ON public.movie_recommendations USING btree (to_user_id, status, created_at DESC);


--
-- Name: idx_movie_recs_to_user_type_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_to_user_type_created ON public.movie_recommendations USING btree (to_user_id, media_type, created_at DESC);


--
-- Name: idx_movie_recs_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_recs_year ON public.movie_recommendations USING btree (year);


--
-- Name: idx_music_library_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_library_created_at ON public.music_library USING btree (user_id, created_at DESC);


--
-- Name: idx_music_library_listened; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_library_listened ON public.music_library USING btree (user_id, listened);


--
-- Name: idx_music_library_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_library_user_id ON public.music_library USING btree (user_id);


--
-- Name: idx_music_recs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_recs_created_at ON public.music_recommendations USING btree (created_at DESC);


--
-- Name: idx_music_recs_from_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_recs_from_user ON public.music_recommendations USING btree (from_user_id);


--
-- Name: idx_music_recs_from_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_recs_from_user_created ON public.music_recommendations USING btree (from_user_id, created_at DESC);


--
-- Name: idx_music_recs_media_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_recs_media_type ON public.music_recommendations USING btree (media_type);


--
-- Name: idx_music_recs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_recs_status ON public.music_recommendations USING btree (status);


--
-- Name: idx_music_recs_to_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_recs_to_user ON public.music_recommendations USING btree (to_user_id, status);


--
-- Name: idx_music_recs_to_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_recs_to_user_created ON public.music_recommendations USING btree (to_user_id, created_at DESC);


--
-- Name: idx_music_recs_to_user_status_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_recs_to_user_status_created ON public.music_recommendations USING btree (to_user_id, status, created_at DESC);


--
-- Name: idx_music_recs_to_user_type_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_music_recs_to_user_type_created ON public.music_recommendations USING btree (to_user_id, media_type, created_at DESC);


--
-- Name: idx_reading_list_added_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reading_list_added_at ON public.reading_list USING btree (user_id, added_at DESC);


--
-- Name: idx_reading_list_authors; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reading_list_authors ON public.reading_list USING gin (to_tsvector('english'::regconfig, authors));


--
-- Name: idx_reading_list_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reading_list_external_id ON public.reading_list USING btree (external_id);


--
-- Name: idx_reading_list_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reading_list_title ON public.reading_list USING gin (to_tsvector('english'::regconfig, title));


--
-- Name: idx_reading_list_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reading_list_user_id ON public.reading_list USING btree (user_id);


--
-- Name: idx_reading_list_user_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reading_list_user_read ON public.reading_list USING btree (user_id, read);


--
-- Name: idx_task_board_sections_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_board_sections_board_id ON public.task_board_sections USING btree (board_id);


--
-- Name: idx_task_boards_template_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_boards_template_type ON public.task_boards USING btree (template_type);


--
-- Name: idx_task_boards_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_boards_user_id ON public.task_boards USING btree (user_id);


--
-- Name: idx_task_boards_user_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_boards_user_order ON public.task_boards USING btree (user_id, display_order);


--
-- Name: idx_tasks_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_board_id ON public.tasks USING btree (board_id);


--
-- Name: idx_tasks_inbox; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_inbox ON public.tasks USING btree (user_id, display_order) WHERE (board_id IS NULL);


--
-- Name: idx_tasks_item_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_item_data ON public.tasks USING gin (item_data);


--
-- Name: idx_tasks_null_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_null_board_id ON public.tasks USING btree (user_id) WHERE (board_id IS NULL);


--
-- Name: idx_tasks_reminder_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_reminder_date ON public.tasks USING btree (reminder_date) WHERE (reminder_date IS NOT NULL);


--
-- Name: idx_tasks_repeatable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_repeatable ON public.tasks USING btree (is_repeatable, due_date) WHERE (is_repeatable = true);


--
-- Name: idx_tasks_section_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_section_id ON public.tasks USING btree (section_id);


--
-- Name: idx_tasks_timer_started_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_timer_started_at ON public.tasks USING btree (timer_started_at) WHERE (timer_started_at IS NOT NULL);


--
-- Name: idx_tasks_user_board_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_board_order ON public.tasks USING btree (user_id, board_id, display_order);


--
-- Name: idx_tasks_user_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_due_date ON public.tasks USING btree (user_id, due_date) WHERE (due_date IS NOT NULL);


--
-- Name: idx_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id);


--
-- Name: idx_tasks_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_status ON public.tasks USING btree (user_id, status);


--
-- Name: idx_user_profiles_display_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_display_name ON public.user_profiles USING btree (display_name);


--
-- Name: idx_user_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email);


--
-- Name: idx_user_profiles_is_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_is_admin ON public.user_profiles USING btree (is_admin) WHERE (is_admin = true);


--
-- Name: idx_user_watched_archive_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_watched_archive_external_id ON public.user_watched_archive USING btree (external_id);


--
-- Name: idx_user_watched_archive_favorites; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_watched_archive_favorites ON public.user_watched_archive USING btree (user_id, is_favorite) WHERE (is_favorite = true);


--
-- Name: idx_user_watched_archive_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_watched_archive_rating ON public.user_watched_archive USING btree (user_id, rating DESC) WHERE (rating IS NOT NULL);


--
-- Name: idx_user_watched_archive_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_watched_archive_user_date ON public.user_watched_archive USING btree (user_id, watched_at DESC);


--
-- Name: idx_user_watched_archive_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_watched_archive_user_id ON public.user_watched_archive USING btree (user_id);


--
-- Name: idx_user_watched_rating_filter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_watched_rating_filter ON public.user_watched_archive USING btree (user_id, rating) WHERE (rating IS NOT NULL);


--
-- Name: idx_watchlist_added_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watchlist_added_at ON public.user_watchlist USING btree (user_id, added_at DESC);


--
-- Name: idx_watchlist_external_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watchlist_external_id ON public.user_watchlist USING btree (external_id);


--
-- Name: idx_watchlist_media_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watchlist_media_type ON public.user_watchlist USING btree (media_type);


--
-- Name: idx_watchlist_user_added; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watchlist_user_added ON public.user_watchlist USING btree (user_id, added_at DESC);


--
-- Name: idx_watchlist_user_external; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watchlist_user_external ON public.user_watchlist USING btree (user_id, external_id);


--
-- Name: idx_watchlist_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watchlist_user_id ON public.user_watchlist USING btree (user_id);


--
-- Name: idx_watchlist_user_watched; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watchlist_user_watched ON public.user_watchlist USING btree (user_id, watched);


--
-- Name: idx_watchlist_user_watched_added; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watchlist_user_watched_added ON public.user_watchlist USING btree (user_id, watched, added_at DESC);


--
-- Name: media_reviews_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_reviews_created_at_idx ON public.media_reviews USING btree (created_at DESC);


--
-- Name: media_reviews_external_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_reviews_external_id_idx ON public.media_reviews USING btree (external_id);


--
-- Name: media_reviews_is_public_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_reviews_is_public_idx ON public.media_reviews USING btree (is_public);


--
-- Name: media_reviews_media_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_reviews_media_type_idx ON public.media_reviews USING btree (media_type);


--
-- Name: media_reviews_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_reviews_user_id_idx ON public.media_reviews USING btree (user_id);


--
-- Name: task_boards_with_stats _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.task_boards_with_stats AS
 SELECT tb.id,
    tb.user_id,
    tb.name,
    tb.description,
    tb.icon,
    tb.color,
    tb.is_public,
    tb.board_type,
    tb.template_type,
    tb.column_config,
    tb.field_config,
    tb.display_order,
    tb.created_at,
    tb.updated_at,
    count(t.id) AS total_tasks,
    count(t.id) FILTER (WHERE (t.status = 'done'::text)) AS completed_tasks,
    count(t.id) FILTER (WHERE (t.status = ANY (ARRAY['todo'::text, 'in_progress'::text]))) AS pending_tasks,
    count(t.id) FILTER (WHERE ((t.due_date < CURRENT_DATE) AND (t.status <> 'done'::text) AND (t.status <> 'archived'::text))) AS overdue_tasks
   FROM (public.task_boards tb
     LEFT JOIN public.tasks t ON ((t.board_id = tb.id)))
  GROUP BY tb.id;


--
-- Name: user_profiles check_is_admin_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER check_is_admin_change BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_is_admin_change();


--
-- Name: user_profiles enforce_admin_escalation_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_admin_escalation_update BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_escalation_update();


--
-- Name: user_profiles enforce_admin_self_grant_protection; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_admin_self_grant_protection BEFORE INSERT ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_self_grant();


--
-- Name: user_profiles enforce_super_admin_protection; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_super_admin_protection BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_super_admin_revoke();


--
-- Name: game_library trigger_update_game_library_played_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_game_library_played_at BEFORE UPDATE ON public.game_library FOR EACH ROW EXECUTE FUNCTION public.update_game_library_played_at();


--
-- Name: game_recommendations trigger_update_game_recommendation_played_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_game_recommendation_played_at BEFORE UPDATE ON public.game_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_game_recommendation_played_at();


--
-- Name: music_library trigger_update_music_library_listened_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_music_library_listened_at BEFORE UPDATE ON public.music_library FOR EACH ROW EXECUTE FUNCTION public.update_music_library_listened_at();


--
-- Name: book_recommendations update_book_rec_read_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_book_rec_read_at_trigger BEFORE UPDATE ON public.book_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_book_rec_read_at();


--
-- Name: media_reviews update_media_reviews_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_media_reviews_modtime BEFORE UPDATE ON public.media_reviews FOR EACH ROW EXECUTE FUNCTION public.handle_media_review_update();


--
-- Name: movie_recommendations update_movie_rec_watched_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_movie_rec_watched_at_trigger BEFORE UPDATE ON public.movie_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_movie_rec_watched_at();


--
-- Name: music_recommendations update_music_rec_consumed_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_music_rec_consumed_at_trigger BEFORE UPDATE ON public.music_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_music_rec_consumed_at();


--
-- Name: reading_list update_reading_list_timestamps_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reading_list_timestamps_trigger BEFORE INSERT OR UPDATE ON public.reading_list FOR EACH ROW EXECUTE FUNCTION public.update_reading_list_timestamps();


--
-- Name: task_boards update_task_boards_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_task_boards_updated_at_trigger BEFORE UPDATE ON public.task_boards FOR EACH ROW EXECUTE FUNCTION public.update_task_boards_updated_at();


--
-- Name: tasks update_tasks_timestamps_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_timestamps_trigger BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_tasks_timestamps();


--
-- Name: user_profiles update_user_profiles_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_profiles_updated_at_trigger BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_user_profiles_updated_at();


--
-- Name: user_watched_archive update_user_watched_archive_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_watched_archive_updated_at BEFORE UPDATE ON public.user_watched_archive FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_watchlist update_watchlist_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_watchlist_updated_at_trigger BEFORE UPDATE ON public.user_watchlist FOR EACH ROW EXECUTE FUNCTION public.update_watchlist_updated_at();


--
-- Name: board_shares board_shares_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_shares
    ADD CONSTRAINT board_shares_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.task_boards(id) ON DELETE CASCADE;


--
-- Name: board_shares board_shares_shared_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_shares
    ADD CONSTRAINT board_shares_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: board_shares board_shares_shared_with_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_shares
    ADD CONSTRAINT board_shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: book_recommendations book_recommendations_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_recommendations
    ADD CONSTRAINT book_recommendations_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: book_recommendations book_recommendations_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_recommendations
    ADD CONSTRAINT book_recommendations_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: connections connections_friend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: connections connections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: game_library game_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_library
    ADD CONSTRAINT game_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: game_recommendations game_recommendations_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_recommendations
    ADD CONSTRAINT game_recommendations_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: game_recommendations game_recommendations_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_recommendations
    ADD CONSTRAINT game_recommendations_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invite_code_audit_log invite_code_audit_log_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_code_audit_log
    ADD CONSTRAINT invite_code_audit_log_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: invite_codes invite_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: invite_codes invite_codes_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: media_reviews media_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_reviews
    ADD CONSTRAINT media_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: movie_recommendations movie_recommendations_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_recommendations
    ADD CONSTRAINT movie_recommendations_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: movie_recommendations movie_recommendations_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_recommendations
    ADD CONSTRAINT movie_recommendations_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: music_library music_library_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_library
    ADD CONSTRAINT music_library_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: music_recommendations music_recommendations_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_recommendations
    ADD CONSTRAINT music_recommendations_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: music_recommendations music_recommendations_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.music_recommendations
    ADD CONSTRAINT music_recommendations_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reading_list reading_list_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reading_list
    ADD CONSTRAINT reading_list_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: task_board_sections task_board_sections_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_board_sections
    ADD CONSTRAINT task_board_sections_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.task_boards(id) ON DELETE CASCADE;


--
-- Name: task_boards task_boards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_boards
    ADD CONSTRAINT task_boards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_board_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.task_boards(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.task_board_sections(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_watchlist user_watchlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_watchlist
    ADD CONSTRAINT user_watchlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: invite_codes Admins can create invite codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create invite codes" ON public.invite_codes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));


--
-- Name: invite_code_audit_log Admins can delete audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete audit logs" ON public.invite_code_audit_log FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: POLICY "Admins can delete audit logs" ON invite_code_audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can delete audit logs" ON public.invite_code_audit_log IS 'Allows admin users to delete audit log entries for cleanup, GDPR compliance, or testing.
   Uses is_admin() helper function to check admin status.';


--
-- Name: invite_codes Admins can delete invite codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete invite codes" ON public.invite_codes FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));


--
-- Name: user_profiles Admins can update any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any profile" ON public.user_profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));


--
-- Name: POLICY "Admins can update any profile" ON user_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can update any profile" ON public.user_profiles IS 'Admin users can update any profile, including granting/revoking admin. Super admin protected by separate trigger.';


--
-- Name: invite_code_audit_log Admins can update audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update audit logs" ON public.invite_code_audit_log FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: POLICY "Admins can update audit logs" ON invite_code_audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can update audit logs" ON public.invite_code_audit_log IS 'Allows admin users to update audit log entries for corrections or cleanup.
   Uses is_admin() helper function to check admin status.';


--
-- Name: invite_codes Admins can update invite codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update invite codes" ON public.invite_codes FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND (user_profiles.is_admin = true)))));


--
-- Name: invite_code_audit_log Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.invite_code_audit_log FOR SELECT USING (public.is_admin(auth.uid()));


--
-- Name: app_config Anyone can read config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read config" ON public.app_config FOR SELECT TO authenticated USING (true);


--
-- Name: invite_codes Anyone can validate invite codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can validate invite codes" ON public.invite_codes FOR SELECT USING (true);


--
-- Name: user_profiles Anyone can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view profiles" ON public.user_profiles FOR SELECT TO authenticated USING (true);


--
-- Name: board_shares Board owners can create shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Board owners can create shares" ON public.board_shares FOR INSERT WITH CHECK ((board_id IN ( SELECT task_boards.id
   FROM public.task_boards
  WHERE (task_boards.user_id = auth.uid()))));


--
-- Name: board_shares Board owners can delete shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Board owners can delete shares" ON public.board_shares FOR DELETE USING ((board_id IN ( SELECT task_boards.id
   FROM public.task_boards
  WHERE (task_boards.user_id = auth.uid()))));


--
-- Name: board_shares Board owners can update shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Board owners can update shares" ON public.board_shares FOR UPDATE USING ((board_id IN ( SELECT task_boards.id
   FROM public.task_boards
  WHERE (task_boards.user_id = auth.uid()))));


--
-- Name: book_recommendations Book recipients can update their recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Book recipients can update their recommendations" ON public.book_recommendations FOR UPDATE TO authenticated USING ((auth.uid() = to_user_id)) WITH CHECK ((auth.uid() = to_user_id));


--
-- Name: book_recommendations Book senders can delete recommendations they sent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Book senders can delete recommendations they sent" ON public.book_recommendations FOR DELETE TO authenticated USING ((auth.uid() = from_user_id));


--
-- Name: book_recommendations Book senders can update their notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Book senders can update their notes" ON public.book_recommendations FOR UPDATE TO authenticated USING ((auth.uid() = from_user_id)) WITH CHECK ((auth.uid() = from_user_id));


--
-- Name: game_recommendations Game recipients can update their recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Game recipients can update their recommendations" ON public.game_recommendations FOR UPDATE TO authenticated USING ((auth.uid() = to_user_id)) WITH CHECK ((auth.uid() = to_user_id));


--
-- Name: game_recommendations Game senders can delete recommendations they sent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Game senders can delete recommendations they sent" ON public.game_recommendations FOR DELETE TO authenticated USING ((auth.uid() = from_user_id));


--
-- Name: game_recommendations Game senders can update their notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Game senders can update their notes" ON public.game_recommendations FOR UPDATE TO authenticated USING ((auth.uid() = from_user_id)) WITH CHECK ((auth.uid() = from_user_id));


--
-- Name: app_config Only admins can modify config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can modify config" ON public.app_config TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: movie_recommendations Recipients can update their recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recipients can update their recommendations" ON public.movie_recommendations FOR UPDATE TO authenticated USING ((auth.uid() = to_user_id)) WITH CHECK ((auth.uid() = to_user_id));


--
-- Name: music_recommendations Recipients can update their recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recipients can update their recommendations" ON public.music_recommendations FOR UPDATE TO authenticated USING ((auth.uid() = to_user_id)) WITH CHECK ((auth.uid() = to_user_id));


--
-- Name: movie_recommendations Senders can delete recommendations they sent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Senders can delete recommendations they sent" ON public.movie_recommendations FOR DELETE TO authenticated USING ((auth.uid() = from_user_id));


--
-- Name: music_recommendations Senders can delete recommendations they sent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Senders can delete recommendations they sent" ON public.music_recommendations FOR DELETE TO authenticated USING ((auth.uid() = from_user_id));


--
-- Name: movie_recommendations Senders can update their notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Senders can update their notes" ON public.movie_recommendations FOR UPDATE TO authenticated USING ((auth.uid() = from_user_id)) WITH CHECK ((auth.uid() = from_user_id));


--
-- Name: music_recommendations Senders can update their notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Senders can update their notes" ON public.music_recommendations FOR UPDATE TO authenticated USING ((auth.uid() = from_user_id)) WITH CHECK ((auth.uid() = from_user_id));


--
-- Name: invite_code_audit_log System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.invite_code_audit_log FOR INSERT WITH CHECK (true);


--
-- Name: reading_list Users can add to their own reading list; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add to their own reading list" ON public.reading_list FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_watchlist Users can add to their own watchlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add to their own watchlist" ON public.user_watchlist FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: connections Users can create connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create connections" ON public.connections FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) OR (auth.uid() = friend_id)));


--
-- Name: task_board_sections Users can create sections in their boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create sections in their boards" ON public.task_board_sections FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.task_boards
  WHERE ((task_boards.id = task_board_sections.board_id) AND (task_boards.user_id = auth.uid())))));


--
-- Name: task_boards Users can create their own boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own boards" ON public.task_boards FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: tasks Users can create their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_watched_archive Users can delete from own archive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from own archive" ON public.user_watched_archive FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: reading_list Users can delete from their own reading list; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their own reading list" ON public.reading_list FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_watchlist Users can delete from their own watchlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their own watchlist" ON public.user_watchlist FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: game_library Users can delete own game library items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own game library items" ON public.game_library FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: music_library Users can delete own music library items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own music library items" ON public.music_library FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can delete own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: task_board_sections Users can delete sections from their boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete sections from their boards" ON public.task_board_sections FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.task_boards
  WHERE ((task_boards.id = task_board_sections.board_id) AND (task_boards.user_id = auth.uid())))));


--
-- Name: task_boards Users can delete their own boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own boards" ON public.task_boards FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: connections Users can delete their own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own connections" ON public.connections FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR (auth.uid() = friend_id)));


--
-- Name: media_reviews Users can delete their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reviews" ON public.media_reviews FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: tasks Users can delete their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_watched_archive Users can insert into own archive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert into own archive" ON public.user_watched_archive FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: game_library Users can insert own game library items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own game library items" ON public.game_library FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: music_library Users can insert own music library items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own music library items" ON public.music_library FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: media_reviews Users can insert their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own reviews" ON public.media_reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: book_recommendations Users can send book recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send book recommendations" ON public.book_recommendations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = from_user_id));


--
-- Name: game_recommendations Users can send game recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send game recommendations" ON public.game_recommendations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = from_user_id));


--
-- Name: movie_recommendations Users can send recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send recommendations" ON public.movie_recommendations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = from_user_id));


--
-- Name: music_recommendations Users can send recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send recommendations" ON public.music_recommendations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = from_user_id));


--
-- Name: user_watched_archive Users can update own archive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own archive" ON public.user_watched_archive FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: game_library Users can update own game library items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own game library items" ON public.game_library FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: music_library Users can update own music library items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own music library items" ON public.music_library FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: POLICY "Users can update own profile" ON user_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Users can update own profile" ON public.user_profiles IS 'Users can attempt to update their own profile. Trigger prevents is_admin changes by non-admins.';


--
-- Name: task_board_sections Users can update sections in their boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update sections in their boards" ON public.task_board_sections FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.task_boards
  WHERE ((task_boards.id = task_board_sections.board_id) AND (task_boards.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.task_boards
  WHERE ((task_boards.id = task_board_sections.board_id) AND (task_boards.user_id = auth.uid())))));


--
-- Name: task_boards Users can update their own boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own boards" ON public.task_boards FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: connections Users can update their own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own connections" ON public.connections FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR (auth.uid() = friend_id))) WITH CHECK (((auth.uid() = user_id) OR (auth.uid() = friend_id)));


--
-- Name: reading_list Users can update their own reading list; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reading list" ON public.reading_list FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: media_reviews Users can update their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reviews" ON public.media_reviews FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: tasks Users can update their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_watchlist Users can update their own watchlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own watchlist" ON public.user_watchlist FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: board_shares Users can view board shares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view board shares" ON public.board_shares FOR SELECT USING (((shared_with_user_id = auth.uid()) OR (shared_by_user_id = auth.uid()) OR (board_id IN ( SELECT task_boards.id
   FROM public.task_boards
  WHERE (task_boards.user_id = auth.uid())))));


--
-- Name: POLICY "Users can view board shares" ON board_shares; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Users can view board shares" ON public.board_shares IS 'Allows users to view share information for boards they own or shares where they are the sharer/recipient. Uses IN subquery for better performance with count queries.';


--
-- Name: book_recommendations Users can view book recommendations sent to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view book recommendations sent to them" ON public.book_recommendations FOR SELECT TO authenticated USING ((auth.uid() = to_user_id));


--
-- Name: book_recommendations Users can view book recommendations they sent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view book recommendations they sent" ON public.book_recommendations FOR SELECT TO authenticated USING ((auth.uid() = from_user_id));


--
-- Name: game_recommendations Users can view game recommendations sent to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view game recommendations sent to them" ON public.game_recommendations FOR SELECT TO authenticated USING ((auth.uid() = to_user_id));


--
-- Name: game_recommendations Users can view game recommendations they sent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view game recommendations they sent" ON public.game_recommendations FOR SELECT TO authenticated USING ((auth.uid() = from_user_id));


--
-- Name: user_watched_archive Users can view own archive; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own archive" ON public.user_watched_archive FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: game_library Users can view own game library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own game library" ON public.game_library FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: music_library Users can view own music library; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own music library" ON public.music_library FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: media_reviews Users can view public reviews from friends; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view public reviews from friends" ON public.media_reviews FOR SELECT USING (((is_public = true) AND (EXISTS ( SELECT 1
   FROM public.connections
  WHERE (((connections.user_id = auth.uid()) AND (connections.friend_id = media_reviews.user_id)) OR ((connections.friend_id = auth.uid()) AND (connections.user_id = media_reviews.user_id)))))));


--
-- Name: movie_recommendations Users can view recommendations sent to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view recommendations sent to them" ON public.movie_recommendations FOR SELECT TO authenticated USING ((auth.uid() = to_user_id));


--
-- Name: music_recommendations Users can view recommendations sent to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view recommendations sent to them" ON public.music_recommendations FOR SELECT TO authenticated USING ((auth.uid() = to_user_id));


--
-- Name: movie_recommendations Users can view recommendations they sent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view recommendations they sent" ON public.movie_recommendations FOR SELECT TO authenticated USING ((auth.uid() = from_user_id));


--
-- Name: music_recommendations Users can view recommendations they sent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view recommendations they sent" ON public.music_recommendations FOR SELECT TO authenticated USING ((auth.uid() = from_user_id));


--
-- Name: task_board_sections Users can view sections of their boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view sections of their boards" ON public.task_board_sections FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.task_boards
  WHERE ((task_boards.id = task_board_sections.board_id) AND (task_boards.user_id = auth.uid())))));


--
-- Name: task_boards Users can view their own boards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own boards" ON public.task_boards FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: connections Users can view their own connections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own connections" ON public.connections FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR (auth.uid() = friend_id)));


--
-- Name: reading_list Users can view their own reading list; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reading list" ON public.reading_list FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: media_reviews Users can view their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reviews" ON public.media_reviews FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tasks Users can view their own tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_watchlist Users can view their own watchlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own watchlist" ON public.user_watchlist FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_profiles __is_admin_helper_policy__; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY __is_admin_helper_policy__ ON public.user_profiles FOR SELECT TO postgres USING (true);


--
-- Name: POLICY __is_admin_helper_policy__ ON user_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY __is_admin_helper_policy__ ON public.user_profiles IS 'Allows SECURITY DEFINER functions owned by postgres to read user_profiles under FORCE RLS.
   
SECURITY CONTEXT:
  - FORCE RLS means even privileged roles require explicit policy grants
  - This policy grants access ONLY to postgres (not postgres superuser)
  - Supabase client connections use authenticated/anon roles via JWT (never postgres)
  - All SECURITY DEFINER functions have fixed search_path to prevent schema hijacking
  
DEFENSE-IN-DEPTH IMPROVEMENTS:
  - postgres has NO LOGIN capability (cannot be used for direct connections)
  - postgres has minimal table privileges (SELECT on user_profiles, INSERT on connections, etc.)
  - postgres is NOT a superuser (limited blast radius vs postgres role)
  - Functions owned by postgres can only access tables explicitly granted
  
BOUNDARIES:
  - postgres access limited to: SECURITY DEFINER function execution only
  - Client applications use authenticated/anon roles (connection string uses ANON_KEY)
  - postgres role still used for: dashboard admins and migrations (not function execution)
  - Functions should query minimal columns to reduce data exposure
  
Without this policy, is_admin() and other admin check functions would fail under FORCE RLS.';


--
-- Name: invite_codes allow_bootstrap_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_bootstrap_insert ON public.invite_codes FOR INSERT TO authenticated, anon WITH CHECK (public.is_bootstrap_allowed());


--
-- Name: POLICY allow_bootstrap_insert ON invite_codes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY allow_bootstrap_insert ON public.invite_codes IS 'Allows unauthenticated bootstrap script to create first invite code when database has no users.
Auto-disables after first user signup. Required for create-bootstrap-code.js to work.
Security: Only works on empty databases (zero users in auth.users).';


--
-- Name: app_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

--
-- Name: board_shares; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.board_shares ENABLE ROW LEVEL SECURITY;

--
-- Name: book_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.book_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: connections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

--
-- Name: game_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_library ENABLE ROW LEVEL SECURITY;

--
-- Name: game_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: invite_code_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invite_code_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: invite_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: media_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: movie_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movie_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: music_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_library ENABLE ROW LEVEL SECURITY;

--
-- Name: music_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.music_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_list; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reading_list ENABLE ROW LEVEL SECURITY;

--
-- Name: task_board_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_board_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: task_boards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_boards ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_watched_archive; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_watched_archive ENABLE ROW LEVEL SECURITY;

--
-- Name: user_watchlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--
