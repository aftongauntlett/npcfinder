-- Migration: tracker + playlists + shared media catalog
-- Purpose:
-- 1) Introduce shared media catalog table used by both tracker_items and playlist_items.
-- 2) Introduce tracker_items for personal media diary workflow.
-- 3) Introduce playlists + playlist_items + playlist_shares for curation and invite-only sharing.
-- 4) Backfill from legacy collections/watchlist/library tables.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'tracker_status'
  ) THEN
    CREATE TYPE public.tracker_status AS ENUM ('want_to', 'in_progress', 'done');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('movie', 'tv', 'book', 'game', 'song', 'album', 'playlist')),
  title text NOT NULL,
  subtitle text,
  poster_url text,
  release_date text,
  description text,
  year integer,
  genres text,
  authors text,
  artist text,
  album text,
  track_duration integer,
  track_count integer,
  preview_url text,
  platforms text,
  metacritic integer,
  playtime integer,
  isbn text,
  page_count integer,
  publisher text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (external_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_media_type_title ON public.media (media_type, title);

DROP TRIGGER IF EXISTS update_media_updated_at_trigger ON public.media;
CREATE TRIGGER update_media_updated_at_trigger
BEFORE UPDATE ON public.media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_select" ON public.media;
CREATE POLICY "media_select" ON public.media
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "media_insert" ON public.media;
CREATE POLICY "media_insert" ON public.media
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "media_update" ON public.media;
CREATE POLICY "media_update" ON public.media
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "media_delete" ON public.media;
CREATE POLICY "media_delete" ON public.media
FOR DELETE TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE TABLE IF NOT EXISTS public.tracker_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  status public.tracker_status NOT NULL DEFAULT 'want_to',
  rating integer CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  note text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_tracker_items_user_status_completed
  ON public.tracker_items (user_id, status, completed_at DESC);

DROP TRIGGER IF EXISTS update_tracker_items_updated_at_trigger ON public.tracker_items;
CREATE TRIGGER update_tracker_items_updated_at_trigger
BEFORE UPDATE ON public.tracker_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tracker_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracker_items_select" ON public.tracker_items;
CREATE POLICY "tracker_items_select" ON public.tracker_items
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
);

DROP POLICY IF EXISTS "tracker_items_insert" ON public.tracker_items;
CREATE POLICY "tracker_items_insert" ON public.tracker_items
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tracker_items_update" ON public.tracker_items;
CREATE POLICY "tracker_items_update" ON public.tracker_items
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
)
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tracker_items_delete" ON public.tracker_items;
CREATE POLICY "tracker_items_delete" ON public.tracker_items
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
);

CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_private boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playlists_owner_updated
  ON public.playlists (owner_id, updated_at DESC);

DROP TRIGGER IF EXISTS update_playlists_updated_at_trigger ON public.playlists;
CREATE TRIGGER update_playlists_updated_at_trigger
BEFORE UPDATE ON public.playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  note text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_position
  ON public.playlist_items (playlist_id, position, created_at);

CREATE TABLE IF NOT EXISTS public.playlist_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  shared_with_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_shares_user
  ON public.playlist_shares (shared_with_user_id);

