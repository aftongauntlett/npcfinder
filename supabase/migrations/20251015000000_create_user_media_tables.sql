-- Create user_music table
CREATE TABLE IF NOT EXISTS user_music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- iTunes ID (e.g., "album-123456" or "track-789012")
  title TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('album', 'track', 'artist')),
  artist TEXT,
  album TEXT, -- For tracks only
  year INTEGER,
  poster_url TEXT, -- Album artwork URL from iTunes
  genre TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_status TEXT CHECK (user_status IN ('saved', 'to-listen')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, external_id)
);

-- Create user_books table
CREATE TABLE IF NOT EXISTS user_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- Google Books ID
  title TEXT NOT NULL,
  author TEXT,
  year INTEGER,
  poster_url TEXT, -- Book cover URL from Google Books
  isbn TEXT,
  pages INTEGER,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_status TEXT CHECK (user_status IN ('read', 'to-read', 'reading')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, external_id)
);

-- Create user_games table
CREATE TABLE IF NOT EXISTS user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- RAWG game ID
  title TEXT NOT NULL,
  year INTEGER,
  poster_url TEXT, -- Game cover URL from RAWG
  platforms TEXT[], -- Array of platform names
  genres TEXT[],
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_status TEXT CHECK (user_status IN ('played', 'to-play', 'playing')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, external_id)
);

-- Create user_movies table
CREATE TABLE IF NOT EXISTS user_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- TMDB ID
  title TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  year INTEGER,
  poster_url TEXT, -- Poster URL from TMDB
  genres TEXT[],
  runtime INTEGER, -- In minutes
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_status TEXT CHECK (user_status IN ('watched', 'to-watch', 'watching')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, external_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_music_user_id ON user_music(user_id);
CREATE INDEX IF NOT EXISTS idx_user_music_status ON user_music(user_status);
CREATE INDEX IF NOT EXISTS idx_user_music_created ON user_music(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_books_user_id ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_status ON user_books(user_status);
CREATE INDEX IF NOT EXISTS idx_user_books_created ON user_books(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_games_user_id ON user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_games_status ON user_games(user_status);
CREATE INDEX IF NOT EXISTS idx_user_games_created ON user_games(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_status ON user_movies(user_status);
CREATE INDEX IF NOT EXISTS idx_user_movies_created ON user_movies(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_movies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_music
CREATE POLICY "Users can view their own music"
  ON user_music FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music"
  ON user_music FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music"
  ON user_music FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music"
  ON user_music FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_books
CREATE POLICY "Users can view their own books"
  ON user_books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books"
  ON user_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
  ON user_books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
  ON user_books FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_games
CREATE POLICY "Users can view their own games"
  ON user_games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own games"
  ON user_games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games"
  ON user_games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games"
  ON user_games FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_movies
CREATE POLICY "Users can view their own movies"
  ON user_movies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movies"
  ON user_movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movies"
  ON user_movies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movies"
  ON user_movies FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically update updated_at
CREATE TRIGGER update_user_music_updated_at
  BEFORE UPDATE ON user_music
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_books_updated_at
  BEFORE UPDATE ON user_books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_games_updated_at
  BEFORE UPDATE ON user_games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_movies_updated_at
  BEFORE UPDATE ON user_movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
