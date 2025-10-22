-- Fix SECURITY DEFINER functions missing search_path to prevent schema hijacking attacks
-- Each function needs a fixed search_path to prevent malicious schema injection

-- 1. Fix consume_invite_code(text, uuid) - needs auth schema access
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
    
    -- Check if code exists and is valid (without email validation)
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
    
    -- Get the invite code record with row lock
    SELECT * INTO invite_record
    FROM public.invite_codes
    WHERE code = code_value
    FOR UPDATE;
    
    -- Update the code
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
    
    RETURN true;
END;
$$;

-- 2. Fix create_bidirectional_connection - only uses public schema
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

-- 3. Fix handle_new_user - needs auth schema access for NEW.raw_user_meta_data
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

-- 4. Fix prevent_is_admin_change - needs auth schema access
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

-- 5. Fix prevent_super_admin_revoke - only uses public schema
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

-- 6. Fix sync_user_email_on_update - only uses public schema
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

-- Verification query to check search_path is set for all SECURITY DEFINER functions
-- Run this after migration to verify:
-- SELECT 
--   p.proname as function_name,
--   p.prosecdef as is_security_definer,
--   p.proconfig as search_path_setting
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
--   AND p.prosecdef = true
-- ORDER BY p.proname;
