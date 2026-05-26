-- Remove all job applications data and disable job_tracker template support.
-- This migration is destructive by design and intentionally deletes all job-related data.

-- Step 1: Delete all data tied to job_tracker boards.
DELETE FROM tasks
WHERE section_id IN (
  SELECT s.id
  FROM task_board_sections s
  INNER JOIN task_boards b ON b.id = s.board_id
  WHERE b.template_type = 'job_tracker'
);

DELETE FROM tasks
WHERE board_id IN (
  SELECT id
  FROM task_boards
  WHERE template_type = 'job_tracker'
);

DELETE FROM task_board_members
WHERE board_id IN (
  SELECT id
  FROM task_boards
  WHERE template_type = 'job_tracker'
);

DELETE FROM task_board_sections
WHERE board_id IN (
  SELECT id
  FROM task_boards
  WHERE template_type = 'job_tracker'
);

DELETE FROM task_boards
WHERE template_type = 'job_tracker';

-- Step 2: Remove job_tracker from the template_type CHECK constraint.
ALTER TABLE task_boards
DROP CONSTRAINT IF EXISTS task_boards_template_type_check;

ALTER TABLE task_boards
ADD CONSTRAINT task_boards_template_type_check
CHECK (
  template_type = ANY (
    ARRAY[
      'markdown'::text,
      'recipe'::text,
      'kanban'::text,
      'custom'::text
    ]
  )
);

-- Step 3: Recreate singleton helper without job_tracker support.
CREATE OR REPLACE FUNCTION ensure_singleton_board(p_user_id uuid, p_template_type text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board_id uuid;
  v_board_name text;
  v_board_exists boolean;
BEGIN
  IF p_template_type NOT IN ('recipe', 'kanban') THEN
    RAISE EXCEPTION 'Unsupported singleton template type: %', p_template_type;
  END IF;

  v_board_name := CASE p_template_type
    WHEN 'recipe' THEN 'Recipes'
    WHEN 'kanban' THEN 'Kanban Board'
    ELSE p_template_type
  END;

  SELECT id INTO v_board_id
  FROM task_boards
  WHERE user_id = p_user_id
    AND template_type = p_template_type
  LIMIT 1;

  v_board_exists := v_board_id IS NOT NULL;

  IF NOT v_board_exists THEN
    INSERT INTO task_boards (user_id, name, template_type, board_type)
    VALUES (p_user_id, v_board_name, p_template_type, 'grid')
    RETURNING id INTO v_board_id;

    IF p_template_type = 'kanban' THEN
      INSERT INTO task_board_sections (board_id, name, display_order)
      VALUES
        (v_board_id, 'To Do', 0),
        (v_board_id, 'In Progress', 1),
        (v_board_id, 'Done', 2);
    END IF;
  END IF;

  RETURN v_board_id;
END;
$$;

COMMENT ON FUNCTION ensure_singleton_board IS 'Ensures a singleton board exists for recipe and kanban templates. Automatically creates default sections for new kanban boards. Called explicitly by application code. Uses search_path = public for security.';

COMMENT ON COLUMN public.task_boards.template_type IS 'Type of board template: markdown, recipe, kanban, or custom';
COMMENT ON COLUMN public.tasks.item_data IS 'JSON data specific to the board template';
