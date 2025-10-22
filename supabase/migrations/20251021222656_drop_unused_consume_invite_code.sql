-- Migration: Drop unused consume_invite_code(text) function
-- Date: 2025-10-21
-- Description: Remove dead code - JSON-returning variant of consume_invite_code
--              that is not used by the frontend.
--
-- Context:
-- There are two overloaded versions of consume_invite_code:
-- 1. consume_invite_code(text) → json (OLD, UNUSED)
-- 2. consume_invite_code(text, uuid) → boolean (CURRENT, USED)
--
-- The frontend (src/lib/inviteCodes.ts) only calls the (text, uuid) variant
-- with parameters: code_value and user_id
--
-- The JSON-returning variant is leftover from an earlier implementation
-- and should be removed to avoid confusion and reduce attack surface.

-- =====================================================
-- Drop the unused JSON-returning function
-- =====================================================

DROP FUNCTION IF EXISTS public.consume_invite_code(text);

-- =====================================================
-- Verification
-- =====================================================

-- After running this migration, verify only one version exists:
-- 
-- SELECT 
--   p.proname as function_name,
--   pg_get_function_arguments(p.oid) as arguments,
--   pg_get_function_result(p.oid) as return_type
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
-- AND p.proname = 'consume_invite_code';
--
-- Expected result:
-- function_name         | arguments                       | return_type
-- consume_invite_code   | code_value text, user_id uuid   | boolean

-- =====================================================
-- Security Impact
-- =====================================================
--
-- POSITIVE: Reduces attack surface by removing unused code path
-- NO BREAKING CHANGES: Frontend only uses the (text, uuid) variant
