-- Fix Duplicate User Profiles Issue
-- Date: 2025-10-13
-- Purpose: Clean up duplicate user_profiles records and ensure unique constraint
-- 
-- IMPORTANT: This is a one-time migration. Run each step separately!
-- Supabase will warn about destructive operations - this is intentional.

-- ============================================
-- STEP 1: INSPECT DUPLICATES (READ-ONLY)
-- ============================================
-- Run this first to see if you have duplicates
-- This is safe - it only reads data

SELECT 
  user_id, 
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY updated_at DESC) as profile_ids
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- ============================================
-- STEP 2: PREVIEW WHAT WILL BE DELETED (READ-ONLY)
-- ============================================
-- This shows which records will be deleted (all but the most recent)
-- Review this carefully before proceeding!

SELECT 
  id,
  user_id,
  display_name,
  created_at,
  updated_at,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) as row_num
FROM user_profiles
WHERE user_id IN (
  SELECT user_id 
  FROM user_profiles 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
)
ORDER BY user_id, row_num;

-- Records with row_num > 1 will be deleted

-- ============================================
-- STEP 3: DELETE DUPLICATES (DESTRUCTIVE!)
-- ============================================
-- ⚠️ WARNING: This will permanently delete duplicate records
-- Supabase will ask you to confirm - click "Run this query"
-- 
-- This keeps only the MOST RECENT profile for each user_id

DELETE FROM user_profiles
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      user_id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC, created_at DESC) as row_num
    FROM user_profiles
  ) sub
  WHERE row_num > 1
);

-- After running, you should see: "DELETE X" where X is the number of duplicates removed

-- ============================================
-- STEP 4: ADD UNIQUE CONSTRAINT (SAFE)
-- ============================================
-- Ensure the unique constraint exists to prevent future duplicates
-- If this fails with "already exists", that's fine - skip it

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

-- ============================================
-- STEP 5: VERIFY THE FIX (READ-ONLY)
-- ============================================
-- Confirm no duplicates remain

SELECT user_id, COUNT(*) as count
FROM user_profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Should return 0 rows

-- View all profiles to confirm they look correct
SELECT 
  id,
  user_id, 
  display_name, 
  created_at, 
  updated_at
FROM user_profiles
ORDER BY created_at DESC;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- If you see no duplicates in Step 5, you're done!
-- The app should now be able to update profiles without 409 errors.
