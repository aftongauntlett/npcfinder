# NPC Finder Backend Security Testing Runbook

## 1. Purpose

This runbook defines manual backend security checks for Supabase Auth, PostgREST, RPC, Edge Functions, and Storage policies.
A release is blocked if any Critical test fails.

## 2. Scope

This runbook covers:

1. Authentication and token handling
2. RLS isolation for tracker and playlists
3. Invite and auth RPC behavior
4. Edge Function authentication and abuse-resistant behavior
5. Admin-only table protection
6. Storage path ownership policies

This runbook is now covered by an automated integration suite in tests/backendSecurityRunbook.test.ts.
Manual checks are still available as a fallback regression layer.

## 3. Owners

Primary owner: Engineering
Backup owner: Product and Engineering

## 4. Test Frequency

1. Before production release
2. After any migration touching policies, helper SQL functions, or table permissions
3. After changes to auth, invites, playlists, tracker, edge functions, or storage access logic

## 4.1 Automated Suite (Primary Path)

Run the automated runbook parity suite:

```bash
npm run test:backend-security
```

Execution model:

1. Uses live Supabase endpoints (auth, PostgREST, RPC, edge functions, storage)
2. Requires explicit opt-in via RUN_BACKEND_SECURITY_TESTS=true (set by npm script)
3. Reads env from .env.local plus process env
4. Seeds test data and performs service-role cleanup in afterAll

Required env variables for automated suite:

1. SUPABASE_URL (or VITE_SUPABASE_URL)
2. ANON_KEY (or VITE_SUPABASE_ANON_KEY)
3. SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
4. USER_A_EMAIL
5. USER_A_PASSWORD
6. USER_B_EMAIL
7. USER_B_PASSWORD
8. USER_C_EMAIL
9. USER_C_PASSWORD

Optional combined workflow:

1. `npm run test:backend-security:seeded`
2. This command creates or updates User A/B/C via Admin API first, then runs the automated security suite.

## 5. Required Test Accounts

Create and maintain:

1. User A (regular user)
2. User B (regular user)
3. User C (regular user, no share relationship)
4. Admin user
5. Optional super admin user for role checks

All test users should use non-personal test emails.

Automation option (no invite emails needed):

1. Seed or update the 3 runbook users via Supabase Admin API:

```bash
npm run security:seed-test-users
```

2. Full seeded execution:

```bash
npm run test:backend-security:seeded
```

3. The seed script is local-only and reads from `.env.local`.
4. The seed script does not modify role assignments; it provisions auth users and passwords for User A/B/C.

## 6. Required Secrets and Where To Find Them

In Supabase Dashboard:

1. Settings -> API
2. Copy:

- Project URL
- Anon public key
- Service role secret key

Important:

1. Anon key is used for realistic user-path testing.
2. Service role key bypasses RLS and must only be used for admin sanity checks and cleanup.
3. Never use service role key in regular user isolation tests.

## 7. Postman Environment Setup

Environment name: NPC Finder Security

Create these environment variables:

1. SUPABASE_URL
2. ANON_KEY
3. SERVICE_ROLE_KEY
4. USER_A_EMAIL
5. USER_A_PASSWORD
6. USER_B_EMAIL
7. USER_B_PASSWORD
8. USER_C_EMAIL
9. USER_C_PASSWORD
10. USER_A_TOKEN
11. USER_B_TOKEN
12. USER_C_TOKEN
13. USER_A_ID
14. USER_B_ID
15. USER_C_ID
16. MEDIA_ID_A
17. TRACKER_ID_A
18. TRACKER_ID_B
19. PLAYLIST_ID_A

## 8. Standard Headers

Use these headers unless stated otherwise:

1. apikey: use ANON_KEY for user-path tests
2. Authorization: Bearer token for authenticated user tests
3. Content-Type: application/json
4. Prefer: return=representation for insert and update requests where response rows are needed

## 9. Postman Collection Layout

Collection name: NPC Finder Security Regression

### Folder A: Token Setup

Request A1: Login User A

- Method: POST
- URL: {{SUPABASE_URL}}/auth/v1/token?grant_type=password
- Headers:
  - apikey: {{ANON_KEY}}
  - Content-Type: application/json
- Body:

```json
{
  "email": "{{USER_A_EMAIL}}",
  "password": "{{USER_A_PASSWORD}}"
}
```

- Tests tab script:

```javascript
pm.test("A1 status 200", function () {
  pm.response.to.have.status(200);
});
const j = pm.response.json();
pm.environment.set("USER_A_TOKEN", j.access_token);
pm.environment.set("USER_A_ID", j.user.id);
```

Request A2: Login User B

- Same as A1 with User B credentials
- Save USER_B_TOKEN and USER_B_ID

Request A3: Login User C

- Same as A1 with User C credentials
- Save USER_C_TOKEN and USER_C_ID

### Folder B: Anonymous Deny Checks

Request B1

- GET {{SUPABASE_URL}}/rest/v1/tracker_items?select=id&limit=1
- Headers:
  - apikey: {{ANON_KEY}}
