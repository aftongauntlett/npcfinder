-- Migration: Add Server-Side Rate Limiting (H2)
-- Created: 2025-12-07
-- Purpose: Implement server-side rate limiting to prevent client-side bypass attacks

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  first_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key)
);

-- Index for efficient queries
CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_blocked_until ON rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;
CREATE INDEX idx_rate_limits_first_attempt ON rate_limits(first_attempt);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check their own rate limits (read-only)
CREATE POLICY "Users can check own rate limits" ON rate_limits
  FOR SELECT
  USING (
    key LIKE 'signin:%' || COALESCE(auth.email(), '') || '%' 
    OR key LIKE 'signup:%' || COALESCE(auth.email(), '') || '%'
    OR key LIKE 'invite:%' || COALESCE(auth.email(), '') || '%'
  );

-- Allow check_rate_limit function to insert rate limit records
CREATE POLICY "Function can insert rate limits" ON rate_limits
  FOR INSERT
  WITH CHECK (true);

-- Allow check_rate_limit function to update rate limit records
CREATE POLICY "Function can update rate limits" ON rate_limits
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_attempts INTEGER,
  p_window_minutes INTEGER,
  p_block_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Calculate window start time
  v_window_start := v_now - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get existing rate limit record with lock
  SELECT * INTO v_record FROM rate_limits WHERE key = p_key FOR UPDATE;
  
  -- Check if currently blocked
  IF v_record.blocked_until IS NOT NULL AND v_now < v_record.blocked_until THEN
    RETURN FALSE;
  END IF;
  
  -- If no record or window expired, allow and reset
  IF v_record IS NULL OR v_record.first_attempt < v_window_start THEN
    INSERT INTO rate_limits (key, attempts, first_attempt, blocked_until)
    VALUES (p_key, 1, v_now, NULL)
    ON CONFLICT (key) DO UPDATE
    SET attempts = 1, 
        first_attempt = v_now, 
        blocked_until = NULL;
    RETURN TRUE;
  END IF;
  
  -- Check if next attempt would exceed limit
  IF v_record.attempts >= p_max_attempts THEN
    -- Update block time if not already set
    IF v_record.blocked_until IS NULL THEN
      UPDATE rate_limits
      SET blocked_until = v_now + (p_block_minutes || ' minutes')::INTERVAL
      WHERE key = p_key;
    END IF;
    RETURN FALSE;
  END IF;
  
  -- Increment attempts (still within limit)
  UPDATE rate_limits
  SET attempts = attempts + 1
  WHERE key = p_key;
  
  RETURN TRUE;
END;
$$;

-- Add comment
COMMENT ON FUNCTION check_rate_limit IS 'Server-side rate limiting to prevent client-side bypass. Returns TRUE if action is allowed, FALSE if rate limit exceeded.';

-- Cleanup function to remove old records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete records older than 24 hours that are no longer blocked
  DELETE FROM rate_limits
  WHERE (blocked_until IS NULL OR blocked_until < NOW())
    AND first_attempt < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION cleanup_rate_limits IS 'Removes old rate limit records. Should be called periodically (e.g., daily cron job).';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon;

-- Note: cleanup_rate_limits should only be called by service role or scheduled job
