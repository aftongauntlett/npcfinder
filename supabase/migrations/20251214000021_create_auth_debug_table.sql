-- Migration: Create test table to capture auth.uid() value
-- Date: 2025-12-14
-- Purpose: See what auth.uid() actually returns during INSERT

CREATE TABLE IF NOT EXISTS public.auth_debug_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  captured_auth_uid uuid,
  captured_at timestamptz DEFAULT now()
);

-- Allow anyone authenticated to insert into this table
ALTER TABLE public.auth_debug_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_debug_log_insert" ON public.auth_debug_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_debug_log_select" ON public.auth_debug_log
  FOR SELECT TO authenticated
  USING (true);
