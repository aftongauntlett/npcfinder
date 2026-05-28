-- Temporary grants for one-time media cache backfill via service role script.
GRANT SELECT ON TABLE public.media TO service_role;
GRANT SELECT ON TABLE public.tracker_items TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.media_details_cache TO service_role;