- Expected:
  - Denied with 401 or 403
  - No data rows returned

Request B2

- GET {{SUPABASE_URL}}/rest/v1/user_profiles?select=user_id,role&limit=1
- Headers:
  - apikey: {{ANON_KEY}}
- Expected:
  - Denied with 401 or 403
  - No profile data exposed

Request B3

- POST {{SUPABASE_URL}}/functions/v1/scrape-url
- Headers:
  - apikey: {{ANON_KEY}}
  - Content-Type: application/json
- Body:

```json
{
  "url": "https://example.com"
}
```

- Expected:
  - 401 unauthorized

### Folder C: Seed Data For Isolation Tests

Request C1: Create media row as User A

- POST {{SUPABASE_URL}}/rest/v1/media
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
  - Prefer: return=representation
- Body:

```json
[
  {
    "external_id": "postman-sec-test-001",
    "media_type": "movie",
    "title": "Postman Security Test",
    "is_user_created": false
  }
]
```

- Expected:
  - 201 success
  - Response includes media id
- Save id into MEDIA_ID_A

Request C2: Add tracker item for User A

- POST {{SUPABASE_URL}}/rest/v1/tracker_items
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
  - Prefer: return=representation
- Body:

```json
[
  {
    "user_id": "{{USER_A_ID}}",
    "media_id": "{{MEDIA_ID_A}}",
    "status": "want_to"
  }
]
```

- Expected:
  - Success
  - Save id into TRACKER_ID_A

Request C3: Add tracker item for User B

- Same endpoint with User B token and USER_B_ID
- Save id into TRACKER_ID_B

### Folder D: Tracker RLS Isolation

Request D1

- GET {{SUPABASE_URL}}/rest/v1/tracker_items?select=id,user_id,media_id,status&user_id=eq.{{USER_A_ID}}
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
- Expected:
  - User A rows visible

Request D2

- GET {{SUPABASE_URL}}/rest/v1/tracker_items?select=id,user_id,media_id,status&user_id=eq.{{USER_B_ID}}
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
- Expected:
  - Empty array

Request D3

- PATCH {{SUPABASE_URL}}/rest/v1/tracker_items?id=eq.{{TRACKER_ID_B}}
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
  - Prefer: return=representation
- Body:

```json
{
  "rating": 10
}
```

- Expected:
  - Denied or no updated rows
  - User B row unchanged

Request D4

- POST {{SUPABASE_URL}}/rest/v1/tracker_items
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
- Body:

```json
[
  {
    "user_id": "{{USER_B_ID}}",
    "media_id": "{{MEDIA_ID_A}}",
    "status": "want_to"
  }
]
```

- Expected:
  - Denied by insert policy

### Folder E: Playlist Ownership and Sharing

Request E1: Create private playlist as User A

- POST {{SUPABASE_URL}}/rest/v1/playlists
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
  - Prefer: return=representation
- Body:

```json
[
  {
    "owner_id": "{{USER_A_ID}}",
    "name": "Security Test Playlist A",
    "slug": "security-test-playlist-a",
    "is_private": true,
    "icon": "list-music"
  }
]
```

- Expected:
  - Success
  - Save id as PLAYLIST_ID_A

Request E2

- GET {{SUPABASE_URL}}/rest/v1/playlists?select=id,owner_id,name,is_private&id=eq.{{PLAYLIST_ID_A}}
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_B_TOKEN}}
- Expected:
  - Empty array for non-shared private playlist

Request E3: Share with User B

- POST {{SUPABASE_URL}}/rest/v1/playlist_shares
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
  - Prefer: return=representation
- Body:

```json
[
  {
    "playlist_id": "{{PLAYLIST_ID_A}}",
    "shared_with_user_id": "{{USER_B_ID}}"
  }
]
```

- Expected:
  - Success

Request E4

- Repeat E2 with User B token
- Expected:
  - Playlist now visible

Request E5

- Repeat E2 with User C token
- Expected:
  - Still empty

### Folder F: RPC Security

Request F1

- POST {{SUPABASE_URL}}/rest/v1/rpc/validate_invite_code
- Headers:
  - apikey: {{ANON_KEY}}
  - Content-Type: application/json
- Body:

```json
{
  "code_value": "NOT-REAL-CODE",
  "user_email": "test@example.com"
}
```

- Expected:
  - Returns false or safe error
  - No sensitive leakage

Request F2

- POST {{SUPABASE_URL}}/rest/v1/rpc/check_signin_rate_limit
- Headers:
  - apikey: {{ANON_KEY}}
  - Content-Type: application/json
- Body:

```json
{
  "user_email": "{{USER_A_EMAIL}}"
}
```

- Expected:
  - Initially allowed
  - If repeated heavily, eventually blocked per configured thresholds

Request F3

- POST {{SUPABASE_URL}}/rest/v1/rpc/get_playlist_items_with_owner_context
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_C_TOKEN}}
  - Content-Type: application/json
- Body:

```json
{
  "check_playlist_id": "{{PLAYLIST_ID_A}}"
}
```

- Expected:
  - Denied or empty for unshared user

