-- Migration: Media Lists (per-media-page custom lists)
-- Creates tables for user-created lists, list items, and per-user sharing permissions.
-- Visibility model:
-- - is_public = true  => friends can view
-- - is_public = false => only owner + explicitly shared users
-- - explicit shares can be viewer or editor

-- -----------------------------------------------------------------------------
-- TABLE: media_lists
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.media_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- UI-level grouping used for routing/tabs
  media_domain text NOT NULL CHECK (media_domain IN ('movies-tv', 'books', 'games', 'music')),
  title text NOT NULL,
  description text NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_lists_owner_domain ON public.media_lists (owner_id, media_domain);
CREATE INDEX IF NOT EXISTS idx_media_lists_domain_public ON public.media_lists (media_domain, is_public);

DROP TRIGGER IF EXISTS update_media_lists_updated_at_trigger ON public.media_lists;
CREATE TRIGGER update_media_lists_updated_at_trigger
BEFORE UPDATE ON public.media_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.media_lists IS 'User-created media lists (per media domain) with friend visibility and explicit sharing.';
COMMENT ON COLUMN public.media_lists.is_public IS 'If true, friends can view this list. If false, only owner + explicit shares can view.';

-- -----------------------------------------------------------------------------
-- TABLE: media_list_members
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.media_list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.media_lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('viewer', 'editor')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_media_list_members_list_id ON public.media_list_members (list_id);
CREATE INDEX IF NOT EXISTS idx_media_list_members_user_id ON public.media_list_members (user_id);

DROP TRIGGER IF EXISTS update_media_list_members_updated_at_trigger ON public.media_list_members;
CREATE TRIGGER update_media_list_members_updated_at_trigger
BEFORE UPDATE ON public.media_list_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.media_list_members IS 'Explicit list sharing entries (viewer/editor). Managed by list owner.';

-- -----------------------------------------------------------------------------
-- TABLE: media_list_items
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.media_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.media_lists(id) ON DELETE CASCADE,

  -- External id from upstream providers (TMDB/RAWG/Google Books/iTunes)
  external_id text NOT NULL,

  -- DB media_type values used by UI components (MediaListItem)
  media_type text NOT NULL CHECK (media_type IN ('movie', 'tv', 'book', 'game', 'song', 'album', 'playlist')),

  -- Display/cache fields (avoid extra API calls for list rendering)
  title text NOT NULL,
  subtitle text NULL,
  poster_url text NULL,
  release_date text NULL,
  description text NULL,
  year integer NULL,
  genres text NULL,

  -- Domain-specific optional fields
  authors text NULL,
  artist text NULL,
  album text NULL,
  track_duration integer NULL,
  track_count integer NULL,
  preview_url text NULL,
  platforms text NULL,
  metacritic integer NULL,
  playtime integer NULL,
  isbn text NULL,
  page_count integer NULL,
  publisher text NULL,

  sort_order integer NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (list_id, external_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_media_list_items_list_id ON public.media_list_items (list_id);
CREATE INDEX IF NOT EXISTS idx_media_list_items_list_sort ON public.media_list_items (list_id, sort_order);

DROP TRIGGER IF EXISTS update_media_list_items_updated_at_trigger ON public.media_list_items;
CREATE TRIGGER update_media_list_items_updated_at_trigger
BEFORE UPDATE ON public.media_list_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.media_list_items IS 'Items within a media list. Contains cached display fields and optional domain-specific metadata.';

-- -----------------------------------------------------------------------------
-- VIEW: media_lists_with_counts
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS public.media_lists_with_counts;
CREATE VIEW public.media_lists_with_counts AS
SELECT
  ml.id,
  ml.owner_id,
  ml.media_domain,
  ml.title,
  ml.description,
  ml.is_public,
  ml.created_at,
  ml.updated_at,
  COALESCE(up.display_name, 'Unknown') AS owner_display_name,
  (SELECT COUNT(1) FROM public.media_list_items mli WHERE mli.list_id = ml.id) AS item_count
FROM public.media_lists ml
LEFT JOIN public.user_profiles up ON up.user_id = ml.owner_id;

COMMENT ON VIEW public.media_lists_with_counts IS 'Lists with item_count and owner display name for list index rendering.';

-- -----------------------------------------------------------------------------
-- RLS POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.media_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_list_items ENABLE ROW LEVEL SECURITY;

-- MEDIA_LISTS
DROP POLICY IF EXISTS "media_lists_select" ON public.media_lists;
CREATE POLICY "media_lists_select" ON public.media_lists
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.media_list_members m
      WHERE m.list_id = media_lists.id
        AND m.user_id = auth.uid()
    )
    OR (
      is_public = true AND EXISTS (
        SELECT 1 FROM public.connections c
        WHERE (c.user_id = auth.uid() AND c.friend_id = media_lists.owner_id)
           OR (c.friend_id = auth.uid() AND c.user_id = media_lists.owner_id)
      )
    )
  );

