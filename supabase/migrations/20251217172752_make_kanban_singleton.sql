-- Make kanban template a singleton type
-- This migration adds kanban to the singleton board types alongside job_tracker and recipe
-- All users will have exactly one kanban board, auto-created on first use

-- Step 1: Merge multiple kanban boards per user into a single canonical board
-- This preserves all tasks, sections, and sharing settings
DO $$
DECLARE
  v_user_record RECORD;
  v_canonical_board_id uuid;
  v_other_board RECORD;
  v_section RECORD;
  v_task RECORD;
  v_max_section_order integer;
  v_max_task_order integer;
BEGIN
  -- Process each user with multiple kanban boards
  FOR v_user_record IN
    SELECT user_id, COUNT(*) as board_count
    FROM task_boards
    WHERE template_type = 'kanban'
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    -- Select the canonical board (most recent with most tasks)
    SELECT tb.id INTO v_canonical_board_id
    FROM task_boards tb
    LEFT JOIN (
      SELECT board_id, COUNT(*) as task_count
      FROM tasks
      GROUP BY board_id
    ) tc ON tb.id = tc.board_id
    WHERE tb.user_id = v_user_record.user_id
      AND tb.template_type = 'kanban'
    ORDER BY COALESCE(tc.task_count, 0) DESC, tb.created_at DESC
    LIMIT 1;

    RAISE NOTICE 'User %: Using board % as canonical kanban board', v_user_record.user_id, v_canonical_board_id;

    -- Get max display_order for sections in canonical board
    SELECT COALESCE(MAX(display_order), -1) INTO v_max_section_order
    FROM task_board_sections
    WHERE board_id = v_canonical_board_id;

    -- Merge other boards into canonical board
    FOR v_other_board IN
      SELECT id, is_public
      FROM task_boards
      WHERE user_id = v_user_record.user_id
        AND template_type = 'kanban'
        AND id != v_canonical_board_id
    LOOP
      RAISE NOTICE 'Merging board % into canonical board %', v_other_board.id, v_canonical_board_id;

      -- Preserve public flag if any board was public
      IF v_other_board.is_public THEN
        UPDATE task_boards
        SET is_public = true
        WHERE id = v_canonical_board_id;
      END IF;

      -- Move sections from other board to canonical board
      FOR v_section IN
        SELECT id, name, display_order
        FROM task_board_sections
        WHERE board_id = v_other_board.id
        ORDER BY display_order
      LOOP
        v_max_section_order := v_max_section_order + 1;
        
        -- Update section to point to canonical board
        UPDATE task_board_sections
        SET board_id = v_canonical_board_id,
            display_order = v_max_section_order
        WHERE id = v_section.id;

        -- Get max task order in the section
        SELECT COALESCE(MAX(display_order), -1) INTO v_max_task_order
        FROM tasks
        WHERE section_id = v_section.id;

        -- Tasks are already linked to the section, so they follow automatically
        RAISE NOTICE 'Moved section % ("%") with tasks to canonical board', v_section.id, v_section.name;
      END LOOP;

      -- Move any unsectioned tasks from other board
      UPDATE tasks
      SET board_id = v_canonical_board_id
      WHERE board_id = v_other_board.id
        AND section_id IS NULL;

      -- Migrate board members (sharing) to canonical board
      INSERT INTO task_board_members (board_id, user_id, role, invited_by)
      SELECT v_canonical_board_id, user_id, role, invited_by
      FROM task_board_members
      WHERE board_id = v_other_board.id
      ON CONFLICT (board_id, user_id) DO NOTHING;

      -- Delete the now-empty board
      DELETE FROM task_boards WHERE id = v_other_board.id;
      
      RAISE NOTICE 'Deleted merged board %', v_other_board.id;
    END LOOP;
  END LOOP;
END $$;

-- Step 2: Update ensure_singleton_board function to include kanban and auto-create default sections
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
  -- Map template type to board name
  v_board_name := CASE p_template_type
    WHEN 'job_tracker' THEN 'Job Applications'
    WHEN 'recipe' THEN 'Recipes'
    WHEN 'kanban' THEN 'Kanban Board'
    ELSE p_template_type
  END;

  -- Check if singleton board already exists
  SELECT id INTO v_board_id
  FROM task_boards
  WHERE user_id = p_user_id
    AND template_type = p_template_type
  LIMIT 1;

  v_board_exists := v_board_id IS NOT NULL;

  -- Create if doesn't exist
  IF NOT v_board_exists THEN
    INSERT INTO task_boards (user_id, name, template_type, board_type)
    VALUES (p_user_id, v_board_name, p_template_type, 'grid')
    RETURNING id INTO v_board_id;

    -- For kanban boards, create default sections immediately after board creation
    IF p_template_type = 'kanban' THEN
      INSERT INTO task_board_sections (board_id, name, display_order)
      VALUES 
        (v_board_id, 'To Do', 0),
        (v_board_id, 'In Progress', 1),
        (v_board_id, 'Done', 2);
      
      RAISE NOTICE 'Created default sections for new kanban board %', v_board_id;
    END IF;
  END IF;

  RETURN v_board_id;
END;
$$;

COMMENT ON FUNCTION ensure_singleton_board IS 'Ensures a singleton board exists for global collection types (job_tracker, recipe, kanban). Called explicitly by application code. Uses search_path = public for security.';

-- Step 3: Create singleton kanban boards for all existing users who don't have one
DO $$
DECLARE
  v_user_record RECORD;
  v_board_id uuid;
BEGIN
  FOR v_user_record IN 
    SELECT DISTINCT ap.id AS user_id
    FROM auth.users ap
    WHERE NOT EXISTS (
      SELECT 1 FROM task_boards tb
      WHERE tb.user_id = ap.id
        AND tb.template_type = 'kanban'
    )
  LOOP
    -- Create kanban board for user
    v_board_id := ensure_singleton_board(v_user_record.user_id, 'kanban');
    
    RAISE NOTICE 'Created kanban board % for user %', v_board_id, v_user_record.user_id;
  END LOOP;
END $$;

-- Step 4: Ensure all existing kanban boards have default sections (To Do, In Progress, Done)
DO $$
DECLARE
  v_board_record RECORD;
  v_section_count integer;
  v_section_id uuid;
BEGIN
  FOR v_board_record IN 
    SELECT id FROM task_boards WHERE template_type = 'kanban'
  LOOP
    -- Count existing sections
    SELECT COUNT(*) INTO v_section_count
    FROM task_board_sections
    WHERE board_id = v_board_record.id;
    
    -- If no sections exist, create the default three
    IF v_section_count = 0 THEN
      -- To Do
      INSERT INTO task_board_sections (board_id, name, display_order)
      VALUES (v_board_record.id, 'To Do', 0)
      RETURNING id INTO v_section_id;
      
      -- In Progress
      INSERT INTO task_board_sections (board_id, name, display_order)
      VALUES (v_board_record.id, 'In Progress', 1);
      
      -- Done
      INSERT INTO task_board_sections (board_id, name, display_order)
      VALUES (v_board_record.id, 'Done', 2);
      
      RAISE NOTICE 'Created default sections for kanban board %', v_board_record.id;
    END IF;
  END LOOP;
END $$;
