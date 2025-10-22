


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_connect_users"("user_ids" "uuid"[]) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."batch_connect_users"("user_ids" "uuid"[]) OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."batch_connect_users"("user_ids" "uuid"[]) IS 'Admin-only function to manually connect a group of users (max 100).
   Can be run by:
   - postgres superuser in SQL editor
   - authenticated admin users via frontend
   
   Use for:
   - Small group/team connections
   - Testing with specific users
   - One-time migrations
   
   Example: SELECT batch_connect_users(ARRAY[''user1-id'', ''user2-id'', ''user3-id'']);
   Example: SELECT batch_connect_users(ARRAY(SELECT id FROM auth.users));';



CREATE OR REPLACE FUNCTION "public"."connect_new_user_to_everyone"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
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


ALTER FUNCTION "public"."connect_new_user_to_everyone"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."connect_new_user_to_everyone"() IS 'DEPRECATED: Auto-connect trigger disabled for scalability.
   This function creates O(N) inserts per signup, causing poor performance at scale.
   
   Keep function for manual use in development/testing only.
   For production: implement selective connections, friend requests, or group-based connections.
   
   To manually connect a specific user to everyone (dev/testing only):
   SELECT connect_new_user_to_everyone() FROM auth.users WHERE id = ''user-id'';';



CREATE OR REPLACE FUNCTION "public"."consume_invite_code"("code_value" "text", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
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


ALTER FUNCTION "public"."consume_invite_code"("code_value" "text", "user_id" "uuid") OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."consume_invite_code"("code_value" "text", "user_id" "uuid") IS 'Consumes an invite code for user registration. 
Features:
- Validates user_id matches authenticated caller (security)
- Uses row-level locking to prevent race conditions
- Increments current_uses counter
- Sets used_by and used_at on first use
- Inserts audit log entry for all usages
- Returns true on success, false if code invalid/expired/maxed out';



CREATE OR REPLACE FUNCTION "public"."create_bidirectional_connection"("user_a" "uuid", "user_b" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."create_bidirectional_connection"("user_a" "uuid", "user_b" "uuid") OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."create_bidirectional_connection"("user_a" "uuid", "user_b" "uuid") IS 'Creates bidirectional connection between two users.
   Available for manual connections or future friend request features.
   
   Usage:
   - Manual connection: SELECT create_bidirectional_connection(user1_id, user2_id);
   - Friend requests: Call after both users accept
   - Group connections: Batch connect members of same group/org';



CREATE OR REPLACE FUNCTION "public"."generate_invite_code"("p_max_uses" integer DEFAULT NULL::integer, "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."generate_invite_code"("p_max_uses" integer, "p_expires_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_friend_ids"("target_user_id" "uuid") RETURNS TABLE("friend_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RETURN QUERY
  SELECT c.friend_id
  FROM connections c
  WHERE c.user_id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."get_friend_ids"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_friends_ratings_for_movie"("target_user_id" "uuid", "target_external_id" "text") RETURNS TABLE("friend_id" "uuid", "display_name" "text", "rating" integer, "review" "text", "watched_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."get_friends_ratings_for_movie"("target_user_id" "uuid", "target_external_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_friends_with_names"("target_user_id" "uuid") RETURNS TABLE("friend_id" "uuid", "display_name" "text", "profile_picture_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."get_friends_with_names"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Trigger function (AFTER INSERT on auth.users) that creates user_profiles row.
   Sets display_name from metadata OR email, and syncs email field.
   Called by: on_auth_user_created trigger
   Coverage: INSERT operations on auth.users';



CREATE OR REPLACE FUNCTION "public"."is_admin"("check_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."is_admin"("check_user_id" "uuid") OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."is_admin"("check_user_id" "uuid") IS 'Returns true if the specified user has admin privileges. SECURITY DEFINER with fixed search_path to prevent schema hijacking.';



CREATE OR REPLACE FUNCTION "public"."prevent_admin_escalation_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."prevent_admin_escalation_update"() OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."prevent_admin_escalation_update"() IS 'Trigger function that blocks is_admin changes unless caller is already admin. SECURITY DEFINER with fixed search_path.';



CREATE OR REPLACE FUNCTION "public"."prevent_admin_self_grant"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."prevent_admin_self_grant"() OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."prevent_admin_self_grant"() IS 'Trigger function that prevents users from granting themselves admin during profile creation. SECURITY DEFINER with fixed search_path.';



CREATE OR REPLACE FUNCTION "public"."prevent_is_admin_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
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


ALTER FUNCTION "public"."prevent_is_admin_change"() OWNER TO "npc_service_role";


CREATE OR REPLACE FUNCTION "public"."prevent_super_admin_revoke"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."prevent_super_admin_revoke"() OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."prevent_super_admin_revoke"() IS 'Prevents the super admin account (adfa92d6-532b-47be-9101-bbfced9f73b4) from having admin privileges revoked. Updated to only check when is_admin field is actually being modified, allowing other profile updates.';



CREATE OR REPLACE FUNCTION "public"."sync_user_email_on_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Update user_profiles when auth.users email changes
  UPDATE public.user_profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_user_email_on_update"() OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."sync_user_email_on_update"() IS 'Trigger function (AFTER UPDATE OF email on auth.users) that syncs email changes.
   Updates user_profiles.email when auth.users.email changes.
   Called by: on_auth_user_email_updated trigger
   Coverage: UPDATE operations on auth.users (email column only)';



CREATE OR REPLACE FUNCTION "public"."trigger_connect_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  PERFORM connect_new_user_to_everyone(NEW.user_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_connect_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_movie_rec_watched_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If status is being changed from 'pending' to watched/hit/miss, set watched_at
  IF OLD.status = 'pending' AND NEW.status IN ('watched', 'hit', 'miss') THEN
    NEW.watched_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_movie_rec_watched_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_music_rec_consumed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If status is being changed from 'pending' to consumed/hit/miss, set consumed_at
  IF OLD.status = 'pending' AND NEW.status IN ('consumed', 'hit', 'miss') THEN
    NEW.consumed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_music_rec_consumed_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_watchlist_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."update_watchlist_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_invite_code"("code_value" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."validate_invite_code"("code_value" "text") OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."validate_invite_code"("code_value" "text") IS 'Validates an invite code without consuming it. Returns true if code is valid and available.';



CREATE OR REPLACE FUNCTION "public"."validate_invite_code"("code_value" "text", "user_email" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
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


ALTER FUNCTION "public"."validate_invite_code"("code_value" "text", "user_email" "text") OWNER TO "npc_service_role";


COMMENT ON FUNCTION "public"."validate_invite_code"("code_value" "text", "user_email" "text") IS 'Validates an invite code with strict email checking.
If the code has an intended_email:
  - user_email MUST be provided (cannot be null)
  - user_email MUST match intended_email (case-insensitive)
Otherwise validation fails, preventing bypass attacks.';



CREATE OR REPLACE FUNCTION "public"."verify_data_integrity"() RETURNS TABLE("table_name" "text", "invalid_count" bigint, "message" "text")
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."verify_data_integrity"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "connections_check" CHECK (("user_id" <> "friend_id"))
);


ALTER TABLE "public"."connections" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."index_usage" AS
 SELECT "schemaname",
    "relname" AS "tablename",
    "indexrelname" AS "indexname",
    "idx_scan" AS "times_used",
    "pg_size_pretty"("pg_relation_size"(("indexrelid")::"regclass")) AS "index_size"
   FROM "pg_stat_user_indexes" "i"
  WHERE ("schemaname" = 'public'::"name")
  ORDER BY "idx_scan" DESC;


ALTER VIEW "public"."index_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invite_code_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code_id" "uuid",
    "used_by" "uuid",
    "used_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invite_code_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."invite_code_audit_log" IS 'Audit log tracking all invite code usage.
   
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



CREATE TABLE IF NOT EXISTS "public"."invite_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "created_by" "uuid",
    "used_by" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "max_uses" integer DEFAULT 1 NOT NULL,
    "current_uses" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "used_at" timestamp with time zone,
    "notes" "text",
    "intended_email" "text",
    CONSTRAINT "used_at_requires_used_by" CHECK ((("used_at" IS NULL) OR ("used_by" IS NOT NULL))),
    CONSTRAINT "valid_current_uses" CHECK ((("current_uses" >= 0) AND ("current_uses" <= "max_uses"))),
    CONSTRAINT "valid_max_uses" CHECK (("max_uses" > 0))
);


ALTER TABLE "public"."invite_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."invite_codes" IS 'Manages invite codes for secure user registration. Supports single-use and multi-use codes with expiration dates.';



CREATE TABLE IF NOT EXISTS "public"."movie_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_user_id" "uuid" NOT NULL,
    "to_user_id" "uuid" NOT NULL,
    "external_id" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "release_date" "text",
    "overview" "text",
    "poster_url" "text",
    "year" integer,
    "recommendation_type" "text" DEFAULT 'watch'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "sent_message" "text",
    "sender_note" "text",
    "recipient_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "watched_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    CONSTRAINT "movie_recommendations_check" CHECK (("from_user_id" <> "to_user_id")),
    CONSTRAINT "movie_recommendations_media_type_check" CHECK (("media_type" = ANY (ARRAY['movie'::"text", 'tv'::"text"]))),
    CONSTRAINT "movie_recommendations_recommendation_type_check" CHECK (("recommendation_type" = ANY (ARRAY['watch'::"text", 'rewatch'::"text"]))),
    CONSTRAINT "movie_recommendations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'watched'::"text", 'hit'::"text", 'miss'::"text"])))
);


ALTER TABLE "public"."movie_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "theme_color" "text" DEFAULT '#9333ea'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false NOT NULL,
    "bio" "text",
    "profile_picture_url" "text",
    "visible_cards" "text"[],
    "email" "text",
    CONSTRAINT "user_profiles_theme_color_check" CHECK ((("theme_color" ~ '^#[0-9A-Fa-f]{6}$'::"text") OR ("theme_color" IS NULL)))
);

ALTER TABLE ONLY "public"."user_profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_profiles" IS 'User profiles with role-based access control. 
   
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



COMMENT ON COLUMN "public"."user_profiles"."theme_color" IS 'User theme accent color as a hex code (#RRGGBB). This color is applied to buttons, links, and accents throughout the application. Users can customize this via the color picker in Settings.';



COMMENT ON COLUMN "public"."user_profiles"."is_admin" IS 'Indicates whether the user has admin privileges (access to admin panel, invite code management, etc.)';



COMMENT ON COLUMN "public"."user_profiles"."email" IS 'User email synced from auth.users.email.
   Sync behavior:
   - INSERT: Set by handle_new_user() trigger (on_auth_user_created)
   - UPDATE: Synced by sync_user_email_on_update() trigger (on_auth_user_email_updated)
   - Can be NULL if auth.users.email is NULL (e.g., OAuth without email)
   
   Future: Consider NOT NULL constraint if app requires email for all users.';



CREATE OR REPLACE VIEW "public"."movie_recommendations_with_users" WITH ("security_barrier"='true') AS
 SELECT "mr"."id",
    "mr"."from_user_id",
    "mr"."to_user_id",
    "mr"."external_id",
    "mr"."media_type",
    "mr"."title",
    "mr"."release_date",
    "mr"."overview",
    "mr"."poster_url",
    "mr"."year",
    "mr"."recommendation_type",
    "mr"."status",
    "mr"."sent_message",
    "mr"."sender_note",
    "mr"."recipient_note",
    "mr"."created_at",
    "mr"."watched_at",
    "mr"."opened_at",
    "from_profile"."display_name" AS "sender_name",
    "to_profile"."display_name" AS "recipient_name"
   FROM (("public"."movie_recommendations" "mr"
     LEFT JOIN "public"."user_profiles" "from_profile" ON (("mr"."from_user_id" = "from_profile"."user_id")))
     LEFT JOIN "public"."user_profiles" "to_profile" ON (("mr"."to_user_id" = "to_profile"."user_id")));


ALTER VIEW "public"."movie_recommendations_with_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."music_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_user_id" "uuid" NOT NULL,
    "to_user_id" "uuid" NOT NULL,
    "external_id" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "artist" "text",
    "album" "text",
    "release_date" "text",
    "poster_url" "text",
    "preview_url" "text",
    "recommendation_type" "text" DEFAULT 'listen'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "sent_message" "text",
    "sender_note" "text",
    "recipient_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "consumed_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    CONSTRAINT "music_recommendations_check" CHECK (("from_user_id" <> "to_user_id")),
    CONSTRAINT "music_recommendations_media_type_check" CHECK (("media_type" = ANY (ARRAY['song'::"text", 'album'::"text", 'playlist'::"text"]))),
    CONSTRAINT "music_recommendations_recommendation_type_check" CHECK (("recommendation_type" = ANY (ARRAY['listen'::"text", 'watch'::"text", 'study'::"text"]))),
    CONSTRAINT "music_recommendations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'consumed'::"text", 'hit'::"text", 'miss'::"text"])))
);


ALTER TABLE "public"."music_recommendations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."music_recommendations_with_users" AS
 SELECT "mr"."id",
    "mr"."from_user_id",
    "mr"."to_user_id",
    "mr"."external_id",
    "mr"."media_type",
    "mr"."title",
    "mr"."artist",
    "mr"."album",
    "mr"."release_date",
    "mr"."poster_url",
    "mr"."preview_url",
    "mr"."recommendation_type",
    "mr"."status",
    "mr"."sent_message",
    "mr"."sender_note",
    "mr"."recipient_note",
    "mr"."created_at",
    "mr"."consumed_at",
    "mr"."opened_at",
    "from_profile"."display_name" AS "sender_name",
    "to_profile"."display_name" AS "recipient_name"
   FROM (("public"."music_recommendations" "mr"
     LEFT JOIN "public"."user_profiles" "from_profile" ON (("mr"."from_user_id" = "from_profile"."user_id")))
     LEFT JOIN "public"."user_profiles" "to_profile" ON (("mr"."to_user_id" = "to_profile"."user_id")));


ALTER VIEW "public"."music_recommendations_with_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_watched_archive" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "external_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "poster_url" "text",
    "release_date" "text",
    "overview" "text",
    "director" "text",
    "cast" "text"[],
    "genres" "text"[],
    "vote_average" numeric(3,1),
    "vote_count" integer,
    "runtime" integer,
    "awards" "text"[],
    "rating" integer,
    "review" "text",
    "is_favorite" boolean DEFAULT false,
    "watched_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_watched_archive_media_type_check" CHECK (("media_type" = ANY (ARRAY['movie'::"text", 'tv'::"text"]))),
    CONSTRAINT "user_watched_archive_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."user_watched_archive" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_watched_archive" IS 'Archive of watched movies/TV with ratings. Frontend enforces max 1000 items per user. See DATABASE_QUERY_LIMITS.md';



CREATE TABLE IF NOT EXISTS "public"."user_watchlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "external_id" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "poster_url" "text",
    "release_date" "text",
    "overview" "text",
    "director" "text",
    "cast_members" "text"[],
    "genres" "text"[],
    "vote_average" numeric(3,1),
    "vote_count" integer,
    "runtime" integer,
    "watched" boolean DEFAULT false,
    "list_order" integer,
    "notes" "text",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "watched_at" timestamp with time zone,
    CONSTRAINT "user_watchlist_media_type_check" CHECK (("media_type" = ANY (ARRAY['movie'::"text", 'tv'::"text"])))
);


ALTER TABLE "public"."user_watchlist" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_watchlist" IS 'Personal watchlist for movies and TV shows users want to watch';



COMMENT ON COLUMN "public"."user_watchlist"."external_id" IS 'TMDB movie or TV show ID';



COMMENT ON COLUMN "public"."user_watchlist"."watched" IS 'Whether the user has watched this item';



COMMENT ON COLUMN "public"."user_watchlist"."list_order" IS 'Order in list for drag-drop (future feature)';



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_user_id_friend_id_key" UNIQUE ("user_id", "friend_id");



ALTER TABLE ONLY "public"."invite_code_audit_log"
    ADD CONSTRAINT "invite_code_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movie_recommendations"
    ADD CONSTRAINT "movie_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."music_recommendations"
    ADD CONSTRAINT "music_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_watched_archive"
    ADD CONSTRAINT "user_watched_archive_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_watched_archive"
    ADD CONSTRAINT "user_watched_archive_user_id_external_id_key" UNIQUE ("user_id", "external_id");



ALTER TABLE ONLY "public"."user_watchlist"
    ADD CONSTRAINT "user_watchlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_watchlist"
    ADD CONSTRAINT "user_watchlist_user_id_external_id_key" UNIQUE ("user_id", "external_id");



CREATE INDEX "idx_audit_log_code_id" ON "public"."invite_code_audit_log" USING "btree" ("code_id");



CREATE INDEX "idx_audit_log_used_at" ON "public"."invite_code_audit_log" USING "btree" ("used_at" DESC);



CREATE INDEX "idx_connections_created_at" ON "public"."connections" USING "btree" ("created_at");



CREATE INDEX "idx_connections_friend_id" ON "public"."connections" USING "btree" ("friend_id");



CREATE INDEX "idx_connections_user_id" ON "public"."connections" USING "btree" ("user_id");



CREATE INDEX "idx_invite_audit_code_id" ON "public"."invite_code_audit_log" USING "btree" ("code_id");



CREATE INDEX "idx_invite_audit_used_by" ON "public"."invite_code_audit_log" USING "btree" ("used_by");



CREATE INDEX "idx_invite_codes_code" ON "public"."invite_codes" USING "btree" ("code");



CREATE INDEX "idx_invite_codes_created_by" ON "public"."invite_codes" USING "btree" ("created_by");



CREATE INDEX "idx_invite_codes_expires_at" ON "public"."invite_codes" USING "btree" ("expires_at");



CREATE INDEX "idx_invite_codes_intended_email" ON "public"."invite_codes" USING "btree" ("intended_email");



CREATE INDEX "idx_invite_codes_is_active" ON "public"."invite_codes" USING "btree" ("is_active");



CREATE INDEX "idx_invite_codes_used_by" ON "public"."invite_codes" USING "btree" ("used_by");



CREATE INDEX "idx_invite_codes_validation" ON "public"."invite_codes" USING "btree" ("code", "is_active", "expires_at", "current_uses", "max_uses");



CREATE INDEX "idx_movie_recs_created_at" ON "public"."movie_recommendations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_movie_recs_from_user" ON "public"."movie_recommendations" USING "btree" ("from_user_id");



CREATE INDEX "idx_movie_recs_from_user_created" ON "public"."movie_recommendations" USING "btree" ("from_user_id", "created_at" DESC);



CREATE INDEX "idx_movie_recs_media_type" ON "public"."movie_recommendations" USING "btree" ("media_type");



CREATE INDEX "idx_movie_recs_status" ON "public"."movie_recommendations" USING "btree" ("status");



CREATE INDEX "idx_movie_recs_to_user" ON "public"."movie_recommendations" USING "btree" ("to_user_id", "status");



CREATE INDEX "idx_movie_recs_to_user_created" ON "public"."movie_recommendations" USING "btree" ("to_user_id", "created_at" DESC);



CREATE INDEX "idx_movie_recs_to_user_status_created" ON "public"."movie_recommendations" USING "btree" ("to_user_id", "status", "created_at" DESC);



CREATE INDEX "idx_movie_recs_to_user_type_created" ON "public"."movie_recommendations" USING "btree" ("to_user_id", "media_type", "created_at" DESC);



CREATE INDEX "idx_movie_recs_year" ON "public"."movie_recommendations" USING "btree" ("year");



CREATE INDEX "idx_music_recs_created_at" ON "public"."music_recommendations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_music_recs_from_user" ON "public"."music_recommendations" USING "btree" ("from_user_id");



CREATE INDEX "idx_music_recs_from_user_created" ON "public"."music_recommendations" USING "btree" ("from_user_id", "created_at" DESC);



CREATE INDEX "idx_music_recs_media_type" ON "public"."music_recommendations" USING "btree" ("media_type");



CREATE INDEX "idx_music_recs_status" ON "public"."music_recommendations" USING "btree" ("status");



CREATE INDEX "idx_music_recs_to_user" ON "public"."music_recommendations" USING "btree" ("to_user_id", "status");



CREATE INDEX "idx_music_recs_to_user_created" ON "public"."music_recommendations" USING "btree" ("to_user_id", "created_at" DESC);



CREATE INDEX "idx_music_recs_to_user_status_created" ON "public"."music_recommendations" USING "btree" ("to_user_id", "status", "created_at" DESC);



CREATE INDEX "idx_music_recs_to_user_type_created" ON "public"."music_recommendations" USING "btree" ("to_user_id", "media_type", "created_at" DESC);



CREATE INDEX "idx_user_profiles_display_name" ON "public"."user_profiles" USING "btree" ("display_name");



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_is_admin" ON "public"."user_profiles" USING "btree" ("is_admin") WHERE ("is_admin" = true);



CREATE INDEX "idx_user_watched_archive_external_id" ON "public"."user_watched_archive" USING "btree" ("external_id");



CREATE INDEX "idx_user_watched_archive_favorites" ON "public"."user_watched_archive" USING "btree" ("user_id", "is_favorite") WHERE ("is_favorite" = true);



CREATE INDEX "idx_user_watched_archive_rating" ON "public"."user_watched_archive" USING "btree" ("user_id", "rating" DESC) WHERE ("rating" IS NOT NULL);



CREATE INDEX "idx_user_watched_archive_user_date" ON "public"."user_watched_archive" USING "btree" ("user_id", "watched_at" DESC);



CREATE INDEX "idx_user_watched_archive_user_id" ON "public"."user_watched_archive" USING "btree" ("user_id");



CREATE INDEX "idx_user_watched_rating_filter" ON "public"."user_watched_archive" USING "btree" ("user_id", "rating") WHERE ("rating" IS NOT NULL);



CREATE INDEX "idx_watchlist_added_at" ON "public"."user_watchlist" USING "btree" ("user_id", "added_at" DESC);



CREATE INDEX "idx_watchlist_external_id" ON "public"."user_watchlist" USING "btree" ("external_id");



CREATE INDEX "idx_watchlist_media_type" ON "public"."user_watchlist" USING "btree" ("media_type");



CREATE INDEX "idx_watchlist_user_added" ON "public"."user_watchlist" USING "btree" ("user_id", "added_at" DESC);



CREATE INDEX "idx_watchlist_user_external" ON "public"."user_watchlist" USING "btree" ("user_id", "external_id");



CREATE INDEX "idx_watchlist_user_id" ON "public"."user_watchlist" USING "btree" ("user_id");



CREATE INDEX "idx_watchlist_user_watched" ON "public"."user_watchlist" USING "btree" ("user_id", "watched");



CREATE INDEX "idx_watchlist_user_watched_added" ON "public"."user_watchlist" USING "btree" ("user_id", "watched", "added_at" DESC);



CREATE OR REPLACE TRIGGER "check_is_admin_change" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_is_admin_change"();



CREATE OR REPLACE TRIGGER "enforce_admin_escalation_update" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_admin_escalation_update"();



CREATE OR REPLACE TRIGGER "enforce_admin_self_grant_protection" BEFORE INSERT ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_admin_self_grant"();



CREATE OR REPLACE TRIGGER "enforce_super_admin_protection" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_super_admin_revoke"();



CREATE OR REPLACE TRIGGER "update_movie_rec_watched_at_trigger" BEFORE UPDATE ON "public"."movie_recommendations" FOR EACH ROW EXECUTE FUNCTION "public"."update_movie_rec_watched_at"();



CREATE OR REPLACE TRIGGER "update_music_rec_consumed_at_trigger" BEFORE UPDATE ON "public"."music_recommendations" FOR EACH ROW EXECUTE FUNCTION "public"."update_music_rec_consumed_at"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at_trigger" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_watched_archive_updated_at" BEFORE UPDATE ON "public"."user_watched_archive" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_watchlist_updated_at_trigger" BEFORE UPDATE ON "public"."user_watchlist" FOR EACH ROW EXECUTE FUNCTION "public"."update_watchlist_updated_at"();



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invite_code_audit_log"
    ADD CONSTRAINT "invite_code_audit_log_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movie_recommendations"
    ADD CONSTRAINT "movie_recommendations_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."movie_recommendations"
    ADD CONSTRAINT "movie_recommendations_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."music_recommendations"
    ADD CONSTRAINT "music_recommendations_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."music_recommendations"
    ADD CONSTRAINT "music_recommendations_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_watchlist"
    ADD CONSTRAINT "user_watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can create invite codes" ON "public"."invite_codes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Admins can delete audit logs" ON "public"."invite_code_audit_log" FOR DELETE TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



COMMENT ON POLICY "Admins can delete audit logs" ON "public"."invite_code_audit_log" IS 'Allows admin users to delete audit log entries for cleanup, GDPR compliance, or testing.
   Uses is_admin() helper function to check admin status.';



CREATE POLICY "Admins can delete invite codes" ON "public"."invite_codes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Admins can update any profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));



COMMENT ON POLICY "Admins can update any profile" ON "public"."user_profiles" IS 'Admin users can update any profile, including granting/revoking admin. Super admin protected by separate trigger.';



CREATE POLICY "Admins can update audit logs" ON "public"."invite_code_audit_log" FOR UPDATE TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



COMMENT ON POLICY "Admins can update audit logs" ON "public"."invite_code_audit_log" IS 'Allows admin users to update audit log entries for corrections or cleanup.
   Uses is_admin() helper function to check admin status.';



CREATE POLICY "Admins can update invite codes" ON "public"."invite_codes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));



CREATE POLICY "Admins can view audit logs" ON "public"."invite_code_audit_log" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Anyone can read config" ON "public"."app_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can validate invite codes" ON "public"."invite_codes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view profiles" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Only admins can modify config" ON "public"."app_config" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "Recipients can update their recommendations" ON "public"."movie_recommendations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "to_user_id")) WITH CHECK (("auth"."uid"() = "to_user_id"));



CREATE POLICY "Recipients can update their recommendations" ON "public"."music_recommendations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "to_user_id")) WITH CHECK (("auth"."uid"() = "to_user_id"));



CREATE POLICY "Senders can delete recommendations they sent" ON "public"."movie_recommendations" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Senders can delete recommendations they sent" ON "public"."music_recommendations" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Senders can update their notes" ON "public"."movie_recommendations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "from_user_id")) WITH CHECK (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Senders can update their notes" ON "public"."music_recommendations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "from_user_id")) WITH CHECK (("auth"."uid"() = "from_user_id"));



CREATE POLICY "System can insert audit logs" ON "public"."invite_code_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can add to their own watchlist" ON "public"."user_watchlist" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create connections" ON "public"."connections" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can delete from own archive" ON "public"."user_watched_archive" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete from their own watchlist" ON "public"."user_watchlist" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own profile" ON "public"."user_profiles" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own connections" ON "public"."connections" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can insert into own archive" ON "public"."user_watched_archive" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can send recommendations" ON "public"."movie_recommendations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Users can send recommendations" ON "public"."music_recommendations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Users can update own archive" ON "public"."user_watched_archive" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



COMMENT ON POLICY "Users can update own profile" ON "public"."user_profiles" IS 'Users can attempt to update their own profile. Trigger prevents is_admin changes by non-admins.';



CREATE POLICY "Users can update their own connections" ON "public"."connections" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id"))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can update their own watchlist" ON "public"."user_watchlist" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own archive" ON "public"."user_watched_archive" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view recommendations sent to them" ON "public"."movie_recommendations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "to_user_id"));



CREATE POLICY "Users can view recommendations sent to them" ON "public"."music_recommendations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "to_user_id"));



CREATE POLICY "Users can view recommendations they sent" ON "public"."movie_recommendations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Users can view recommendations they sent" ON "public"."music_recommendations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Users can view their own connections" ON "public"."connections" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can view their own watchlist" ON "public"."user_watchlist" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "__is_admin_helper_policy__" ON "public"."user_profiles" FOR SELECT TO "npc_service_role" USING (true);



COMMENT ON POLICY "__is_admin_helper_policy__" ON "public"."user_profiles" IS 'Allows SECURITY DEFINER functions owned by npc_service_role to read user_profiles under FORCE RLS.
   
SECURITY CONTEXT:
  - FORCE RLS means even privileged roles require explicit policy grants
  - This policy grants access ONLY to npc_service_role (not postgres superuser)
  - Supabase client connections use authenticated/anon roles via JWT (never npc_service_role)
  - All SECURITY DEFINER functions have fixed search_path to prevent schema hijacking
  
DEFENSE-IN-DEPTH IMPROVEMENTS:
  - npc_service_role has NO LOGIN capability (cannot be used for direct connections)
  - npc_service_role has minimal table privileges (SELECT on user_profiles, INSERT on connections, etc.)
  - npc_service_role is NOT a superuser (limited blast radius vs postgres role)
  - Functions owned by npc_service_role can only access tables explicitly granted
  
BOUNDARIES:
  - npc_service_role access limited to: SECURITY DEFINER function execution only
  - Client applications use authenticated/anon roles (connection string uses ANON_KEY)
  - postgres role still used for: dashboard admins and migrations (not function execution)
  - Functions should query minimal columns to reduce data exposure
  
Without this policy, is_admin() and other admin check functions would fail under FORCE RLS.';



ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invite_code_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invite_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."movie_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."music_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_watched_archive" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_watchlist" ENABLE ROW LEVEL SECURITY;


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "npc_service_role";



GRANT ALL ON FUNCTION "public"."batch_connect_users"("user_ids" "uuid"[]) TO "authenticated";



GRANT ALL ON FUNCTION "public"."consume_invite_code"("code_value" "text", "user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."is_admin"("check_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"("check_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."prevent_admin_escalation_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prevent_admin_escalation_update"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."prevent_admin_self_grant"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prevent_admin_self_grant"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."validate_invite_code"("code_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_invite_code"("code_value" "text") TO "anon";



GRANT ALL ON FUNCTION "public"."validate_invite_code"("code_value" "text", "user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_invite_code"("code_value" "text", "user_email" "text") TO "anon";



GRANT SELECT ON TABLE "public"."app_config" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."connections" TO "authenticated";
GRANT INSERT ON TABLE "public"."connections" TO "npc_service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."invite_code_audit_log" TO "authenticated";
GRANT INSERT ON TABLE "public"."invite_code_audit_log" TO "npc_service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."invite_codes" TO "authenticated";
GRANT SELECT,UPDATE ON TABLE "public"."invite_codes" TO "npc_service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."movie_recommendations" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_profiles" TO "authenticated";
GRANT SELECT,UPDATE ON TABLE "public"."user_profiles" TO "npc_service_role";



GRANT SELECT ON TABLE "public"."movie_recommendations_with_users" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."music_recommendations" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_watched_archive" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_watchlist" TO "authenticated";




RESET ALL;
