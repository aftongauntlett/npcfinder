-- Add 'daily' and 'biweekly' to the repeat_frequency constraint
-- This allows tasks to repeat daily or every two weeks

-- Drop the existing constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_repeat_frequency_check;

-- Add the updated constraint with all frequency options
ALTER TABLE tasks ADD CONSTRAINT tasks_repeat_frequency_check 
  CHECK (repeat_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'biweekly'::text, 'monthly'::text, 'yearly'::text, 'custom'::text]));