CREATE OR REPLACE FUNCTION public.can_view_playlist(check_playlist_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.playlists p
      WHERE p.id = check_playlist_id
        AND p.owner_id = check_user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.playlist_shares ps
      WHERE ps.playlist_id = check_playlist_id
        AND ps.shared_with_user_id = check_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_playlist(check_playlist_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security = off
AS $$
  SELECT
    public.get_user_role(check_user_id) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1
      FROM public.playlists p
      WHERE p.id = check_playlist_id
        AND p.owner_id = check_user_id
    );
$$;

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "playlists_select" ON public.playlists;
CREATE POLICY "playlists_select" ON public.playlists
FOR SELECT TO authenticated
USING (public.can_view_playlist(id, auth.uid()));

DROP POLICY IF EXISTS "playlists_insert" ON public.playlists;
CREATE POLICY "playlists_insert" ON public.playlists
FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "playlists_update" ON public.playlists;
CREATE POLICY "playlists_update" ON public.playlists
FOR UPDATE TO authenticated
USING (public.can_edit_playlist(id, auth.uid()))
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "playlists_delete" ON public.playlists;
CREATE POLICY "playlists_delete" ON public.playlists
FOR DELETE TO authenticated
USING (public.can_edit_playlist(id, auth.uid()));

DROP POLICY IF EXISTS "playlist_items_select" ON public.playlist_items;
CREATE POLICY "playlist_items_select" ON public.playlist_items
FOR SELECT TO authenticated
USING (public.can_view_playlist(playlist_id, auth.uid()));

DROP POLICY IF EXISTS "playlist_items_insert" ON public.playlist_items;
CREATE POLICY "playlist_items_insert" ON public.playlist_items
FOR INSERT TO authenticated
WITH CHECK (public.can_edit_playlist(playlist_id, auth.uid()));

DROP POLICY IF EXISTS "playlist_items_update" ON public.playlist_items;
CREATE POLICY "playlist_items_update" ON public.playlist_items
FOR UPDATE TO authenticated
USING (public.can_edit_playlist(playlist_id, auth.uid()))
WITH CHECK (public.can_edit_playlist(playlist_id, auth.uid()));

DROP POLICY IF EXISTS "playlist_items_delete" ON public.playlist_items;
CREATE POLICY "playlist_items_delete" ON public.playlist_items
FOR DELETE TO authenticated
USING (public.can_edit_playlist(playlist_id, auth.uid()));

DROP POLICY IF EXISTS "playlist_shares_select" ON public.playlist_shares;
CREATE POLICY "playlist_shares_select" ON public.playlist_shares
FOR SELECT TO authenticated
USING (
  public.can_edit_playlist(playlist_id, auth.uid())
  OR shared_with_user_id = auth.uid()
);

DROP POLICY IF EXISTS "playlist_shares_insert" ON public.playlist_shares;
CREATE POLICY "playlist_shares_insert" ON public.playlist_shares
FOR INSERT TO authenticated
WITH CHECK (public.can_edit_playlist(playlist_id, auth.uid()));

DROP POLICY IF EXISTS "playlist_shares_delete" ON public.playlist_shares;
CREATE POLICY "playlist_shares_delete" ON public.playlist_shares
FOR DELETE TO authenticated
USING (public.can_edit_playlist(playlist_id, auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracker_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.playlist_shares TO authenticated;

-- ------------------------------
-- Data backfill from legacy tables
-- ------------------------------

INSERT INTO public.media (
  external_id,
  media_type,
  title,
  subtitle,
  poster_url,
  release_date,
  description,
  year,
  genres,
  authors,
  artist,
  album,
  track_duration,
  track_count,
  preview_url,
  platforms,
  metacritic,
  playtime,
  isbn,
  page_count,
  publisher
)
SELECT DISTINCT
  mli.external_id,
  mli.media_type,
  mli.title,
  mli.subtitle,
  mli.poster_url,
  mli.release_date,
  mli.description,
  mli.year,
  mli.genres,
  mli.authors,
  mli.artist,
  mli.album,
  mli.track_duration,
  mli.track_count,
  mli.preview_url,
  mli.platforms,
  mli.metacritic,
  mli.playtime,
  mli.isbn,
  mli.page_count,
  mli.publisher
FROM public.media_list_items mli
ON CONFLICT (external_id, media_type) DO UPDATE
SET
  title = EXCLUDED.title,
  subtitle = COALESCE(EXCLUDED.subtitle, public.media.subtitle),
  poster_url = COALESCE(EXCLUDED.poster_url, public.media.poster_url),
  release_date = COALESCE(EXCLUDED.release_date, public.media.release_date),
  description = COALESCE(EXCLUDED.description, public.media.description),
  year = COALESCE(EXCLUDED.year, public.media.year),
  genres = COALESCE(EXCLUDED.genres, public.media.genres),
  authors = COALESCE(EXCLUDED.authors, public.media.authors),
  artist = COALESCE(EXCLUDED.artist, public.media.artist),
  album = COALESCE(EXCLUDED.album, public.media.album),
  track_duration = COALESCE(EXCLUDED.track_duration, public.media.track_duration),
  track_count = COALESCE(EXCLUDED.track_count, public.media.track_count),
  preview_url = COALESCE(EXCLUDED.preview_url, public.media.preview_url),
  platforms = COALESCE(EXCLUDED.platforms, public.media.platforms),
  metacritic = COALESCE(EXCLUDED.metacritic, public.media.metacritic),
  playtime = COALESCE(EXCLUDED.playtime, public.media.playtime),
  isbn = COALESCE(EXCLUDED.isbn, public.media.isbn),
  page_count = COALESCE(EXCLUDED.page_count, public.media.page_count),
  publisher = COALESCE(EXCLUDED.publisher, public.media.publisher);

INSERT INTO public.media (external_id, media_type, title, poster_url, release_date, description, genres)
SELECT DISTINCT
  uw.external_id,
  uw.media_type,
  uw.title,
  uw.poster_url,
  uw.release_date,
  uw.overview,
  array_to_string(uw.genres, ', ')
FROM public.user_watchlist uw
ON CONFLICT (external_id, media_type) DO NOTHING;

INSERT INTO public.media (external_id, media_type, title, poster_url, release_date, description, genres)
SELECT DISTINCT
  uwa.external_id,
  uwa.media_type,
  uwa.title,
  uwa.poster_url,
  uwa.release_date,
  uwa.overview,
  array_to_string(uwa.genres, ', ')
FROM public.user_watched_archive uwa
ON CONFLICT (external_id, media_type) DO NOTHING;

INSERT INTO public.media (external_id, media_type, title, authors, poster_url, release_date, description, isbn, page_count, genres)
SELECT DISTINCT
  rl.external_id,
  'book',
  rl.title,
  rl.authors,
  rl.thumbnail_url,
  rl.published_date,
  rl.description,
  rl.isbn,
  rl.page_count,
  rl.categories
FROM public.reading_list rl
ON CONFLICT (external_id, media_type) DO NOTHING;

INSERT INTO public.media (
  external_id,
  media_type,
  title,
  poster_url,
  release_date,
  description,
  platforms,
  genres,
  metacritic,
  playtime
)
SELECT DISTINCT
  gl.external_id,
  'game',
  gl.name,
  gl.background_image,
  gl.released,
  gl.description_raw,
  gl.platforms,
  gl.genres,
  gl.metacritic,
  gl.playtime
FROM public.game_library gl
ON CONFLICT (external_id, media_type) DO NOTHING;

INSERT INTO public.media (
  external_id,
  media_type,
  title,
  artist,
  album,
  poster_url,
  release_date,
  preview_url,
  genres,
  track_duration,
  track_count
)
SELECT DISTINCT
  ml.external_id,
  ml.media_type,
  ml.title,
  ml.artist,
  ml.album,
  ml.album_cover_url,
  ml.release_date,
  ml.preview_url,
  ml.genre,
  ml.track_duration,
  ml.track_count
FROM public.music_library ml
ON CONFLICT (external_id, media_type) DO NOTHING;

-- Keep ids aligned with legacy lists to simplify item/share migration.
INSERT INTO public.playlists (id, owner_id, name, description, is_private, created_at, updated_at)
SELECT
  ml.id,
  ml.owner_id,
  ml.title,
  ml.description,
  NOT ml.is_public,
  ml.created_at,
  ml.updated_at
FROM public.media_lists ml
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.playlist_items (playlist_id, media_id, note, position, created_at)
SELECT
  mli.list_id,
  m.id,
  NULL,
  COALESCE(
    mli.sort_order,
    row_number() OVER (
      PARTITION BY mli.list_id
      ORDER BY mli.created_at, mli.id
    ) - 1
  ),
  mli.created_at
FROM public.media_list_items mli
JOIN public.media m
  ON m.external_id = mli.external_id
 AND m.media_type = mli.media_type
ON CONFLICT (playlist_id, media_id) DO UPDATE
SET position = EXCLUDED.position;

INSERT INTO public.playlist_shares (playlist_id, shared_with_user_id, created_at)
SELECT
  mlm.list_id,
  mlm.user_id,
  mlm.created_at
FROM public.media_list_members mlm
ON CONFLICT (playlist_id, shared_with_user_id) DO NOTHING;

INSERT INTO public.tracker_items (user_id, media_id, status, rating, note, completed_at)
SELECT
  uw.user_id,
  m.id,
  CASE WHEN uw.watched THEN 'done'::public.tracker_status ELSE 'want_to'::public.tracker_status END,
  NULL,
  uw.notes,
  uw.watched_at
FROM public.user_watchlist uw
JOIN public.media m
  ON m.external_id = uw.external_id
 AND m.media_type = uw.media_type
ON CONFLICT (user_id, media_id) DO UPDATE
SET
  status = CASE
    WHEN EXCLUDED.status = 'done'::public.tracker_status OR public.tracker_items.status = 'done'::public.tracker_status THEN 'done'::public.tracker_status
    WHEN EXCLUDED.status = 'in_progress'::public.tracker_status OR public.tracker_items.status = 'in_progress'::public.tracker_status THEN 'in_progress'::public.tracker_status
    ELSE 'want_to'::public.tracker_status
  END,
  rating = COALESCE(EXCLUDED.rating, public.tracker_items.rating),
  note = COALESCE(EXCLUDED.note, public.tracker_items.note),
  completed_at = COALESCE(EXCLUDED.completed_at, public.tracker_items.completed_at),
  updated_at = now();

INSERT INTO public.tracker_items (user_id, media_id, status, rating, note, completed_at)
SELECT
  uwa.user_id,
  m.id,
  'done'::public.tracker_status,
  uwa.rating,
  uwa.review,
  uwa.watched_at
FROM public.user_watched_archive uwa
JOIN public.media m
  ON m.external_id = uwa.external_id
 AND m.media_type = uwa.media_type
ON CONFLICT (user_id, media_id) DO UPDATE
SET
  status = 'done'::public.tracker_status,
  rating = COALESCE(EXCLUDED.rating, public.tracker_items.rating),
  note = COALESCE(EXCLUDED.note, public.tracker_items.note),
  completed_at = COALESCE(EXCLUDED.completed_at, public.tracker_items.completed_at),
  updated_at = now();

INSERT INTO public.tracker_items (user_id, media_id, status, rating, note, completed_at)
SELECT
  rl.user_id,
  m.id,
  CASE WHEN rl.read THEN 'done'::public.tracker_status ELSE 'want_to'::public.tracker_status END,
  rl.personal_rating,
  rl.personal_notes,
  rl.read_at
FROM public.reading_list rl
JOIN public.media m
  ON m.external_id = rl.external_id
 AND m.media_type = 'book'
ON CONFLICT (user_id, media_id) DO UPDATE
SET
  status = CASE
    WHEN EXCLUDED.status = 'done'::public.tracker_status OR public.tracker_items.status = 'done'::public.tracker_status THEN 'done'::public.tracker_status
    WHEN EXCLUDED.status = 'in_progress'::public.tracker_status OR public.tracker_items.status = 'in_progress'::public.tracker_status THEN 'in_progress'::public.tracker_status
    ELSE 'want_to'::public.tracker_status
  END,
  rating = COALESCE(EXCLUDED.rating, public.tracker_items.rating),
  note = COALESCE(EXCLUDED.note, public.tracker_items.note),
  completed_at = COALESCE(EXCLUDED.completed_at, public.tracker_items.completed_at),
  updated_at = now();

INSERT INTO public.tracker_items (user_id, media_id, status, rating, note, completed_at)
SELECT
  gl.user_id,
  m.id,
  CASE WHEN gl.played THEN 'done'::public.tracker_status ELSE 'want_to'::public.tracker_status END,
  gl.personal_rating,
  gl.personal_notes,
  gl.played_at
FROM public.game_library gl
JOIN public.media m
  ON m.external_id = gl.external_id
 AND m.media_type = 'game'
ON CONFLICT (user_id, media_id) DO UPDATE
SET
  status = CASE
    WHEN EXCLUDED.status = 'done'::public.tracker_status OR public.tracker_items.status = 'done'::public.tracker_status THEN 'done'::public.tracker_status
    WHEN EXCLUDED.status = 'in_progress'::public.tracker_status OR public.tracker_items.status = 'in_progress'::public.tracker_status THEN 'in_progress'::public.tracker_status
    ELSE 'want_to'::public.tracker_status
  END,
  rating = COALESCE(EXCLUDED.rating, public.tracker_items.rating),
  note = COALESCE(EXCLUDED.note, public.tracker_items.note),
  completed_at = COALESCE(EXCLUDED.completed_at, public.tracker_items.completed_at),
  updated_at = now();

INSERT INTO public.tracker_items (user_id, media_id, status, rating, note, completed_at)
SELECT
  ml.user_id,
  m.id,
  CASE WHEN ml.listened THEN 'done'::public.tracker_status ELSE 'want_to'::public.tracker_status END,
  ml.personal_rating,
  ml.personal_notes,
  ml.listened_at
FROM public.music_library ml
JOIN public.media m
  ON m.external_id = ml.external_id
 AND m.media_type = ml.media_type
ON CONFLICT (user_id, media_id) DO UPDATE
SET
  status = CASE
    WHEN EXCLUDED.status = 'done'::public.tracker_status OR public.tracker_items.status = 'done'::public.tracker_status THEN 'done'::public.tracker_status
    WHEN EXCLUDED.status = 'in_progress'::public.tracker_status OR public.tracker_items.status = 'in_progress'::public.tracker_status THEN 'in_progress'::public.tracker_status
    ELSE 'want_to'::public.tracker_status
  END,
  rating = COALESCE(EXCLUDED.rating, public.tracker_items.rating),
  note = COALESCE(EXCLUDED.note, public.tracker_items.note),
  completed_at = COALESCE(EXCLUDED.completed_at, public.tracker_items.completed_at),
  updated_at = now();
