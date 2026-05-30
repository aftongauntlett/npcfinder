-- Add custom image icon support for playlists and configure storage policies.

ALTER TABLE public.playlists
ADD COLUMN IF NOT EXISTS icon_image_url text;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'playlist-icons',
  'playlist-icons',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Playlist icons are publicly readable" ON storage.objects;
CREATE POLICY "Playlist icons are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'playlist-icons');

DROP POLICY IF EXISTS "Users can upload own playlist icons" ON storage.objects;
CREATE POLICY "Users can upload own playlist icons"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'playlist-icons'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own playlist icons" ON storage.objects;
CREATE POLICY "Users can update own playlist icons"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'playlist-icons'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'playlist-icons'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own playlist icons" ON storage.objects;
CREATE POLICY "Users can delete own playlist icons"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'playlist-icons'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
