-- Get singleton board IDs for current user
-- Run this in Supabase SQL Editor to find your board IDs
-- Replace YOUR_USER_ID with your actual user ID from auth.users

SELECT 
  template_type,
  id as board_id,
  name
FROM task_boards
WHERE user_id = 'YOUR_USER_ID'::uuid
  AND template_type IN ('job_tracker', 'recipe', 'grocery')
ORDER BY template_type;
