-- Track accounts that have been permanently deleted.
-- A BEFORE DELETE trigger on user_profiles writes a tombstone row here
-- before the cascade wipes the profile. This lets admins see historical
-- totals (active + deleted = total ever registered).

CREATE TABLE IF NOT EXISTS public.deleted_users_log (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL,
  email         text,
  display_name  text,
  username      text,
  original_created_at timestamptz,
  deleted_at    timestamptz DEFAULT now() NOT NULL
);

-- Only admins / super_admins may read this table
ALTER TABLE public.deleted_users_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_users_log FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view deleted users log"
  ON public.deleted_users_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- Trigger function: copy profile data before the row is removed
CREATE OR REPLACE FUNCTION public.log_deleted_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.deleted_users_log
    (user_id, email, display_name, username, original_created_at)
  VALUES
    (OLD.user_id, OLD.email, OLD.display_name, OLD.username, OLD.created_at);
  RETURN OLD;
END;
$$;

-- Fire before each profile row is deleted (catches both direct deletes and cascades)
CREATE TRIGGER on_user_profile_deleted
  BEFORE DELETE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_deleted_user();
