-- One-time backfill:
-- Collections created before authenticated-public semantics (2026-01-26)
-- should remain non-public to preserve original owner intent.

UPDATE public.media_lists
SET is_public = false,
    updated_at = now()
WHERE is_public = true
  AND created_at < timestamptz '2026-01-26T00:00:00Z';
