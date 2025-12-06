-- Migration: Auto-create singleton boards for global collection types
-- Purpose: Job tracker, recipes, and grocery lists should be global collections (one per user)
-- Rather than requiring explicit board creation

-- Function to ensure a singleton board exists for a user and template type
CREATE OR REPLACE FUNCTION ensure_singleton_board(
  p_user_id uuid,
  p_template_type text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_board_id uuid;
  v_board_name text;
BEGIN
  -- Determine board name based on template type
  v_board_name := CASE p_template_type
    WHEN 'job_tracker' THEN 'Job Applications'
    WHEN 'recipe' THEN 'Recipes'
    WHEN 'grocery' THEN 'Grocery List'
    ELSE p_template_type
  END;

  -- Check if board already exists
  SELECT id INTO v_board_id
  FROM task_boards
  WHERE user_id = p_user_id
    AND template_type = p_template_type
  LIMIT 1;

  -- If not found, create it
  IF v_board_id IS NULL THEN
    INSERT INTO task_boards (user_id, name, template_type, created_at, updated_at)
    VALUES (p_user_id, v_board_name, p_template_type, NOW(), NOW())
    RETURNING id INTO v_board_id;
  END IF;

  RETURN v_board_id;
END;
$$;

-- Trigger function to auto-assign singleton board when task is created
CREATE OR REPLACE FUNCTION auto_assign_singleton_board()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_board_template text;
BEGIN
  -- Only process if board_id is NULL (new task without board assignment)
  IF NEW.board_id IS NULL THEN
    -- Determine template type from item_data or context
    -- For now, we'll need the application to set board_id explicitly
    -- This trigger serves as a safety net for direct SQL inserts
    RETURN NEW;
  END IF;

  -- If board_id is set, verify it's a singleton for global types
  SELECT template_type INTO v_board_template
  FROM task_boards
  WHERE id = NEW.board_id;

  -- For singleton types, ensure user doesn't have multiple boards
  IF v_board_template IN ('job_tracker', 'recipe', 'grocery') THEN
    -- Update board_id to the canonical singleton board
    SELECT id INTO NEW.board_id
    FROM task_boards
    WHERE user_id = NEW.user_id
      AND template_type = v_board_template
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS auto_assign_singleton_board_trigger ON tasks;
CREATE TRIGGER auto_assign_singleton_board_trigger
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_singleton_board();

-- Create singleton boards for all existing users
DO $$
DECLARE
  v_user_record RECORD;
BEGIN
  FOR v_user_record IN SELECT DISTINCT user_id FROM user_profiles LOOP
    -- Create job tracker board
    PERFORM ensure_singleton_board(v_user_record.user_id, 'job_tracker');
    
    -- Create recipe board
    PERFORM ensure_singleton_board(v_user_record.user_id, 'recipe');
    
    -- Create grocery board
    PERFORM ensure_singleton_board(v_user_record.user_id, 'grocery');
  END LOOP;
END;
$$;

-- Add comment to explain the function
COMMENT ON FUNCTION ensure_singleton_board IS 'Ensures a singleton board exists for global collection types (job_tracker, recipe, grocery). Returns the board ID.';
