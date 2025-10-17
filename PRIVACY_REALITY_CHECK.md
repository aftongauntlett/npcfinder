# Privacy Reality Check

## Current Privacy Model

**Your data is protected from other users, but not from the admin or hosting provider.**

### What IS Private

- Other users cannot see your data (Row-Level Security)
- Your password is hashed (admin cannot see it)
- No third-party tracking or analytics
- Invite-only access

### What Is NOT Private

- Admin can access database and see all data
- Supabase (hosting provider) can access data
- Not end-to-end encrypted like Signal

### This Is Normal

Same privacy model as:
- Netflix
- Spotify  
- IMDb
- Most web apps

### Different From

- Signal (end-to-end encrypted messages)
- WhatsApp (end-to-end encrypted messages)
- ProtonMail (zero-knowledge encryption)

## Future Plans

Planning to add end-to-end encryption for sensitive data:
- Personal notes
- Private recommendations
- Health/fitness data

This will make it so admin cannot read that data even with database access.

See [FUTURE_E2E_ENCRYPTION.md](FUTURE_E2E_ENCRYPTION.md) for technical details.

## What This Means For You

**If you're comfortable with:**
- Admin seeing your movie ratings
- Hosting provider (Supabase) having access
- Standard web app security

**Then this app is fine for you.**

**If you need Signal-level privacy:**
- Wait for E2E encryption feature
- Or use a different app designed for that

## Legal & Trust

- I won't look at your data without reason
- I won't sell or share your data
- I don't use analytics or tracking
- This is just for our friend group

But technically, I can access the database. That's just how web apps work without E2E encryption.

## Questions?

Ask in the friend group or check:
- [Open Source Security FAQ](OPEN_SOURCE_SECURITY_FAQ.md)
- [Invite System](INVITE_SYSTEM_QUICKSTART.md)
