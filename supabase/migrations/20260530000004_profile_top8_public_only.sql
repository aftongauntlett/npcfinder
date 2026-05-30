-- Enforce that featured profile playlists must be public.

UPDATE public.playlists
SET profile_showcase_rank = NULL
WHERE is_private = true
  AND profile_showcase_rank IS NOT NULL;

ALTER TABLE public.playlists
DROP CONSTRAINT IF EXISTS playlists_profile_showcase_rank_check;

ALTER TABLE public.playlists
ADD CONSTRAINT playlists_profile_showcase_rank_check
CHECK (
  profile_showcase_rank IS NULL
  OR (
    is_private = false
    AND profile_showcase_rank >= 1
    AND profile_showcase_rank <= 8
  )
);
