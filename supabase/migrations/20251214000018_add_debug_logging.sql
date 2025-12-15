-- Migration: Add logging to debug task_boards_insert policy
-- Date: 2025-12-14
-- Purpose: Temporarily add logging to see why INSERT is failing

-- Create a logging function
CREATE OR REPLACE FUNCTION public.log_task_board_insert_check()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'INSERT CHECK: user_id=%, auth.uid()=%, is_admin=%', 
    NEW.user_id, 
    auth.uid(), 
    public.is_admin(auth.uid());
  RETURN NEW;
END;
$$;

-- Add trigger to log before RLS check
DROP TRIGGER IF EXISTS log_task_board_insert_trigger ON task_boards;
CREATE TRIGGER log_task_board_insert_trigger
  BEFORE INSERT ON task_boards
  FOR EACH ROW
  EXECUTE FUNCTION log_task_board_insert_check();
