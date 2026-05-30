-- Add profile metadata, private friend tags, and durable invite lineage tracking.
--
-- Goals:
-- 1) Support profile routes by username.
-- 2) Support private per-user tags for organizing people.
-- 3) Persist inviter lineage even when invite_codes rows are deleted.

-- -----------------------------------------------------------------------------
-- USER_PROFILES: Add profile fields needed for profile pages
-- -----------------------------------------------------------------------------

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS personal_links jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS invited_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.user_profiles.username IS
  'Public handle used for profile routing (e.g. /app/profile/:username).';
COMMENT ON COLUMN public.user_profiles.birthday IS
  'Optional birthday for profile display.';
COMMENT ON COLUMN public.user_profiles.location IS
  'Optional location for profile display.';
COMMENT ON COLUMN public.user_profiles.personal_links IS
  'Optional personal links as a JSON array of URL strings.';
COMMENT ON COLUMN public.user_profiles.invited_by_user_id IS
  'Snapshot of who invited this user into the app; set at invite consumption time.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_username_format_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_username_format_check
      CHECK (username IS NULL OR username ~ '^[a-z0-9][a-z0-9._-]{2,29}$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_profiles_personal_links_array_check'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_personal_links_array_check
      CHECK (jsonb_typeof(personal_links) = 'array');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_unique_username(base_text text, p_user_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  normalized text;
  candidate text;
  suffix integer := 0;
BEGIN
  normalized := lower(coalesce(base_text, ''));
  normalized := regexp_replace(normalized, '[^a-z0-9._-]+', '_', 'g');
  normalized := regexp_replace(normalized, '^[_\.-]+|[_\.-]+$', '', 'g');

  IF normalized = '' THEN
    normalized := 'user';
  END IF;

  normalized := substring(normalized FROM 1 FOR 24);
  IF char_length(normalized) < 3 THEN
    normalized := rpad(normalized, 3, '0');
  END IF;

  candidate := normalized;

  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE lower(up.username) = lower(candidate)
        AND (p_user_id IS NULL OR up.user_id <> p_user_id)
    );

    suffix := suffix + 1;
    candidate := substring(normalized FROM 1 FOR GREATEST(1, 24 - char_length(suffix::text) - 1))
      || '_' || suffix::text;
  END LOOP;

  IF char_length(candidate) < 3 THEN
    candidate := rpad(candidate, 3, '0');
  END IF;

  RETURN candidate;
END;
$$;

DO $$
DECLARE
  profile_row record;
  base_value text;
BEGIN
  FOR profile_row IN
    SELECT user_id, display_name, email
    FROM public.user_profiles
    WHERE username IS NULL OR btrim(username) = ''
    ORDER BY created_at NULLS FIRST, user_id
  LOOP
    base_value := COALESCE(
      NULLIF(profile_row.display_name, ''),
      NULLIF(split_part(COALESCE(profile_row.email, ''), '@', 1), ''),
      'user'
    );

    UPDATE public.user_profiles
    SET username = public.generate_unique_username(base_value, profile_row.user_id)
    WHERE user_id = profile_row.user_id;
  END LOOP;
END $$;

-- Final fallback for any edge case rows still null.
UPDATE public.user_profiles
SET username = public.generate_unique_username('user_' || substring(user_id::text, 1, 8), user_id)
WHERE username IS NULL OR btrim(username) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username_unique
  ON public.user_profiles (lower(username));

ALTER TABLE public.user_profiles
ALTER COLUMN username SET NOT NULL;

-- Ensure new auth users always receive a username.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
  base_username text;
  next_username text;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'user'
  );

  next_username := public.generate_unique_username(base_username, NEW.id);

  INSERT INTO public.user_profiles (user_id, display_name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email,
    next_username
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    display_name = COALESCE(user_profiles.display_name, EXCLUDED.display_name),
    username = COALESCE(user_profiles.username, EXCLUDED.username);

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- FRIEND TAGS: private per-user categorization of other users
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.friend_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friend_tags_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT friend_tags_color_format_check CHECK (
    color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  CONSTRAINT friend_tags_owner_id_pair_unique UNIQUE (id, owner_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_friend_tags_owner_name_unique
  ON public.friend_tags (owner_user_id, lower(name));

CREATE TABLE IF NOT EXISTS public.friend_tag_members (
  tag_id uuid NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tag_id, target_user_id),
  CONSTRAINT friend_tag_members_owner_not_self CHECK (owner_user_id <> target_user_id),
  CONSTRAINT friend_tag_members_tag_owner_fkey
    FOREIGN KEY (tag_id, owner_user_id)
    REFERENCES public.friend_tags(id, owner_user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_friend_tag_members_owner_target
  ON public.friend_tag_members (owner_user_id, target_user_id);

ALTER TABLE public.friend_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_tag_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friend_tags_owner_select" ON public.friend_tags;
CREATE POLICY "friend_tags_owner_select" ON public.friend_tags
FOR SELECT TO authenticated
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "friend_tags_owner_insert" ON public.friend_tags;
CREATE POLICY "friend_tags_owner_insert" ON public.friend_tags
FOR INSERT TO authenticated
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "friend_tags_owner_update" ON public.friend_tags;
CREATE POLICY "friend_tags_owner_update" ON public.friend_tags
FOR UPDATE TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "friend_tags_owner_delete" ON public.friend_tags;
CREATE POLICY "friend_tags_owner_delete" ON public.friend_tags
FOR DELETE TO authenticated
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "friend_tag_members_owner_select" ON public.friend_tag_members;
CREATE POLICY "friend_tag_members_owner_select" ON public.friend_tag_members
FOR SELECT TO authenticated
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "friend_tag_members_owner_insert" ON public.friend_tag_members;
CREATE POLICY "friend_tag_members_owner_insert" ON public.friend_tag_members
FOR INSERT TO authenticated
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "friend_tag_members_owner_delete" ON public.friend_tag_members;
CREATE POLICY "friend_tag_members_owner_delete" ON public.friend_tag_members
FOR DELETE TO authenticated
USING (owner_user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friend_tags TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.friend_tag_members TO authenticated;

COMMENT ON TABLE public.friend_tags IS
  'Private user-defined tags for organizing people in the app.';
COMMENT ON TABLE public.friend_tag_members IS
  'Membership rows linking users to an owner''s private friend tags.';

-- -----------------------------------------------------------------------------
-- INVITE LINEAGE: preserve inviter snapshot in audit log and profile
-- -----------------------------------------------------------------------------

ALTER TABLE public.invite_code_audit_log
ADD COLUMN IF NOT EXISTS inviter_user_id uuid,
ADD COLUMN IF NOT EXISTS invite_code_text text,
ADD COLUMN IF NOT EXISTS intended_email_snapshot text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invite_code_audit_log_inviter_user_id_fkey'
  ) THEN
    ALTER TABLE public.invite_code_audit_log
      ADD CONSTRAINT invite_code_audit_log_inviter_user_id_fkey
      FOREIGN KEY (inviter_user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invite_code_audit_log_used_by
  ON public.invite_code_audit_log (used_by);
CREATE INDEX IF NOT EXISTS idx_invite_code_audit_log_inviter
  ON public.invite_code_audit_log (inviter_user_id);

CREATE OR REPLACE FUNCTION public.consume_invite_code(code_value text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
  invite_record record;
  code_exists boolean;
  target_user_id uuid;
BEGIN
  target_user_id := user_id;

  -- Security guard: Verify user_id matches authenticated user
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'User ID mismatch: cannot consume invite code for another user';
  END IF;

  -- Check if code exists and is valid
  SELECT EXISTS(
    SELECT 1
    FROM public.invite_codes
    WHERE code = code_value
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND current_uses < max_uses
  ) INTO code_exists;

  IF NOT code_exists THEN
    RETURN false;
  END IF;

  -- Get the invite code record with row lock to prevent race conditions
  SELECT * INTO invite_record
  FROM public.invite_codes
  WHERE code = code_value
  FOR UPDATE;

  -- Update the code usage tracking
  UPDATE public.invite_codes
  SET
    current_uses = current_uses + 1,
    used_by = CASE
      WHEN current_uses = 0 THEN target_user_id
      ELSE used_by
    END,
    used_at = CASE
      WHEN current_uses = 0 THEN NOW()
      ELSE used_at
    END
  WHERE code = code_value;

  -- Insert audit log entry to track all code usage with inviter snapshots.
  INSERT INTO public.invite_code_audit_log (
    code_id,
    used_by,
    used_at,
    inviter_user_id,
    invite_code_text,
    intended_email_snapshot
  )
  VALUES (
    invite_record.id,
    target_user_id,
    NOW(),
    invite_record.created_by,
    invite_record.code,
    invite_record.intended_email
  );

  -- Persist inviter lineage directly on the profile for fast reads.
  IF invite_record.created_by IS NOT NULL THEN
    UPDATE public.user_profiles
    SET invited_by_user_id = COALESCE(invited_by_user_id, invite_record.created_by)
    WHERE user_id = target_user_id;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.consume_invite_code(code_value text, user_id uuid) IS
  'Consumes an invite code for user registration with lineage snapshots.
Features:
- Validates user_id matches authenticated caller (security)
- Uses row-level locking to prevent race conditions
- Increments current_uses counter
- Sets used_by and used_at on first use
- Inserts audit log entry for all usages
- Snapshots inviter_user_id, invite_code_text, and intended_email
- Persists invited_by_user_id on user_profiles for lineage queries
- Returns true on success, false if code invalid/expired/maxed out.';