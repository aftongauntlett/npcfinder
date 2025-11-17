-- Backfill invite codes with user information
-- This fixes invite codes that were "used" but not marked as such because the consume function was broken

-- The issue: Users signed up with invite codes, but the consume_invite_code function
-- was failing (trying to insert into non-existent audit_log table), so the codes
-- were never marked as used.

-- Solution: Match users to invite codes based on timing
-- If a user was created shortly after an invite code was created,
-- and that code has current_uses = 0, mark it as used by that user.

DO $$
DECLARE
    code_record RECORD;
    potential_user RECORD;
BEGIN
    -- Loop through all invite codes that appear unused
    FOR code_record IN 
        SELECT * FROM public.invite_codes 
        WHERE used_by IS NULL 
        AND is_active = true
        ORDER BY created_at
    LOOP
        -- Find a user who:
        -- 1. Was created AFTER this invite code was created
        -- 2. Is NOT the creator of the code
        -- 3. Was created within 7 days of the code creation (reasonable redemption window)
        SELECT up.user_id INTO potential_user
        FROM public.user_profiles up
        WHERE up.user_id != COALESCE(code_record.created_by, '00000000-0000-0000-0000-000000000000')
        AND up.created_at >= code_record.created_at
        AND up.created_at <= code_record.created_at + INTERVAL '7 days'
        ORDER BY up.created_at
        LIMIT 1;

        -- If we found a matching user, update the invite code
        IF potential_user.user_id IS NOT NULL THEN
            UPDATE public.invite_codes
            SET 
                used_by = potential_user.user_id,
                used_at = (SELECT created_at FROM public.user_profiles WHERE user_id = potential_user.user_id),
                current_uses = 1
            WHERE id = code_record.id;

            RAISE NOTICE 'Updated invite code % with user %', code_record.code, potential_user.user_id;
        END IF;
    END LOOP;
END $$;

-- Verify the results
SELECT 
    ic.code,
    ic.created_by,
    ic.used_by,
    ic.used_at,
    ic.current_uses,
    up_creator.email as created_by_email,
    up_user.email as used_by_email
FROM public.invite_codes ic
LEFT JOIN public.user_profiles up_creator ON ic.created_by = up_creator.user_id
LEFT JOIN public.user_profiles up_user ON ic.used_by = up_user.user_id
WHERE ic.is_active = true
ORDER BY ic.created_at DESC;
