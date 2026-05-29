-- Add icon column to playlists for playlist identity / visual representation.
-- Replaces the old item_posters mosaic approach (which required extra DB queries
-- against playlist_items). Stored as a string key matching the PLAYLIST_ICONS map
-- defined on the client.

ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT 'list-music';