DROP POLICY IF EXISTS "media_lists_insert" ON public.media_lists;
CREATE POLICY "media_lists_insert" ON public.media_lists
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = owner_id
  );

DROP POLICY IF EXISTS "media_lists_update" ON public.media_lists;
CREATE POLICY "media_lists_update" ON public.media_lists
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = owner_id
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = owner_id
  );

DROP POLICY IF EXISTS "media_lists_delete" ON public.media_lists;
CREATE POLICY "media_lists_delete" ON public.media_lists
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR auth.uid() = owner_id
  );

-- MEDIA_LIST_MEMBERS
DROP POLICY IF EXISTS "media_list_members_select" ON public.media_list_members;
CREATE POLICY "media_list_members_select" ON public.media_list_members
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.media_lists ml
      WHERE ml.id = media_list_members.list_id
        AND ml.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "media_list_members_insert" ON public.media_list_members;
CREATE POLICY "media_list_members_insert" ON public.media_list_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR (
      invited_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.media_lists ml
        WHERE ml.id = media_list_members.list_id
          AND ml.owner_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM public.connections c
        WHERE (c.user_id = auth.uid() AND c.friend_id = media_list_members.user_id)
           OR (c.friend_id = auth.uid() AND c.user_id = media_list_members.user_id)
      )
    )
  );

DROP POLICY IF EXISTS "media_list_members_update" ON public.media_list_members;
CREATE POLICY "media_list_members_update" ON public.media_list_members
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.media_lists ml
      WHERE ml.id = media_list_members.list_id
        AND ml.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.media_lists ml
      WHERE ml.id = media_list_members.list_id
        AND ml.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "media_list_members_delete" ON public.media_list_members;
CREATE POLICY "media_list_members_delete" ON public.media_list_members
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.media_lists ml
      WHERE ml.id = media_list_members.list_id
        AND ml.owner_id = auth.uid()
    )
  );

-- MEDIA_LIST_ITEMS
DROP POLICY IF EXISTS "media_list_items_select" ON public.media_list_items;
CREATE POLICY "media_list_items_select" ON public.media_list_items
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.media_lists ml
      WHERE ml.id = media_list_items.list_id
        AND (
          ml.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.media_list_members m
            WHERE m.list_id = ml.id
              AND m.user_id = auth.uid()
          )
          OR (
            ml.is_public = true AND EXISTS (
              SELECT 1 FROM public.connections c
              WHERE (c.user_id = auth.uid() AND c.friend_id = ml.owner_id)
                 OR (c.friend_id = auth.uid() AND c.user_id = ml.owner_id)
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "media_list_items_insert" ON public.media_list_items;
CREATE POLICY "media_list_items_insert" ON public.media_list_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.media_lists ml
      WHERE ml.id = media_list_items.list_id
        AND ml.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.media_list_members m
      WHERE m.list_id = media_list_items.list_id
        AND m.user_id = auth.uid()
        AND m.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "media_list_items_update" ON public.media_list_items;
CREATE POLICY "media_list_items_update" ON public.media_list_items
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.media_lists ml
      WHERE ml.id = media_list_items.list_id
        AND ml.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.media_list_members m
      WHERE m.list_id = media_list_items.list_id
        AND m.user_id = auth.uid()
        AND m.role = 'editor'
    )
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.media_lists ml
      WHERE ml.id = media_list_items.list_id
        AND ml.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.media_list_members m
      WHERE m.list_id = media_list_items.list_id
        AND m.user_id = auth.uid()
        AND m.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "media_list_items_delete" ON public.media_list_items;
CREATE POLICY "media_list_items_delete" ON public.media_list_items
  FOR DELETE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.media_lists ml
      WHERE ml.id = media_list_items.list_id
        AND ml.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.media_list_members m
      WHERE m.list_id = media_list_items.list_id
        AND m.user_id = auth.uid()
        AND m.role = 'editor'
    )
  );