### Folder G: Edge Function Security

Request G1

- POST {{SUPABASE_URL}}/functions/v1/scrape-url
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
- Body:

```json
{
  "url": "http://127.0.0.1:3000"
}
```

- Expected:
  - Rejected by SSRF controls

Request G2

- POST {{SUPABASE_URL}}/functions/v1/scrape-url
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
- Body:

```json
{
  "url": "https://example.com"
}
```

- Expected:
  - Success with metadata payload

Request G3

- POST {{SUPABASE_URL}}/functions/v1/populate-media-cache
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
- Body:

```json
{
  "externalId": "550",
  "mediaType": "invalid_type"
}
```

- Expected:
  - 400 invalid payload

Request G4

- POST {{SUPABASE_URL}}/functions/v1/populate-media-cache
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: application/json
- Body:

```json
{
  "externalId": "550",
  "mediaType": "movie",
  "ttlMs": 86400000
}
```

- Expected:
  - 200 with details payload

### Folder H: Admin-only and Service Role Safety

Request H1

- GET {{SUPABASE_URL}}/rest/v1/invite_codes?select=\*
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
- Expected:
  - Denied or empty depending policy behavior
  - Must not expose invite code rows to regular user

Request H2

- GET {{SUPABASE_URL}}/rest/v1/invite_codes?select=\*
- Headers:
  - apikey: {{SERVICE_ROLE_KEY}}
  - Authorization: Bearer {{SERVICE_ROLE_KEY}}
- Expected:
  - Success
  - Confirms service role bypass behavior

### Folder I: Storage Ownership Policy

Request I1

- POST {{SUPABASE_URL}}/storage/v1/object/profile-photos/not-user-a/test.png
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: image/png
- Body: Binary test file
- Expected:
  - Denied

Request I2

- POST {{SUPABASE_URL}}/storage/v1/object/profile-photos/{{USER_A_ID}}/test.png
- Headers:
  - apikey: {{ANON_KEY}}
  - Authorization: Bearer {{USER_A_TOKEN}}
  - Content-Type: image/png
- Body: Binary test file
- Expected:
  - Success

### Folder J: Cleanup

Request J1

- Delete tracker items, playlist shares, playlists, and test media rows created in this run
- Use owner token where possible
- Use service role only if owner cleanup fails

## 10. Risk Watchlist

These are known high-risk or drift-prone areas to keep checking:

1. Policy drift between current SQL helpers and app assumptions for playlist visibility
2. Invite behavior drift between documentation and open code creation paths
3. Owner context RPC output shape leaking more than intended
4. Edge function abuse risk from repeated authenticated calls without strong server-side throttling
5. Storage policy regressions when adding new buckets

## 11. Pass and Fail Criteria

Critical fail:

1. User A can read or modify User B private rows
2. Anonymous user can read protected tables
3. Private playlist is visible to unrelated users
4. Non-admin can read admin-only sensitive tables
5. Edge function allows unauthenticated access where auth is required
6. Storage allows writing to another user folder

Warning:

1. Unexpected status code but no data leak
2. Performance degradation without auth bypass
3. Inconsistent error format

## 12. Failure Triage

If a test fails:

1. Capture request, response, status, and timestamp
2. Record which environment and user token was used
3. Confirm key type used in request headers
4. Re-run test once to eliminate transient network noise
5. Open incident with failing test id and impact assessment
6. Block release for Critical failures

## 13. Release Gate Checklist

All must be true:

1. Token setup requests pass
2. Anonymous deny checks pass
3. Tracker isolation checks pass
4. Playlist ownership and sharing checks pass
5. RPC security checks pass
6. Edge function auth and SSRF checks pass
7. Admin-only protections pass
8. Storage ownership checks pass
9. Cleanup completed

Release decision:

1. Pass: all Critical checks pass
2. Hold: any Critical check fails

## 14. Suggested Automated Coverage To Add Next

The baseline runbook parity suite exists in tests/backendSecurityRunbook.test.ts.
Prioritize these deeper additions next:

1. Playlist item insert trigger enforcing owner tracker membership
2. Owner-context RPC contract allowlist checks for field-level leakage prevention
3. Invite code lifecycle tests (active, expired, max_uses, intended_email mismatch)
4. Auth rate-limit window reset tests via reset_auth_rate_limit
5. Storage overwrite/update/delete ownership matrix (owner vs non-owner)
6. Edge-function abuse throttling tests (high-rate authenticated bursts)
7. CI-safe staging environment execution with a dedicated seed-reset job

## 15. Change Log

Add one entry each time this runbook changes:

1. Date
2. Author
3. Reason for update
4. Backend area changed
5. New tests added
6. Tests removed or deprecated

Latest entry:

1. Date: 2026-06-01
2. Author: Copilot
3. Reason for update: Added automated Vitest backend security runbook parity suite and execution guidance
4. Backend area changed: Auth, RLS, RPC, edge functions, admin table access, storage policy verification
5. New tests added: tests/backendSecurityRunbook.test.ts with end-to-end runbook coverage and cleanup
6. Tests removed or deprecated: None
