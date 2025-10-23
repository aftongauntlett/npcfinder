# Invite System Quick Start

## How It Works

1. Admin creates invite code for a specific email address
2. Admin shares code with intended recipient
3. Recipient signs up using code (must match the intended email)
4. Code becomes invalid after use (one-time use)

**Email Validation**: Invite codes are tied to specific email addresses. The signup email must match the intended email address specified when the code was created.

## For Admins

### Create Invite Codes

1. Log in as admin
2. Go to Admin Panel
3. Click "Generate Invite Code"
4. Enter the recipient's email address (required)
5. Code automatically expires after 30 days
6. Copy code and share with intended recipient

**Important**: The email address you specify here must match the email used during signup. This prevents code sharing and ensures invites go to intended recipients.

### Manage Codes

- View all codes (active and used)
- See who used each code
- Revoke unused codes
- Check expiration dates

## For New Users

### Sign Up With Code

1. Go to login page
2. Click "Sign Up"
3. Enter invite code
4. **Important**: Use the email address the code was created for
5. Create account (code validates email match)
6. Code is marked as used

### No Valid Code?

Ask an admin for an invite code. Make sure to provide your email address so they can create a code specifically for you.

## Security

**Email-based validation:**

- Each code is tied to a specific email address
- Signup email must match the intended recipient
- Prevents code sharing and unauthorized access

**One-time use:**

- Each code works once
- Automatically marked as consumed after use

**Expiration:**

- All codes expire after 30 days
- Expired codes cannot be used

**Admin only:**

- Only admins can create codes
- Regular users cannot generate invites

**Authentication:**

- Code validation is public (anonymous users can check validity)
- Code consumption requires authentication (must be signed in to use)

## Making Someone Admin

Run in Supabase SQL Editor:

```sql
UPDATE user_profiles
SET is_admin = true
WHERE email = 'friend@example.com';
```

## Database Structure

```sql
invite_codes (
  code            -- Random string (XXX-XXX-XXX-XXX format)
  created_by      -- Admin who created it
  used_by         -- User who used it (null if unused)
  used_at         -- When it was used
  intended_email  -- Email address code is for (required)
  expires_at      -- Expiration date (30 days from creation)
  is_active       -- Can it still be used?
  max_uses        -- Always 1 (one-time use)
  current_uses    -- Number of times used (0 or 1)
)
```

## Connecting Friends

**Important**: The auto-connect feature has been disabled for scalability reasons.

New users are NOT automatically connected to existing users. For small friend groups, admins can manually connect everyone:

```sql
-- Connect all existing users to each other (run in Supabase SQL Editor)
SELECT batch_connect_users(ARRAY(SELECT id FROM auth.users));
```

This is suitable for small groups (5-50 users). For larger groups, consider implementing:

- Friend requests
- Networks/groups (Discord-style channels)
- Selective connections based on shared interests

## Troubleshooting

**"Invalid invite code"**

- Code might be used already
- Code might be expired (30 days)
- Code might be revoked
- Typo in code
- **Email mismatch**: Your signup email doesn't match the intended recipient

**"Can't create codes"**

- You need admin privileges
- Check `is_admin` in your user profile

**"Code not working"**

- Check if it expired (30 days from creation)
- Check if it was revoked
- Verify it wasn't already used
- **Most common**: Verify your email matches the intended_email for that code

**"Email validation failed"**

- The code was created for a different email address
- Contact the admin to create a new code for your email
- Use the exact email address the code was intended for
