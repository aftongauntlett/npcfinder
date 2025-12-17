-- Add repeat_interval column to tasks table
-- This allows users to specify "every X days/weeks/months/years"
-- Default is 1 (e.g., "every 1 week" for weekly tasks)

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS repeat_interval INTEGER DEFAULT 1 CHECK (repeat_interval > 0);

COMMENT ON COLUMN tasks.repeat_interval IS 'Multiplier for repeat frequency (e.g., 3 for "every 3 months")';
