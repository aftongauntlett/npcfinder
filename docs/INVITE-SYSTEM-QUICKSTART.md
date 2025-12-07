# Invite System Quick Start

## Overview

NPC Finder uses a database-driven invite system with email validation. Admin status and all authorization checks are performed against the database, NOT JWT claims.

## How It Works

1. **Admin creates invite code** for a specific email address (required)
2. **Admin shares code** with intended recipient
3. **Recipient validates code** during signup (email must match)
4. **Code is consumed** after successful account creation (one-time use)

**Critical:** Email validation happens at the database level. The signup email MUST exactly match the `intended_email` specified when the code was created.

## For Admins

### Admin Authorization

**Important:** Admin status is determined by the `role` field in the `user_profiles` table, NOT by JWT claims. The `is_admin` column exists as a generated column for backward compatibility.

- Frontend queries the database to check admin status using the `role` field
- RLS policies enforce database-level access control based on roles
- No reliance on JWT claims for authorization
- Roles: `user` (default), `admin`, `super_admin`

See [ROLE-SYSTEM.md](ROLE-SYSTEM.md) for complete role system documentation.

### Create Invite Codes

1. Log in as admin
2. Go to Admin Panel (`/admin`)
3. Click "Generate Invite Code"
4. **Required:** Enter recipient's exact email address
5. Code automatically:
   - Expires after 30 days
   - Limited to 1 use (one-time only)
   - Tied to the specified email
6. Copy code and share with intended recipient

**Email Matching:** The code will ONLY work with the exact email address you specify. This prevents:

- Code sharing between users
- Unauthorized signups
- Invite code abuse

### Manage Codes

View in Admin Panel:

- All codes (active, used, expired)
- Who used each code (user_id and email)
- When codes were used
- Expiration status

Actions:

- **Revoke** unused codes (permanently deletes from database)
- **View audit log** of all code usage

### Make Someone Admin

Admin status must be set in the database:

```sql
-- Run in Supabase SQL Editor
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'friend@example.com';
```

**Alternative:** Use the super admin configuration script:

```bash
npm run admin:configure
```

This script creates a super admin user with enhanced privileges (cannot be demoted by triggers).

**Security:** Database triggers prevent users from granting themselves admin privileges. Only existing admins can modify admin status (enforced at database level). Super admin role is protected and cannot be changed except by other super admins.

## For New Users

### Sign Up With Code

1. Go to login page
2. Click "Sign Up"
3. Enter the invite code you received
4. **Critical:** Use the EXACT email address the admin specified
   - The code validates email at the database level
   - Different email = code rejected
   - Case-insensitive matching (lowercase)
5. Complete signup
6. Code is automatically marked as used

### Email Validation Flow

```
User enters code + email
  ↓
Database function: validate_invite_code(code, email)
  ↓
Checks:
  ✓ Code exists and is active
  ✓ Code not expired (30 days)
  ✓ Code not already used
  ✓ Email matches intended_email (REQUIRED)
  ↓
Returns: true/false
```

### No Valid Code?

1. Contact an admin
2. **Provide your email address** so they can create a code for you
3. Use the EXACT email when signing up

## Security Model

### Database-Driven Authorization

**Admin Checks:**

- Admin status read from `user_profiles.is_admin` field
- Frontend queries database (not JWT claims)
- RLS policies enforce access at database level
- Triggers prevent privilege escalation

**Invite Code Validation:**

- Email validation enforced by database function
- `intended_email` field is required (NOT NULL)
- Email comparison is case-insensitive
- Validation happens server-side (Supabase RPC)

### Email-Based Validation

**Required Field:**

```sql
intended_email TEXT NOT NULL  -- Cannot create code without email
```

**Validation Logic:**

```sql
-- Code only valid if email matches exactly
IF v_code.intended_email IS NOT NULL THEN
  IF lower(trim(v_code.intended_email)) != lower(trim(user_email)) THEN
    RETURN false;
  END IF;
END IF;
```

### One-Time Use

**Enforced by:**

