-- Mark catalog media rows that were manually created by users.
ALTER TABLE public.media
ADD COLUMN IF NOT EXISTS is_user_created boolean NOT NULL DEFAULT false;

ALTER TABLE public.media
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'media_user_created_requires_owner'
      AND conrelid = 'public.media'::regclass
  ) THEN
    ALTER TABLE public.media
    ADD CONSTRAINT media_user_created_requires_owner
    CHECK (NOT is_user_created OR created_by_user_id IS NOT NULL);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_media_is_user_created
  ON public.media (is_user_created);

CREATE INDEX IF NOT EXISTS idx_media_created_by_user_id
  ON public.media (created_by_user_id);
