# Rate Limiting Implementation Guide

**Status**: Optional - Not Currently Implemented  
**Priority**: Low (implement only if abuse occurs)  
**Last Updated**: November 16, 2025

---

## Current State

### What We Have

**Client-Side API Rate Limiting** (`src/utils/rateLimiter.ts`):

- Prevents hitting external API rate limits
- Configured per API provider:
  - TMDB: 4 requests/second
  - OMDB: 2 requests/second
  - iTunes: 5 requests/second
  - Google Books: 1 request/second
- **Purpose**: Protect external API quotas, not abuse prevention

### What We Don't Have

**No User Action Rate Limiting**:

- ❌ Invite code creation (admin actions)
- ❌ Recommendation sending
- ❌ Review posting
- ❌ User search queries
- ❌ Connection requests

---

## Risk Assessment

### Why Rate Limiting Is Optional

**Low Risk Context**:

1. **Invite-Only System**: Limited, curated user base
2. **Friend-Group Application**: Users are trusted
3. **Natural Limits**: Supabase free tier enforces database query limits
4. **Observable**: Can monitor usage via Supabase dashboard
5. **Small Scale**: Not a public-facing service

### When to Implement Rate Limiting

Consider implementing if you observe:

- Unusual spike in database operations (check Supabase dashboard)
- Single user creating excessive recommendations/reviews
- Rapid-fire invite code generation
- Before expanding beyond friend group to larger user base
- If someone reports suspicious activity

---

## Implementation Options

### Option 1: Database-Level Rate Limiting ⭐ SIMPLEST

**Pros**:

- No new infrastructure
- Uses existing PostgreSQL features
- Free
- Works with current Supabase setup

**Cons**:

- Adds database queries for every rate-limited action
- Cleanup of old rate limit records needed
- Less flexible than dedicated solutions

**Implementation Steps**:

1. **Create Rate Limit Table**:

```sql
-- Migration: supabase/migrations/YYYYMMDD_add_rate_limiting.sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Index for fast lookups
  INDEX idx_rate_limits_user_action_time ON rate_limits(user_id, action_type, created_at)
);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limits
CREATE POLICY "Users can view own rate limits"
  ON rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Automatic cleanup of old records (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Run cleanup daily
-- (Configure via Supabase Dashboard → Database → Cron Jobs)
```

2. **Create Rate Limit Check Function**:

```sql
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_requests INT,
  p_window_minutes INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_count INT;
BEGIN
  -- Count requests in time window
  SELECT COUNT(*)
  INTO v_request_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- If under limit, log this request and allow
  IF v_request_count < p_max_requests THEN
    INSERT INTO rate_limits (user_id, action_type)
    VALUES (p_user_id, p_action_type);
    RETURN TRUE;
  END IF;

  -- Over limit
  RETURN FALSE;
END;
$$;
```

3. **Use in Application Code**:

```typescript
// src/lib/rateLimit.ts
import { supabase } from "./supabase";

export async function checkRateLimit(
  actionType: string,
  maxRequests: number,
  windowMinutes: number
): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_user_id: user.user.id,
    p_action_type: actionType,
    p_max_requests: maxRequests,
    p_window_minutes: windowMinutes,
  });

  if (error) throw error;
  return data;
}

// Example usage in service
export async function sendRecommendation(
  recommendationData: NewRecommendation
) {
  // Check: max 50 recommendations per day
  const allowed = await checkRateLimit("send_recommendation", 50, 24 * 60);

  if (!allowed) {
    throw new Error(
      "Rate limit exceeded. You can send 50 recommendations per day."
    );
  }

  // ... proceed with recommendation creation
}
```

**Suggested Limits**:

```typescript
// src/config/rateLimits.ts
export const RATE_LIMITS = {
  SEND_RECOMMENDATION: { max: 50, windowMinutes: 24 * 60 }, // 50/day
  CREATE_REVIEW: { max: 20, windowMinutes: 60 }, // 20/hour
  CREATE_INVITE_CODE: { max: 10, windowMinutes: 24 * 60 }, // 10/day (admin)
  SEARCH_USERS: { max: 100, windowMinutes: 60 }, // 100/hour
  SEND_CONNECTION_REQUEST: { max: 20, windowMinutes: 60 }, // 20/hour
} as const;
```

---

