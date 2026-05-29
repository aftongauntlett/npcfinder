-- Add slug column to playlists for human-readable URLs
-- e.g. /app/playlists/my-favorites instead of /app/playlists/<uuid>
-- Slugs are globally unique and auto-generated from the playlist name on create.
-- Owners can rename slugs via updatePlaylist.

ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS slug text;

-- Temporary helper: convert name to URL-safe slug
CREATE OR REPLACE FUNCTION _tmp_slugify(v text) RETURNS text AS $$
  SELECT LOWER(
    TRIM(BOTH '-' FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(v, '[^a-zA-Z0-9\s-]', '', 'g'),
        '[\s]+', '-', 'g'
      )
    )
  );
$$ LANGUAGE SQL IMMUTABLE STRICT;

-- Assign a clean slug to every existing row
UPDATE playlists
SET slug = COALESCE(NULLIF(_tmp_slugify(name), ''), 'playlist')
WHERE slug IS NULL;

-- Disambiguate collisions: the oldest playlist keeps the clean slug;
-- later ones get a short 8-char id suffix appended.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at ASC) AS rn
  FROM playlists
)
UPDATE playlists p
SET slug = p.slug || '-' || SUBSTRING(p.id::text FROM 1 FOR 8)
FROM ranked r
WHERE p.id = r.id AND r.rn > 1;

DROP FUNCTION _tmp_slugify;

-- Enforce NOT NULL and uniqueness
ALTER TABLE playlists ALTER COLUMN slug SET NOT NULL;
ALTER TABLE playlists ADD CONSTRAINT playlists_slug_key UNIQUE (slug);

-- Fast lookup index
CREATE INDEX IF NOT EXISTS idx_playlists_slug ON playlists (slug);
