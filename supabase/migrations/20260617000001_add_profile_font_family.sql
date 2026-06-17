ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'system';

ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_font_family_check;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_font_family_check
CHECK (
  font_family IS NULL
  OR font_family IN (
    'system',
    'roboto',
    'montserrat',
    'serif',
    'handwritten',
    'retro',
    'mono'
  )
);

COMMENT ON COLUMN public.user_profiles.font_family IS 'User-selected global app font family from the Settings appearance picker.';
