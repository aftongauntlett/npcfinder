-- Migration: Debug - show exact INSERT policy and test it
-- Date: 2025-12-14

-- This will show us the exact policy definition
DO $$
DECLARE
  policy_def text;
BEGIN
  SELECT with_check INTO policy_def
  FROM pg_policies 
  WHERE tablename = 'task_boards' 
    AND policyname = 'task_boards_insert';
  
  RAISE NOTICE 'Current INSERT policy WITH CHECK clause: %', policy_def;
END $$;
