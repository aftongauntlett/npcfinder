-- Migration: Fix search_path security issue in singleton board functions
-- Purpose: Add search_path = public to SECURITY DEFINER functions to prevent schema poisoning attacks
-- Reference: Supabase Security Advisor warnings

-- Recreate ensure_singleton_board with proper search_path
CREATE OR REPLACE FUNCTION ensure_singleton_board(
  p_user_id uuid,
  p_template_type text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Recreate auto_assign_singleton_board with proper search_path
CREATE OR REPLACE FUNCTION auto_assign_singleton_board()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board_template text;
  v_board_id uuid;
BEGIN
  -- Only auto-assign if board_id is NULL and collection_type is singleton
  IF NEW.board_id IS NULL AND NEW.collection_type IN ('job_tracker', 'recipe', 'grocery') THEN
    
    -- Map collection_type to template_type
    v_board_template := NEW.collection_type;
    
    -- Ensure the singleton board exists and get its ID
    v_board_id := ensure_singleton_board(NEW.user_id, v_board_template);
    
    -- Assign the board to this task
    NEW.board_id := v_board_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION ensure_singleton_board IS 'Ensures a singleton board exists for global collection types (job_tracker, recipe, grocery). Returns the board ID. Uses search_path = public for security.';
COMMENT ON FUNCTION auto_assign_singleton_board IS 'Trigger function to auto-assign singleton board when task is created. Uses search_path = public for security.';
