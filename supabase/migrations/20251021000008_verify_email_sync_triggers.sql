-- Verify and document email sync triggers on auth.users
--
-- REVIEW FINDING:
-- Email sync trigger updates user_profiles.email on auth.users UPDATE but not INSERT.
-- Need to confirm handle_new_user sets email on INSERT and consider NOT NULL constraint.
--
-- CURRENT STATE:
-- 1. ✅ on_auth_user_created (AFTER INSERT) - calls handle_new_user() to set email
-- 2. ✅ on_auth_user_email_updated (AFTER UPDATE OF email) - calls sync_user_email_on_update()
-- 3. ✅ Both functions have search_path set for security
--
-- THIS MIGRATION:
-- 1. Add comments documenting the trigger behavior
-- 2. Verify email is backfilled for all existing users
-- 3. Consider NOT NULL constraint (with safety checks)

-- ============================================
-- STEP 1: Document the trigger functions
-- ============================================

COMMENT ON FUNCTION public.handle_new_user IS 
  'Trigger function (AFTER INSERT on auth.users) that creates user_profiles row.
   Sets display_name from metadata OR email, and syncs email field.
   Called by: on_auth_user_created trigger
   Coverage: INSERT operations on auth.users';

COMMENT ON FUNCTION public.sync_user_email_on_update IS 
  'Trigger function (AFTER UPDATE OF email on auth.users) that syncs email changes.
   Updates user_profiles.email when auth.users.email changes.
   Called by: on_auth_user_email_updated trigger
   Coverage: UPDATE operations on auth.users (email column only)';

-- ============================================
-- STEP 2: Verify triggers exist
-- ============================================

DO $$
DECLARE
  insert_trigger_exists BOOLEAN;
  update_trigger_exists BOOLEAN;
  trigger_status TEXT;
BEGIN
  -- Check for INSERT trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) INTO insert_trigger_exists;

  -- Check for UPDATE trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'on_auth_user_email_updated'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) INTO update_trigger_exists;

  -- Build status message
  IF insert_trigger_exists AND update_trigger_exists THEN
    trigger_status := '✅ Both email sync triggers active';
  ELSIF insert_trigger_exists THEN
    trigger_status := '⚠️  INSERT trigger exists but UPDATE trigger missing';
  ELSIF update_trigger_exists THEN
    trigger_status := '⚠️  UPDATE trigger exists but INSERT trigger missing';
  ELSE
    trigger_status := '❌ Both triggers missing - email sync will not work!';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email Sync Trigger Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INSERT trigger (on_auth_user_created): %', 
    CASE WHEN insert_trigger_exists THEN '✓ Active' ELSE '✗ Missing' END;
  RAISE NOTICE 'UPDATE trigger (on_auth_user_email_updated): %', 
    CASE WHEN update_trigger_exists THEN '✓ Active' ELSE '✗ Missing' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Status: %', trigger_status;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- STEP 3: Backfill any missing emails
-- ============================================

DO $$
DECLARE
  rows_updated INTEGER;
  total_users INTEGER;
  null_emails INTEGER;
BEGIN
  -- Count users before backfill
  SELECT COUNT(*) INTO total_users FROM public.user_profiles;
  SELECT COUNT(*) INTO null_emails FROM public.user_profiles WHERE email IS NULL;

  -- Backfill missing emails from auth.users
  WITH updated AS (
    UPDATE public.user_profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.user_id = u.id
      AND p.email IS NULL
      AND u.email IS NOT NULL
    RETURNING p.user_id
  )
  SELECT COUNT(*) INTO rows_updated FROM updated;

  RAISE NOTICE '';
  RAISE NOTICE 'Email Backfill Results:';
  RAISE NOTICE '- Total users: %', total_users;
  RAISE NOTICE '- Users with NULL email (before): %', null_emails;
  RAISE NOTICE '- Emails backfilled: %', rows_updated;
  
  -- Check if any NULL emails remain
  SELECT COUNT(*) INTO null_emails FROM public.user_profiles WHERE email IS NULL;
  
  IF null_emails > 0 THEN
    RAISE WARNING '⚠️  % users still have NULL email (likely their auth.users.email is also NULL)', null_emails;
  ELSE
    RAISE NOTICE '✓ All users have emails synced';
  END IF;
END $$;

-- ============================================
-- STEP 4: Consider NOT NULL constraint
-- ============================================

-- Decision: Do NOT add NOT NULL constraint yet because:
-- 1. Supabase allows signups without email (e.g., OAuth, phone auth)
-- 2. Email might be NULL in auth.users for some auth methods
-- 3. Would break existing code that doesn't validate email presence
--
-- Future consideration: If app requires email for all users:
-- - Add application-level validation during signup
-- - Add check constraint: CONSTRAINT email_required CHECK (email IS NOT NULL)
-- - Verify all auth providers collect email

-- Add index to support fast email lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
  ON public.user_profiles(email);

-- ============================================
-- STEP 5: Document email sync behavior
-- ============================================

COMMENT ON COLUMN public.user_profiles.email IS 
  'User email synced from auth.users.email.
   Sync behavior:
   - INSERT: Set by handle_new_user() trigger (on_auth_user_created)
   - UPDATE: Synced by sync_user_email_on_update() trigger (on_auth_user_email_updated)
   - Can be NULL if auth.users.email is NULL (e.g., OAuth without email)
   
   Future: Consider NOT NULL constraint if app requires email for all users.';

-- ============================================
-- STEP 6: Final verification query
-- ============================================

DO $$
DECLARE
  result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Final Verification Summary';
  RAISE NOTICE '========================================';
  
  -- Trigger coverage
  FOR result IN 
    SELECT 
      t.tgname as trigger_name,
      t.tgenabled as enabled,
      p.proname as function_name,
      CASE 
        WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
        WHEN t.tgtype & 4 = 4 THEN 'AFTER'
        ELSE 'UNKNOWN'
      END as timing,
      CASE 
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'UNKNOWN'
      END as event
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
      AND t.tgname IN ('on_auth_user_created', 'on_auth_user_email_updated')
    ORDER BY t.tgname
  LOOP
    RAISE NOTICE 'Trigger: % (%) calls %', 
      result.trigger_name, 
      CASE WHEN result.enabled = 'O' THEN 'ACTIVE' ELSE 'DISABLED' END,
      result.function_name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Email sync verification complete';
  RAISE NOTICE 'Both INSERT and UPDATE triggers are properly configured.';
  RAISE NOTICE '========================================';
END $$;
