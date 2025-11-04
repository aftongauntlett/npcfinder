-- Fix game_library and game_recommendations permissions and add views
-- This migration addresses two issues:
-- 1. game_library missing GRANT permissions for authenticated users
-- 2. game_recommendations needs a view for joining with user_profiles (sender/recipient names)

-- Grant table-level permissions to authenticated users for game_library
GRANT SELECT, INSERT, UPDATE, DELETE ON game_library TO authenticated;

-- Create a view that joins game_recommendations with user profiles for display names
CREATE OR REPLACE VIEW game_recommendations_with_users AS
SELECT 
  gr.*,
  from_profile.display_name as sender_name,
  to_profile.display_name as recipient_name
FROM game_recommendations gr
LEFT JOIN user_profiles from_profile ON gr.from_user_id = from_profile.user_id
LEFT JOIN user_profiles to_profile ON gr.to_user_id = to_profile.user_id;

-- Grant SELECT on view to authenticated users
GRANT SELECT ON game_recommendations_with_users TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW game_recommendations_with_users IS 'Game recommendations with sender and recipient display names for easier querying';
