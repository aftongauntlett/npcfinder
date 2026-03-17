-- Expand media_details_cache to support all canonical media types.

ALTER TABLE public.media_details_cache
  DROP CONSTRAINT IF EXISTS media_details_cache_media_type_check;

ALTER TABLE public.media_details_cache
  ADD CONSTRAINT media_details_cache_media_type_check
  CHECK (
    media_type IN ('movie', 'tv', 'book', 'game', 'song', 'album', 'playlist')
  );

COMMENT ON TABLE public.media_details_cache IS 'Shared cache for enriched media details across movies/TV/books/games/music (non-sensitive).';
