-- Backfill invite codes that were used but not marked properly
-- This handles codes where a user exists but the code isn't marked as consumed

DO $$
DECLARE
    code_record RECORD;
    user_record RECORD;
BEGIN
    -- Find codes that have intended_email but no used_by
    FOR code_record IN 
        SELECT * FROM public.invite_codes 
        WHERE intended_email IS NOT NULL 
        AND used_by IS NULL
        AND is_active = true
    LOOP
        -- Try to find a user with this email in user_profiles
        SELECT user_id, created_at INTO user_record
        FROM public.user_profiles
        WHERE LOWER(email) = LOWER(code_record.intended_email)
        AND created_at >= code_record.created_at -- User created after code
        ORDER BY created_at
        LIMIT 1;

        -- If we found a matching user, mark the code as used
        IF user_record.user_id IS NOT NULL THEN
            UPDATE public.invite_codes
            SET 
                used_by = user_record.user_id,
                used_at = user_record.created_at,
                current_uses = 1
            WHERE id = code_record.id;

            RAISE NOTICE 'Marked code % as used by % (email: %)', 
                code_record.code, user_record.user_id, code_record.intended_email;
        END IF;
    END LOOP;
END $$;

-- Show the results
SELECT 
    code,
    intended_email,
    used_by,
    used_at,
    current_uses,
    is_active
FROM public.invite_codes
WHERE intended_email IS NOT NULL
ORDER BY created_at DESC;
