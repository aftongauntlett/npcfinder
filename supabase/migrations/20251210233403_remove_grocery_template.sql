-- Remove grocery template type from task boards
-- This migration safely removes grocery functionality from the database

-- Step 1: Update any existing grocery boards to 'custom' type
UPDATE task_boards 
SET template_type = 'custom' 
WHERE template_type = 'grocery';

-- Step 2: Update the CHECK constraint to remove 'grocery'
ALTER TABLE task_boards 
DROP CONSTRAINT IF EXISTS task_boards_template_type_check;

ALTER TABLE task_boards 
ADD CONSTRAINT task_boards_template_type_check 
CHECK (template_type = ANY (ARRAY['job_tracker'::text, 'markdown'::text, 'recipe'::text, 'kanban'::text, 'custom'::text]));

-- Step 3: Update ensure_singleton_board function to remove grocery
CREATE OR REPLACE FUNCTION ensure_singleton_board(p_user_id uuid, p_template_type text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board_id uuid;
  v_board_name text;
BEGIN
  -- Map template type to board name
  v_board_name := CASE p_template_type
    WHEN 'job_tracker' THEN 'Job Applications'
    WHEN 'recipe' THEN 'Recipes'
    ELSE p_template_type
  END;

  -- Check if singleton board already exists
  SELECT id INTO v_board_id
  FROM task_boards
  WHERE user_id = p_user_id
    AND template_type = p_template_type
  LIMIT 1;

  -- Create if doesn't exist
  IF v_board_id IS NULL THEN
    INSERT INTO task_boards (user_id, name, template_type, board_type)
    VALUES (p_user_id, v_board_name, p_template_type, 'list')
    RETURNING id INTO v_board_id;
  END IF;

  RETURN v_board_id;
END;
$$;

COMMENT ON FUNCTION ensure_singleton_board IS 'Ensures a singleton board exists for global collection types (job_tracker, recipe). Called explicitly by application code. Uses search_path = public for security.';
