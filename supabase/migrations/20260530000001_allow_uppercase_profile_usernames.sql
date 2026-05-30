-- Allow mixed-case usernames while preserving case-insensitive uniqueness.

ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_username_format_check;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_username_format_check
CHECK (username IS NULL OR username ~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$');
