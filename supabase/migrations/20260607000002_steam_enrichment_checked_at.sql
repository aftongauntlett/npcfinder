-- Tracks whether the RAWG enrichment job has already looked up a Steam-
-- imported game, independent of whether it found a match. This lets the
-- client distinguish "not enriched yet" (checked_at is null) from
-- "RAWG had no match for this title" (checked_at is set, description is
-- still null) so it can show users which imported games are missing info
-- and why.
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS steam_enrichment_checked_at timestamptz;