- `max_uses` always set to 1
- `current_uses` counter (0 or 1)
- Row-level locking prevents race conditions
- Audit log tracks all usage

**Code Consumption:**

```sql
-- After successful signup
UPDATE invite_codes SET
  current_uses = current_uses + 1,
  used_by = user_id,
  used_at = NOW()
WHERE code = code_value;
```

### Expiration

**30-Day Automatic Expiration:**

- Set on creation: `expires_at = NOW() + 30 days`
- Checked during validation
- Expired codes return `false` from validation

### Rate Limiting

**Client-Side Rate Limiting:**

- 10 validation attempts per hour per email
- Prevents brute-force enumeration
- Implemented in application layer (`inviteCodeRateLimiter`)

**Note:** Validation is currently allowed pre-authentication to support signup flow. Rate limiting is critical for security.

## Database Structure

```sql
CREATE TABLE invite_codes (
  id              UUID PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,        -- XXX-XXX-XXX-XXX format
  created_by      UUID REFERENCES auth.users,  -- Admin who created it
  used_by         UUID REFERENCES auth.users,  -- User who used it (null if unused)
  used_at         TIMESTAMPTZ,                 -- When it was used
  intended_email  TEXT NOT NULL,               -- Email that MUST be used (REQUIRED)
  expires_at      TIMESTAMPTZ NOT NULL,        -- 30 days from creation
  is_active       BOOLEAN DEFAULT true,        -- Can it still be used?
  max_uses        INTEGER DEFAULT 1,           -- Always 1 (one-time use)
  current_uses    INTEGER DEFAULT 0,           -- 0 or 1
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT                         -- Optional admin notes
);

CREATE TABLE invite_code_audit_log (
  id         UUID PRIMARY KEY,
  code_id    UUID REFERENCES invite_codes,
  used_by    UUID REFERENCES auth.users,
  used_at    TIMESTAMPTZ DEFAULT NOW()
);
```

## Database Functions

### `validate_invite_code(code_value, user_email)`

**Purpose:** Validate code without consuming it

**Parameters:**

- `code_value`: The invite code (e.g., "ABC-DEF-GHI-JKL")
- `user_email`: Email address attempting to use code (REQUIRED)

**Returns:** `BOOLEAN`

- `true`: Code valid and email matches
- `false`: Code invalid, expired, used, or email mismatch

**Security:**

- Allows pre-authentication calls (for signup)
- Rate limiting MUST be enforced client-side
- Email matching enforced at database level

### `consume_invite_code(code_value, user_id)`

**Purpose:** Mark code as used after successful signup

**Parameters:**

- `code_value`: The invite code
- `user_id`: Authenticated user's ID

**Security:**

- Requires authentication
- Validates `user_id` matches `auth.uid()`
- Uses row-level locking (prevents race conditions)
- Updates `current_uses`, `used_by`, `used_at`
- Creates audit log entry

## Troubleshooting

### "Invalid invite code"

**Possible causes:**

1. ❌ Code already used (`current_uses >= max_uses`)
2. ❌ Code expired (> 30 days old)
3. ❌ Code revoked (`is_active = false`)
4. ❌ Email mismatch (most common)
5. ❌ Typo in code

**Solution:**

- Verify exact email matches the one admin specified
- Contact admin for a new code if needed

### "Email validation failed"

**Cause:** The code was created for a different email address.

**Solution:**

1. Verify the email admin used when creating code
2. Use that EXACT email during signup
3. Contact admin if you need a new code for different email

### "Can't create codes"

**Cause:** Not an admin user.

**Check:**

```sql
-- Run in Supabase SQL Editor
SELECT role, is_admin FROM user_profiles WHERE email = 'your@email.com';
```

**Solution:** Ask an existing admin to update your profile.

### "Admin check fails" or "403 errors"

**Cause:** RLS policies not properly configured or admin status not set.

**Check:**

1. Verify `role IN ('admin', 'super_admin')` in database
2. Check browser console for detailed error logs
3. Verify RLS policies include admin overrides

**Remember:** Admin status comes from database `role` field, not JWT claims!
