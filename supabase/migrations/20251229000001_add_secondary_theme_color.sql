-- Add secondary theme color support to user profiles
-- Allows users to manually set secondary color or auto-generate from primary

ALTER TABLE public.user_profiles
ADD COLUMN secondary_theme_color text,
ADD COLUMN auto_secondary_color boolean DEFAULT true NOT NULL;

-- Add constraint for secondary color format (same as primary)
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_secondary_theme_color_check
CHECK ((secondary_theme_color ~ '^#[0-9A-Fa-f]{6}$'::text) OR (secondary_theme_color IS NULL));

-- Update comment
COMMENT ON COLUMN public.user_profiles.secondary_theme_color IS 'Manual secondary theme color. If NULL and auto_secondary_color is true, will be auto-generated from theme_color';
COMMENT ON COLUMN public.user_profiles.auto_secondary_color IS 'Whether to auto-generate secondary color from primary. If false, use secondary_theme_color';