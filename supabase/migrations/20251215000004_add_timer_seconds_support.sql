-- Add support for seconds in timer duration
-- Change timer_duration_minutes to timer_duration_seconds for finer granularity

ALTER TABLE tasks 
  RENAME COLUMN timer_duration_minutes TO timer_duration_seconds;

COMMENT ON COLUMN tasks.timer_duration_seconds IS 'Duration in seconds for timer-based tasks (supports hours, minutes, and seconds)';

-- Note: Existing data is in minutes, so multiply by 60 to convert to seconds
UPDATE tasks 
SET timer_duration_seconds = timer_duration_seconds * 60 
WHERE timer_duration_seconds IS NOT NULL;
