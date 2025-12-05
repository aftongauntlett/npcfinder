-- Migration: Canonicalize task_boards.template_type Allowed Values
-- Created: 2025-12-04
-- Description: Establishes the final, authoritative set of template_type values to prevent
--              divergence between environments. Previous migrations redefined this constraint
--              differently (20251201 excluded 'grocery', 20251204 included it), which could
--              cause schema drift. This migration creates the canonical definition that matches
--              the product specification and current application code.
--
--              Canonical template types:
--              - job_tracker: Job application tracking with status history
--              - markdown: Simple list-based tasks with markdown support
--              - recipe: Recipe management with ingredients and instructions
--              - kanban: Board with columns (To Do, In Progress, Done)
--              - grocery: Shopping list with categories and purchase tracking
--              - custom: User-defined board with flexible configuration

-- Drop any existing constraint
ALTER TABLE task_boards
  DROP CONSTRAINT IF EXISTS task_boards_template_type_check;

-- Create the canonical constraint with all supported template types
ALTER TABLE task_boards
  ADD CONSTRAINT task_boards_template_type_check 
  CHECK (template_type IN ('job_tracker', 'markdown', 'recipe', 'kanban', 'grocery', 'custom'));

-- Update column comment to document the canonical list
COMMENT ON COLUMN task_boards.template_type IS 'Type of board template: job_tracker, markdown, recipe, kanban, grocery, or custom';

-- Note: No data migration needed - all existing boards should already use these types
-- Previous migration (20251201) converted old types (notes, todo) to markdown
