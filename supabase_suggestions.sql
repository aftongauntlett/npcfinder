-- Suggestions Table Schema
-- For tracking feature suggestions and improvements from users

-- Create the suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'considering', 'in-progress', 'done')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);

-- Create an index on created_by for faster user lookups
CREATE INDEX IF NOT EXISTS idx_suggestions_created_by ON suggestions(created_by);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone authenticated can read all suggestions
CREATE POLICY "Anyone can view suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Anyone authenticated can insert their own suggestions
CREATE POLICY "Users can create suggestions"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy 3: Only admins can update suggestions
-- Replace 'YOUR_ADMIN_USER_ID' with your actual user ID from auth.users
CREATE POLICY "Only admins can update suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'aftongauntlett@gmail.com' -- Replace with your email
    )
  );

-- Policy 4: Only admins can delete suggestions
CREATE POLICY "Only admins can delete suggestions"
  ON suggestions
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'aftongauntlett@gmail.com' -- Replace with your email
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before updates
CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view that joins with user profiles for display names
CREATE OR REPLACE VIEW suggestions_with_users AS
SELECT 
  s.*,
  COALESCE(p.display_name, u.email) as creator_name
FROM suggestions s
LEFT JOIN auth.users u ON s.created_by = u.id
LEFT JOIN user_profiles p ON s.created_by = p.user_id;
