-- Grant table-level permissions to authenticated users on music_library
-- This was missing from the initial migration and causes 403 Forbidden errors

GRANT SELECT, INSERT, UPDATE, DELETE ON music_library TO authenticated;
