# Invite System Quick Start

## How It Works

1. Admin creates invite codes
2. Admin shares code with friend
3. Friend signs up using code
4. Code becomes invalid (one-time use)

## For Admins

### Create Invite Codes

1. Log in as admin
2. Go to Admin Panel
3. Click "Generate Invite Code"
4. Set expiration (optional)
5. Copy code and share with friend

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
4. Create account
5. Code is marked as used

### No Valid Code?

Ask an admin for an invite code.

## Security

**One-time use:**
- Each code works once
- Automatically marked as consumed after use

**Expiration:**
- Codes can expire after set time
- Expired codes cannot be used

**Admin only:**
- Only admins can create codes
- Regular users cannot generate invites

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
  code          -- Random string
  created_by    -- Admin who created it
  consumed_by   -- User who used it (null if unused)
  consumed_at   -- When it was used
  expires_at    -- Optional expiration
  is_active     -- Can it still be used?
)
```

## Troubleshooting

**"Invalid invite code"**
- Code might be used already
- Code might be expired
- Code might be revoked
- Typo in code

**"Can't create codes"**
- You need admin privileges
- Check `is_admin` in your user profile

**"Code not working"**
- Check if it expired
- Check if it was revoked
- Verify it wasn't already used
