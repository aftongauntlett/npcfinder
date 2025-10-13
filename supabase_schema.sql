-- NPC Finder Database Schema
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- 1. MEDIA ITEMS TABLE
-- Stores all movies, TV shows, games, and books
-- ============================================
CREATE TABLE media_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('movie', 'tv', 'game', 'book')),
  title TEXT NOT NULL,
  subtitle TEXT,
  external_id TEXT,
  release_year INTEGER,
  description TEXT,
  poster_url TEXT,
  genres TEXT[],
  runtime INTEGER,
  critic_rating DECIMAL(3,1),
  audience_rating DECIMAL(3,1),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_type ON media_items(type);
CREATE INDEX idx_media_title ON media_items(title);

-- ============================================
-- 2. USER MEDIA TABLE
-- Personal tracking: ratings, status, notes
-- ============================================
CREATE TABLE user_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'completed', 'in-progress', 'to-watch', 'to-play', 'to-read', 
    'watching', 'playing', 'reading', 'dropped'
  )),
  personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 5),
  notes TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, media_id)
);

CREATE INDEX idx_user_media_user ON user_media(user_id);
CREATE INDEX idx_user_media_status ON user_media(status);

-- ============================================
-- 3. FRIENDS TABLE
-- Friend relationships
-- ============================================
CREATE TABLE friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user ON friends(user_id);
CREATE INDEX idx_friends_status ON friends(status);

-- ============================================
-- 4. TOP LISTS TABLE
-- Custom top 10 lists
-- ============================================
CREATE TABLE top_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('movie', 'tv', 'game', 'book')),
  title TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_top_lists_user ON top_lists(user_id);
CREATE INDEX idx_top_lists_type ON top_lists(type);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- Security policies for data access
-- ============================================

-- Enable RLS on all tables
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_lists ENABLE ROW LEVEL SECURITY;

-- Media Items: Everyone can view (read-only)
CREATE POLICY "Media items are viewable by everyone"
  ON media_items FOR SELECT
  USING (true);

-- Media Items: Authenticated users can insert new items
CREATE POLICY "Authenticated users can add media items"
  ON media_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User Media: Users can view their own media
CREATE POLICY "Users can view own media"
  ON user_media FOR SELECT
  USING (auth.uid() = user_id);

-- User Media: Users can insert their own media
CREATE POLICY "Users can insert own media"
  ON user_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Media: Users can update their own media
CREATE POLICY "Users can update own media"
  ON user_media FOR UPDATE
  USING (auth.uid() = user_id);

-- User Media: Users can delete their own media
CREATE POLICY "Users can delete own media"
  ON user_media FOR DELETE
  USING (auth.uid() = user_id);

-- User Media: Friends can view each other's media
CREATE POLICY "Friends can view each others media"
  ON user_media FOR SELECT
  USING (
    user_id IN (
      SELECT friend_id FROM friends
      WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM friends
      WHERE friend_id = auth.uid() AND status = 'accepted'
    )
  );

-- Friends: Users can view their own friend requests
CREATE POLICY "Users can view own friends"
  ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friends: Users can create friend requests
CREATE POLICY "Users can create friend requests"
  ON friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Friends: Users can update friend requests they're involved in
CREATE POLICY "Users can update own friend requests"
  ON friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Top Lists: Users can view their own lists
CREATE POLICY "Users can view own top lists"
  ON top_lists FOR SELECT
  USING (auth.uid() = user_id);

-- Top Lists: Users can view public lists
CREATE POLICY "Everyone can view public lists"
  ON top_lists FOR SELECT
  USING (is_public = true);

-- Top Lists: Users can create their own lists
CREATE POLICY "Users can create own top lists"
  ON top_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Top Lists: Users can update their own lists
CREATE POLICY "Users can update own top lists"
  ON top_lists FOR UPDATE
  USING (auth.uid() = user_id);

-- Top Lists: Users can delete their own lists
CREATE POLICY "Users can delete own top lists"
  ON top_lists FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update timestamps
CREATE TRIGGER update_media_items_updated_at BEFORE UPDATE ON media_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_media_updated_at BEFORE UPDATE ON user_media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_top_lists_updated_at BEFORE UPDATE ON top_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Your database is ready to use!
-- ============================================
