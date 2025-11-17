-- Fix reading_list table: add missing created_at column

-- Add missing created_at column with default
ALTER TABLE reading_list 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
