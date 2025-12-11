-- Migration: Update Job Tracker Status Values
-- Description: Maps old detailed status values to new simplified status system
-- Old statuses: "Phone Screen", "Interview - Round 1/2/3", "Offer Received"
-- New statuses: "Applied", "No Response", "Interview", "Accepted", "Rejected", "Declined"

-- Update job tracker task statuses to use simplified values
UPDATE tasks
SET item_data = jsonb_set(
  item_data,
  '{status}',
  CASE 
    -- Map interview stages to generic "Interview"
    WHEN item_data->>'status' = 'Phone Screen' THEN '"Interview"'
    WHEN item_data->>'status' = 'Interview - Round 1' THEN '"Interview"'
    WHEN item_data->>'status' = 'Interview - Round 2' THEN '"Interview"'
    WHEN item_data->>'status' = 'Interview - Round 3' THEN '"Interview"'
    
    -- Map "Offer Received" to "Accepted"
    WHEN item_data->>'status' = 'Offer Received' THEN '"Accepted"'
    
    -- Keep existing simplified statuses as-is
    WHEN item_data->>'status' IN ('Applied', 'No Response', 'Interview', 'Accepted', 'Rejected', 'Declined') 
      THEN to_jsonb(item_data->>'status')
    
    -- Default to current value if not in mapping
    ELSE to_jsonb(item_data->>'status')
  END
)
WHERE 
  -- Only update job tracker tasks
  board_id IN (
    SELECT id FROM task_boards WHERE template_type = 'job_tracker'
  )
  AND item_data->>'status' IS NOT NULL
  -- Only update tasks with old status values that need mapping
  AND item_data->>'status' IN (
    'Phone Screen',
    'Interview - Round 1',
    'Interview - Round 2', 
    'Interview - Round 3',
    'Offer Received'
  );

-- Update status_history arrays to use simplified values
UPDATE tasks
SET item_data = jsonb_set(
  item_data,
  '{status_history}',
  (
    SELECT jsonb_agg(
      jsonb_set(
        history_entry,
        '{status}',
        CASE 
          -- Map interview stages to generic "Interview"
          WHEN history_entry->>'status' = 'Phone Screen' THEN '"Interview"'
          WHEN history_entry->>'status' = 'Interview - Round 1' THEN '"Interview"'
          WHEN history_entry->>'status' = 'Interview - Round 2' THEN '"Interview"'
          WHEN history_entry->>'status' = 'Interview - Round 3' THEN '"Interview"'
          
          -- Map "Offer Received" to "Accepted"
          WHEN history_entry->>'status' = 'Offer Received' THEN '"Accepted"'
          
          -- Keep existing simplified statuses as-is
          ELSE to_jsonb(history_entry->>'status')
        END
      )
    )
    FROM jsonb_array_elements(item_data->'status_history') AS history_entry
  )
)
WHERE 
  -- Only update job tracker tasks
  board_id IN (
    SELECT id FROM task_boards WHERE template_type = 'job_tracker'
  )
  AND item_data->'status_history' IS NOT NULL
  AND jsonb_typeof(item_data->'status_history') = 'array'
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(item_data->'status_history') AS history_entry
    WHERE history_entry->>'status' IN (
      'Phone Screen',
      'Interview - Round 1',
      'Interview - Round 2',
      'Interview - Round 3',
      'Offer Received'
    )
  );
