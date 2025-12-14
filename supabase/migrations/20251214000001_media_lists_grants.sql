-- Migration: Media Lists - Grants
-- Fix PostgREST access to the media_lists_with_counts view and related tables.

-- Ensure authenticated can access the view used by the app.
GRANT SELECT ON public.media_lists_with_counts TO authenticated;

-- Explicitly grant CRUD on tables (RLS still applies).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_list_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_list_items TO authenticated;
