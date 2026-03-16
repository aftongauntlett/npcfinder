-- Security hardening: remove open write policies from rate_limits

DROP POLICY IF EXISTS "Function can insert rate limits" ON rate_limits;
DROP POLICY IF EXISTS "Function can update rate limits" ON rate_limits;
