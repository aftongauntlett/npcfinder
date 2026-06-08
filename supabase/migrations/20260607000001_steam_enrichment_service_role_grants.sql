-- The Steam import enrichment pipeline (enrich-steam-games and the Steam
-- lookup path in populate-media-cache) runs as service_role and needs to
-- read game titles from `media` and write resolved RAWG details back to
-- both `media` and `media_details_cache`. These grants were inadvertently
-- left out when that feature was built — service_role's prior access to
-- these tables had been granted (20260528000005) and revoked again
-- (20260528000006) for an unrelated one-off backfill script.
GRANT SELECT, UPDATE ON TABLE public.media TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.media_details_cache TO service_role;
