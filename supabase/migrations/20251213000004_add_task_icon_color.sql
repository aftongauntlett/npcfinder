-- Migration: Add icon and color fields to tasks
-- Date: 2025-12-13
-- Purpose: Restore task-level visual customization fields (icon + icon_color)

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS icon text NULL,
  ADD COLUMN IF NOT EXISTS icon_color text NULL;

COMMENT ON COLUMN public.tasks.icon IS 'Optional icon identifier for the task (curated UI icon set).';
COMMENT ON COLUMN public.tasks.icon_color IS 'Optional hex color (e.g. #3B82F6) used for task icon background.';
