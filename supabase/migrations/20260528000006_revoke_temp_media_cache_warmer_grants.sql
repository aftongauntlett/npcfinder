-- Revoke temporary service role grants used for one-time media cache backfill.
REVOKE SELECT ON TABLE public.media FROM service_role;
REVOKE SELECT ON TABLE public.tracker_items FROM service_role;
REVOKE SELECT, INSERT, UPDATE ON TABLE public.media_details_cache FROM service_role;
