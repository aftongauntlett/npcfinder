-- Migration: Drop old baseline INSERT policy on task_boards
-- Date: 2025-12-14
-- Purpose: Remove conflicting INSERT policy from baseline that's preventing board creation

DROP POLICY IF EXISTS "Users can create their own boards" ON public.task_boards;
DROP POLICY IF EXISTS "users_insert_own_boards" ON public.task_boards;
