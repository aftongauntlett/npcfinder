-- Movie/TV Recommendations System (similar to music_recommendations)
CREATE TABLE IF NOT EXISTS movie_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  -- TMDB data
  external_id TEXT NOT NULL, -- TMDB movie or TV show ID
  title TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  poster_url TEXT,
  release_date TEXT, -- Store as text for flexibility (YYYY or YYYY-MM-DD)
  overview TEXT,
  
  -- Recommendation metadata
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('watch', 'rewatch')) DEFAULT 'watch',
  sent_message TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'watched', 'hit', 'miss')) DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watched_at TIMESTAMPTZ,
  
  -- Unique constraint: one recommendation per person per movie
  UNIQUE(from_user_id, to_user_id, external_id)
);

-- User Watchlist (personal movie/TV to-watch list with ordering)
CREATE TABLE IF NOT EXISTS user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  -- TMDB data
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  poster_url TEXT,
  release_date TEXT,
  overview TEXT,
  
  -- Watchlist specific fields
  list_order INTEGER NOT NULL DEFAULT 0, -- For drag-and-drop ordering
  is_public BOOLEAN NOT NULL DEFAULT false, -- Can be shown on profile
  notes TEXT, -- Personal notes about why they want to watch it
  
  -- Status tracking
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one entry per user per movie
  UNIQUE(user_id, external_id)
);

-- Watched Archive (movies/TV the user has seen with ratings)
CREATE TABLE IF NOT EXISTS user_watched_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  -- TMDB data
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  poster_url TEXT,
  release_date TEXT,
  overview TEXT,
  
  -- User ratings and notes
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
  review TEXT, -- Personal review/thoughts
  is_favorite BOOLEAN DEFAULT false,
  
  -- Timestamps
  watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one archive entry per user per movie
  UNIQUE(user_id, external_id)
);

-- Indexes for performance
CREATE INDEX idx_movie_recommendations_to_user ON movie_recommendations(to_user_id, status);
CREATE INDEX idx_movie_recommendations_from_user ON movie_recommendations(from_user_id);
CREATE INDEX idx_user_watchlist_user_order ON user_watchlist(user_id, list_order);
CREATE INDEX idx_user_watchlist_public ON user_watchlist(user_id, is_public) WHERE is_public = true;
CREATE INDEX idx_user_watched_archive_user ON user_watched_archive(user_id, watched_at DESC);
CREATE INDEX idx_user_watched_archive_rating ON user_watched_archive(user_id, rating DESC) WHERE rating IS NOT NULL;

-- Row Level Security Policies

-- movie_recommendations: users can see recommendations they sent or received
ALTER TABLE movie_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sent recommendations"
  ON movie_recommendations FOR SELECT
  USING (auth.uid() = from_user_id);

CREATE POLICY "Users can view recommendations sent to them"
  ON movie_recommendations FOR SELECT
  USING (auth.uid() = to_user_id);

CREATE POLICY "Users can insert their own recommendations"
  ON movie_recommendations FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients can update recommendation status"
  ON movie_recommendations FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- user_watchlist: users can only manage their own watchlist
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist"
  ON user_watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public watchlists (future profile feature)"
  ON user_watchlist FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert into their own watchlist"
  ON user_watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist"
  ON user_watchlist FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watchlist"
  ON user_watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- user_watched_archive: users can only manage their own archive
ALTER TABLE user_watched_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own archive"
  ON user_watched_archive FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Others can view ratings if needed (future social feature)"
  ON user_watched_archive FOR SELECT
  USING (true); -- Allow public viewing for social features (can be restricted later)

CREATE POLICY "Users can insert into their own archive"
  ON user_watched_archive FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own archive"
  ON user_watched_archive FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own archive"
  ON user_watched_archive FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_watched_archive_updated_at
  BEFORE UPDATE ON user_watched_archive
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
