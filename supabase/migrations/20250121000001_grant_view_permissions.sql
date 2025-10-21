-- Grant permissions to movie_recommendations_with_users view
-- This view joins movie_recommendations with user_profiles to include sender/recipient names

-- Grant SELECT permission to authenticated users
GRANT SELECT ON movie_recommendations_with_users TO authenticated;

-- Enable RLS on the view (inherits from underlying table)
ALTER VIEW movie_recommendations_with_users SET (security_barrier = true);

-- Note: RLS policies are inherited from the movie_recommendations table
-- Users can only see recommendations where they are either the sender or recipient
