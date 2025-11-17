-- Add email column to user_profiles and sync from auth.users
-- This fixes the issue where email shows as N/A in the UI

-- Step 1: Add email column
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Step 3: Backfill existing users' emails from auth.users
UPDATE public.user_profiles
SET email = auth.users.email
FROM auth.users
WHERE user_profiles.user_id = auth.users.id
AND user_profiles.email IS NULL;

-- Step 4: Update the handle_new_user() function to include email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.email
    ),
    NEW.email  -- Add email sync
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    display_name = COALESCE(user_profiles.display_name, EXCLUDED.display_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger to sync email updates
CREATE OR REPLACE FUNCTION sync_user_email_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles when auth.users email changes
  UPDATE public.user_profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email updates
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_user_email_on_update();

-- Add comment
COMMENT ON COLUMN public.user_profiles.email IS 'Synced from auth.users.email via trigger';