### Option 2: Supabase Edge Functions + Upstash Redis ⭐ RECOMMENDED (if implementing)

**Pros**:

- Industry-standard approach
- Fast (in-memory Redis)
- Flexible rate limiting algorithms
- Upstash free tier: 10K requests/day
- No database pollution

**Cons**:

- Requires Upstash Redis setup
- More complex than database approach
- Adds external dependency

**Implementation Steps**:

1. **Setup Upstash Redis**:

   - Sign up at https://upstash.com
   - Create Redis database (free tier)
   - Get `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

2. **Configure Supabase Secrets**:

   ```bash
   supabase secrets set UPSTASH_REDIS_REST_URL=your_url
   supabase secrets set UPSTASH_REDIS_REST_TOKEN=your_token
   ```

3. **Create Edge Function**:

   ```typescript
   // supabase/functions/rate-limit/index.ts
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
   import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
   import { Redis } from "https://esm.sh/@upstash/redis@1.20.1";

   const redis = new Redis({
     url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
     token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
   });

   serve(async (req) => {
     const { actionType, maxRequests, windowSeconds } = await req.json();

     // Get user from auth header
     const supabase = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_ANON_KEY")!,
       {
         global: {
           headers: { Authorization: req.headers.get("Authorization")! },
         },
       }
     );

     const {
       data: { user },
       error: authError,
     } = await supabase.auth.getUser();
     if (authError || !user) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), {
         status: 401,
       });
     }

     // Check rate limit using sliding window
     const key = `rate_limit:${user.id}:${actionType}`;
     const now = Date.now();
     const windowStart = now - windowSeconds * 1000;

     // Remove old entries
     await redis.zremrangebyscore(key, 0, windowStart);

     // Count current requests
     const count = await redis.zcard(key);

     if (count >= maxRequests) {
       return new Response(JSON.stringify({ allowed: false }), { status: 200 });
     }

     // Add this request
     await redis.zadd(key, { score: now, member: now.toString() });
     await redis.expire(key, windowSeconds);

     return new Response(JSON.stringify({ allowed: true }), { status: 200 });
   });
   ```

4. **Deploy Edge Function**:

   ```bash
   supabase functions deploy rate-limit
   ```

5. **Use in Application**:

   ```typescript
   // src/lib/rateLimit.ts
   import { supabase } from "./supabase";

   export async function checkRateLimit(
     actionType: string,
     maxRequests: number,
     windowSeconds: number
   ): Promise<boolean> {
     const { data, error } = await supabase.functions.invoke("rate-limit", {
       body: { actionType, maxRequests, windowSeconds },
     });

     if (error) throw error;
     return data.allowed;
   }
   ```

---

### Option 3: Client-Side Throttling ⭐ QUICK FIX

**Pros**:

- Zero infrastructure
- Can extend existing `rateLimiter.ts`
- Immediate implementation
- Prevents accidental spam

**Cons**:

- Easily bypassed by malicious users
- Only prevents honest mistakes
- No server-side enforcement

**Implementation**:

```typescript
// src/utils/userActionThrottle.ts
const actionTimestamps = new Map<string, number[]>();

export function canPerformAction(
  actionType: string,
  maxActions: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const key = actionType;

  // Get existing timestamps
  const timestamps = actionTimestamps.get(key) || [];

  // Remove old timestamps outside window
  const recentTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  // Check if under limit
  if (recentTimestamps.length >= maxActions) {
    return false;
  }

  // Record this action
  recentTimestamps.push(now);
  actionTimestamps.set(key, recentTimestamps);

  return true;
}

// Example usage
export async function sendRecommendation(data: NewRecommendation) {
  // Client-side check: max 50 recommendations per day
  if (!canPerformAction("send_recommendation", 50, 24 * 60 * 60 * 1000)) {
    throw new Error(
      "Please wait before sending more recommendations (50/day limit)"
    );
  }

  // ... proceed with API call
}
```

**React Hook Pattern**:

```typescript
// src/hooks/useActionThrottle.ts
import { useState } from "react";
import { canPerformAction } from "../utils/userActionThrottle";

export function useActionThrottle(
  actionType: string,
  maxActions: number,
  windowMs: number
) {
  const [isThrottled, setIsThrottled] = useState(false);

  const checkThrottle = () => {
    const allowed = canPerformAction(actionType, maxActions, windowMs);
    setIsThrottled(!allowed);
    return allowed;
  };

  return { isThrottled, checkThrottle };
}

