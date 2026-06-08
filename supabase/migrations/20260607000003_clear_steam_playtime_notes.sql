-- The Steam importer used to write the user's hours played as free text in
-- tracker_items.note (e.g. "12.3 hours played on Steam"), duplicating the
-- value that was already being stored in media.playtime. The importer no
-- longer writes this note — clear the old auto-generated text from existing
-- imports now that the value lives solely in its own column.
--
-- Scoped to the exact auto-generated format on Steam-imported media only, so
-- any notes a user wrote or edited themselves are left untouched.
UPDATE public.tracker_items
SET note = NULL
WHERE note ~ '^[0-9]+(\.[0-9]+)? hours played on Steam$'
  AND media_id IN (
    SELECT id FROM public.media WHERE external_id LIKE 'steam_game_%'
  );
