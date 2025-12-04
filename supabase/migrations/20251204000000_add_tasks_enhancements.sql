-- Migration: Add Tasks Enhancements (Timers, Reminders, Board Sharing)
-- Created: 2025-12-04
-- Description: Adds timer and reminder fields to tasks, creates board_shares table for user-specific sharing,
--              and updates template types to include grocery lists.

-- 1. Add timer and reminder fields to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS timer_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timer_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_date DATE,
  ADD COLUMN IF NOT EXISTS reminder_time TIME,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_urgent_after_timer BOOLEAN DEFAULT false;

-- Add comments explaining new timer fields
COMMENT ON COLUMN tasks.timer_duration_minutes IS 'Duration in minutes for timer-based tasks';
COMMENT ON COLUMN tasks.timer_started_at IS 'Timestamp when the timer was started';
COMMENT ON COLUMN tasks.timer_completed_at IS 'Timestamp when the timer completed';
COMMENT ON COLUMN tasks.is_urgent_after_timer IS 'Flag to mark task as urgent after timer completes';

-- Add comments explaining new reminder fields
COMMENT ON COLUMN tasks.reminder_date IS 'Date for date-based reminders (birthdays, anniversaries, etc.)';
COMMENT ON COLUMN tasks.reminder_time IS 'Optional time for the reminder';
COMMENT ON COLUMN tasks.reminder_sent_at IS 'Timestamp tracking when reminder was sent';

-- 2. Create board_shares table for user-specific sharing
CREATE TABLE IF NOT EXISTS board_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure a board can only be shared once with each user
  CONSTRAINT unique_board_share UNIQUE (board_id, shared_with_user_id),
  
  -- Prevent sharing with self
  CONSTRAINT no_self_share CHECK (shared_by_user_id != shared_with_user_id)
);

-- Add comments for board_shares table
COMMENT ON TABLE board_shares IS 'Manages user-specific board sharing with permission levels';
COMMENT ON COLUMN board_shares.can_edit IS 'Permission level: true allows editing, false is view-only';

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_timer_started_at ON tasks(timer_started_at) WHERE timer_started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_date ON tasks(reminder_date) WHERE reminder_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_board_shares_shared_with ON board_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_board_shares_board_id ON board_shares(board_id);

-- 4. Update template_type constraint to include grocery
ALTER TABLE task_boards
  DROP CONSTRAINT IF EXISTS task_boards_template_type_check;

ALTER TABLE task_boards
  ADD CONSTRAINT task_boards_template_type_check 
  CHECK (template_type IN ('job_tracker', 'markdown', 'recipe', 'kanban', 'grocery', 'custom'));

COMMENT ON COLUMN task_boards.template_type IS 'Type of board template: job_tracker, markdown, recipe, kanban, grocery, or custom';

-- 5. Enable RLS on board_shares table
ALTER TABLE board_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view shares where they're involved or own the board
DROP POLICY IF EXISTS "Users can view shares for their boards or boards shared with them" ON board_shares;
DROP POLICY IF EXISTS "Users can view board shares" ON board_shares;

CREATE POLICY "Users can view board shares"
  ON board_shares
  FOR SELECT
  USING (
    shared_with_user_id = auth.uid() OR
    shared_by_user_id = auth.uid() OR
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid())
  );

-- RLS Policy: Board owners can create shares
DROP POLICY IF EXISTS "Board owners can create shares" ON board_shares;

CREATE POLICY "Board owners can create shares"
  ON board_shares
  FOR INSERT
  WITH CHECK (
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid())
  );

-- RLS Policy: Board owners and users with edit permission can update shares
DROP POLICY IF EXISTS "Board owners and editors can update shares" ON board_shares;

CREATE POLICY "Board owners and editors can update shares"
  ON board_shares
  FOR UPDATE
  USING (
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid()) OR
    (shared_with_user_id = auth.uid() AND can_edit = true)
  );

-- RLS Policy: Board owners can delete shares
DROP POLICY IF EXISTS "Board owners can delete shares" ON board_shares;

CREATE POLICY "Board owners can delete shares"
  ON board_shares
  FOR DELETE
  USING (
    board_id IN (SELECT id FROM task_boards WHERE user_id = auth.uid())
  );