// Usage in component
function SendRecommendationButton() {
  const { isThrottled, checkThrottle } = useActionThrottle(
    "send_recommendation",
    50,
    24 * 60 * 60 * 1000
  );

  const handleClick = async () => {
    if (!checkThrottle()) {
      toast.error("Rate limit reached. Try again later.");
      return;
    }

    await sendRecommendation(data);
  };

  return (
    <Button onClick={handleClick} disabled={isThrottled}>
      Send Recommendation
    </Button>
  );
}
```

---

## Recommended Approach

**For Now**: Do nothing. Monitor Supabase usage dashboard for unusual patterns.

**If Rate Limiting Becomes Necessary**:

1. Start with **Option 3** (client-side throttling) - quick and prevents accidental spam
2. If actual abuse occurs, upgrade to **Option 1** (database-level) - no new infrastructure
3. If scaling beyond friend group, consider **Option 2** (Upstash Redis) - industry standard

---

## Monitoring

### Without Rate Limiting

**Watch Supabase Dashboard**:

- Database → Performance Insights
- Database → Query Performance
- Look for:
  - Unusual spikes in table writes
  - Single user responsible for high % of operations
  - Repeated identical queries

**Set Up Alerts**:

- Supabase Dashboard → Project Settings → Alerts
- Configure email alerts for:
  - Database CPU usage > 80%
  - Database storage > 80%
  - API requests spike

### With Rate Limiting

**Database Approach**:

```sql
-- Check top rate-limited users
SELECT
  user_id,
  action_type,
  COUNT(*) as request_count,
  MAX(created_at) as last_request
FROM rate_limits
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, action_type
ORDER BY request_count DESC
LIMIT 20;
```

**Upstash Approach**:

- Upstash Dashboard → Analytics
- View request patterns and rate limit hits

---

## Testing Rate Limits

### Manual Testing

```typescript
// tests/rateLimiting.test.ts
import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../src/lib/rateLimit";

describe("Rate Limiting", () => {
  it("should allow requests under limit", async () => {
    for (let i = 0; i < 5; i++) {
      const allowed = await checkRateLimit("test_action", 10, 60);
      expect(allowed).toBe(true);
    }
  });

  it("should block requests over limit", async () => {
    // Exhaust limit
    for (let i = 0; i < 10; i++) {
      await checkRateLimit("test_action_2", 10, 60);
    }

    // Next request should be blocked
    const allowed = await checkRateLimit("test_action_2", 10, 60);
    expect(allowed).toBe(false);
  });

  it("should reset after window expires", async () => {
    // This requires time manipulation or waiting
    // Consider using fake timers
  });
});
```

---

## Cost Analysis

### Option 1: Database-Level

- **Cost**: $0 (uses existing Supabase)
- **Supabase Impact**: Minimal (1 extra query per rate-limited action)
- **Storage**: ~1KB per 100 rate limit records

### Option 2: Upstash Redis

- **Free Tier**: 10,000 commands/day
- **Paid Tier**: $0.20 per 100K commands (if exceeding free tier)
- **Supabase Impact**: None (offloads rate limiting)

### Option 3: Client-Side

- **Cost**: $0
- **Supabase Impact**: None
- **Security**: Low (can be bypassed)

---

## Decision Matrix

| Scenario                       | Recommended Option  | Reason                              |
| ------------------------------ | ------------------- | ----------------------------------- |
| Friend group only (< 20 users) | None                | Natural usage patterns, observable  |
| Noticed unusual activity       | Option 3 → Option 1 | Quick fix, then durable solution    |
| Growing user base (50+ users)  | Option 1            | Free, sufficient for moderate scale |
| Public-facing service          | Option 2            | Industry standard, scalable         |
| Temporary protection needed    | Option 3            | Immediate deployment                |

---

## Conclusion

**Current Recommendation**: No rate limiting needed for invite-only friend group application.

**Monitoring**: Watch Supabase dashboard for unusual patterns.

**Future**: If abuse occurs, implement in order: Option 3 (quick fix) → Option 1 (durable) → Option 2 (scalable).

This guide provides all necessary information to implement rate limiting when/if it becomes necessary.

---

**Last Updated**: November 16, 2025  
**Next Review**: When user base exceeds 50 people or if abuse is observed
