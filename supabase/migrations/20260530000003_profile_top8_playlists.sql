-- Add profile showcase ordering so each user can curate up to 8 playlists on their profile.

ALTER TABLE public.playlists
ADD COLUMN IF NOT EXISTS profile_showcase_rank integer;

ALTER TABLE public.playlists
DROP CONSTRAINT IF EXISTS playlists_profile_showcase_rank_check;

ALTER TABLE public.playlists
ADD CONSTRAINT playlists_profile_showcase_rank_check
CHECK (
  profile_showcase_rank IS NULL
  OR (profile_showcase_rank >= 1 AND profile_showcase_rank <= 8)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_playlists_owner_profile_showcase_rank
ON public.playlists (owner_id, profile_showcase_rank)
WHERE profile_showcase_rank IS NOT NULL;
