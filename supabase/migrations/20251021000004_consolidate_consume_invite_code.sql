-- Drop legacy consume_invite_code(text) function and consolidate to single implementation
-- 
-- ISSUE:
-- Two consume_invite_code overloads exist with conflicting semantics:
-- 1. consume_invite_code(text) - returns json, uses non-existent 'uses' column, inserts audit log
-- 2. consume_invite_code(text, uuid) - returns boolean, uses 'current_uses' column, no audit log
--
-- SOLUTION:
-- - Drop the legacy (text) version
-- - Update the (text, uuid) version to include audit logging
-- - Ensure it uses current_uses column consistently
-- - Add proper indexes for performance

-- Step 1: Drop the legacy function that references non-existent 'uses' column
DROP FUNCTION IF EXISTS public.consume_invite_code(text);

-- Step 2: Update the current function to include audit logging and full functionality
CREATE OR REPLACE FUNCTION public.consume_invite_code(code_value text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Step 3: Ensure indexes exist for optimal performance
-- Index on code for fast lookups (should already exist from original migration)
CREATE INDEX IF NOT EXISTS idx_invite_codes_code 
ON public.invite_codes(code);

-- Index on is_active for filtering active codes
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_active 
ON public.invite_codes(is_active);

-- Index on expires_at for expiration checks
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at 
ON public.invite_codes(expires_at);

-- Composite index for the common query pattern (code validation)
CREATE INDEX IF NOT EXISTS idx_invite_codes_validation 
ON public.invite_codes(code, is_active, expires_at, current_uses, max_uses);

-- Index on audit log for querying usage by code
CREATE INDEX IF NOT EXISTS idx_invite_audit_code_id 
ON public.invite_code_audit_log(code_id);

-- Index on audit log for querying usage by user
CREATE INDEX IF NOT EXISTS idx_invite_audit_used_by 
ON public.invite_code_audit_log(used_by);

-- Step 4: Update function comment to reflect current implementation
COMMENT ON FUNCTION public.consume_invite_code(text, uuid) IS 
'Consumes an invite code for user registration. 
Features:
- Validates user_id matches authenticated caller (security)
- Uses row-level locking to prevent race conditions
- Increments current_uses counter
- Sets used_by and used_at on first use
- Inserts audit log entry for all usages
- Returns true on success, false if code invalid/expired/maxed out';

-- Step 5: Verify audit log table exists and has correct structure
-- If this fails, the audit log table needs to be created first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invite_code_audit_log'
    ) THEN
        RAISE EXCEPTION 'invite_code_audit_log table does not exist. Create it before running this migration.';
    END IF;
END $$;

-- Verification query (run after migration):
-- SELECT 
--   p.proname,
--   pg_get_function_arguments(p.oid) as arguments,
--   pg_get_function_result(p.oid) as returns,
--   p.prosrc LIKE '%audit_log%' as has_audit_logging
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
--   AND p.proname = 'consume_invite_code'
-- ORDER BY p.oid;
