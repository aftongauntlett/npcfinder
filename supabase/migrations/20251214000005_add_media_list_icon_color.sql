-- Migration: Add icon_color field to media lists
-- Date: 2025-12-14
-- Purpose: Allow per-list icon color selection in Media Lists UI.

ALTER TABLE public.media_lists
  ADD COLUMN IF NOT EXISTS icon_color text NULL;

COMMENT ON COLUMN public.media_lists.icon_color IS 'Optional icon color (CSS color string) for the media list icon.';

-- Update view to include icon_color
DROP VIEW IF EXISTS public.media_lists_with_counts;
CREATE VIEW public.media_lists_with_counts AS
SELECT
  ml.id,
  ml.owner_id,
  ml.media_domain,
  ml.title,
  ml.description,
  ml.icon,
  ml.icon_color,
  ml.is_public,
  ml.created_at,
  ml.updated_at,
  COALESCE(up.display_name, 'Unknown') AS owner_display_name,
  (SELECT COUNT(1) FROM public.media_list_items mli WHERE mli.list_id = ml.id) AS item_count
FROM public.media_lists ml
LEFT JOIN public.user_profiles up ON up.user_id = ml.owner_id;

COMMENT ON VIEW public.media_lists_with_counts IS 'Lists with item_count and owner display name for list index rendering.';

-- Re-apply grants (dropped/recreated view loses privileges)
GRANT SELECT ON public.media_lists_with_counts TO authenticated;
