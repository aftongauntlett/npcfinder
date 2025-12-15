-- Migration: Test bypassing is_admin in INSERT policy temporarily  
-- Date: 2025-12-14
-- Purpose: Simplify policy to ONLY check ownership to isolate the issue

DROP POLICY IF EXISTS "task_boards_insert" ON public.task_boards;

CREATE POLICY "task_boards_insert" ON public.task_boards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
