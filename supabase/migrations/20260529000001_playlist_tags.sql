-- Add tags column to playlists for user-defined labeling
-- Tags are user-defined text labels (e.g. "favorites", "horror", "2024")
-- Visible on playlist cards and the detail page; future: shown on public profiles

ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
