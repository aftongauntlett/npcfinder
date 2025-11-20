-- Add missing auth trigger to auto-create user profiles on signup
-- This trigger was accidentally omitted from the baseline migration
-- It calls handle_new_user() which creates the user_profiles row

-- The function already exists in the baseline, we just need the trigger

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Note: Cannot add COMMENT on auth.users (managed by Supabase)
-- This trigger automatically creates user_profiles row when new user signs up
-- Calls handle_new_user() which:
-- - Creates user_profiles entry with display_name and email
-- - Sets is_admin to false by default (first user must be manually promoted)
-- - Syncs metadata from auth.users.raw_user_meta_data
