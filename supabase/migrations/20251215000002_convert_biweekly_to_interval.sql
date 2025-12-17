-- Convert existing biweekly tasks to use weekly with interval=2
-- This is needed because we're removing biweekly from the UI now that we have repeat_interval

-- Update any biweekly tasks to weekly with interval 2
UPDATE tasks 
SET 
  repeat_frequency = 'weekly',
  repeat_interval = 2
WHERE 
  repeat_frequency = 'biweekly';

-- Update the constraint to remove biweekly option
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_repeat_frequency_check;

ALTER TABLE tasks ADD CONSTRAINT tasks_repeat_frequency_check 
  CHECK (repeat_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text, 'custom'::text]));

-- Add comment explaining the change
COMMENT ON COLUMN tasks.repeat_frequency IS 'Frequency for repeatable tasks (daily, weekly, monthly, yearly). Use repeat_interval for custom intervals (e.g., interval=2 + frequency=weekly for biweekly).';
