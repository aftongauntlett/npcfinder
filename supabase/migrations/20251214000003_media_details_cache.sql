-- Migration: Media Details Cache
-- Purpose: Persist enriched TMDB+OMDB movie/TV details so the UI can load instantly
-- Notes:
-- - Data is not user-private (movie/TV metadata), so we allow authenticated read/write.
-- - Cache freshness is controlled via expires_at (and client-side fallback TTL).

CREATE TABLE IF NOT EXISTS public.media_details_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('movie', 'tv')),
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (external_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_media_details_cache_external_type
  ON public.media_details_cache (external_id, media_type);

CREATE INDEX IF NOT EXISTS idx_media_details_cache_expires_at
  ON public.media_details_cache (expires_at);

DROP TRIGGER IF EXISTS update_media_details_cache_updated_at_trigger ON public.media_details_cache;
CREATE TRIGGER update_media_details_cache_updated_at_trigger
BEFORE UPDATE ON public.media_details_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.media_details_cache IS 'Cache for enriched TMDB/OMDB details for movies/TV (shared, non-sensitive).';
COMMENT ON COLUMN public.media_details_cache.data IS 'JSON payload shaped like DetailedMediaInfo.';
COMMENT ON COLUMN public.media_details_cache.expires_at IS 'Optional cache TTL. If NULL, client-side default TTL applies.';

ALTER TABLE public.media_details_cache ENABLE ROW LEVEL SECURITY;

-- RLS: allow authenticated users to read/write cache entries.
DROP POLICY IF EXISTS "media_details_cache_select" ON public.media_details_cache;
CREATE POLICY "media_details_cache_select" ON public.media_details_cache
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "media_details_cache_insert" ON public.media_details_cache;
CREATE POLICY "media_details_cache_insert" ON public.media_details_cache
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "media_details_cache_update" ON public.media_details_cache;
CREATE POLICY "media_details_cache_update" ON public.media_details_cache
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
