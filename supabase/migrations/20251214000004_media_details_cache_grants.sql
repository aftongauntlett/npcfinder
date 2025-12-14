-- Migration: Media Details Cache - Grants
-- Ensure PostgREST can access the cache table (RLS still applies).

GRANT SELECT, INSERT, UPDATE ON public.media_details_cache TO authenticated;
