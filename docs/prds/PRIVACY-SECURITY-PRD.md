# Privacy & Security PRD

**NPC Finder - Solo Dev Edition**

> You're not a company. You don't want money, you don't want data, and you just want a nice place for your friends to hang out online. This document lays out practical steps to make sure anyone who creates an account is protected as well as you can manage on your own. No enterprise security theater - just the real, actionable things that matter for a small private app.

---

## Context & Goals

- **What this app is:** A small, invite-only social space for close friends. Media tracking, shared collections, a game, eventually more.
- **What it isn't:** A public platform, a monetized product, a data business.
- **Your promise to users:** No ads, no selling data, no tracking, no credit cards, no surprises.
- **Threat model:** You're not defending against nation-states. You're defending against: accidental data leaks between users, account takeovers, someone stumbling in without an invite, and basic web vulnerabilities.

---

## 1. Supabase Auth Settings - Check These

These are settings in your Supabase dashboard under **Authentication → Settings**.

### ✅ Actions

- [ ] **Enable email confirmation** - Users should verify their email before they can log in. This prevents people from signing up with fake emails (even with a valid invite code).
- [ ] **Set minimum password length** - 8 characters at minimum; 12 is better. Enable in Auth settings.
- [ ] **Disable public sign-ups** - Go to Auth → Settings → "Enable Sign Ups" and turn it **off**. Your invite code flow handles account creation manually. Nobody should be able to POST to Supabase's auth API directly.
- [ ] **Set session expiry** - Under Auth → Settings, set JWT expiry to something reasonable (e.g. 3600 seconds = 1 hour, with refresh tokens enabled). Don't leave it at unlimited.
- [ ] **Enable PKCE flow** - Already default in newer Supabase projects. Confirm it's active.
- [ ] **Restrict allowed email domains (optional)** - If you only want specific email domains (e.g., gmail.com), you can add an auth hook to validate. Not required if you trust your invite flow.

---

## 2. Row-Level Security (RLS) - Audit Checklist

Your RLS is your most important protection. It makes the database enforce access rules itself - not just your application code.

### ✅ Actions

- [ ] **Verify RLS is enabled on every table** - Run this in the Supabase SQL editor:

  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';
  ```

  Every table should show `rowsecurity = true`. If any show `false`, fix them immediately.

- [ ] **Ensure no table has `SELECT` open to all authenticated users** - Policies like `USING (true)` on SELECT are dangerous unless the table is intentionally public (e.g., a global config table). Review each policy.

- [ ] **User data should be scoped to `auth.uid()`** - Policies on user-owned rows should check `user_id = auth.uid()` or similar. Check: watchlists, ratings, journal entries, profiles.

- [ ] **Shared/collection data should check membership** - If a collection is shared, the SELECT policy should verify the viewer is a member (e.g., via a `collection_members` join), not just any authenticated user.

- [ ] **Admin actions should check role** - Any admin-only mutation (generating invite codes, managing users) should verify `auth.jwt() ->> 'role' = 'admin'` or equivalent via your role table.

- [ ] **Run your existing RLS test suite regularly** - You already have `tests/rls.test.ts`. Keep it updated as you add tables.

---

## 3. Invite Code System - Hardening

The invite code system is your front door. Keep it tight.

### ✅ Actions

- [ ] **Codes should be single-use** - Once redeemed, mark as used immediately. Confirm there's no race condition (use a DB transaction or unique constraint).
- [ ] **Codes should expire** - 30-day expiry is already in place. Make sure expired codes are rejected at the DB level, not just in app logic.
- [ ] **Tie codes to a specific email** - A code issued for `alice@example.com` should only work if the signing-up user's email matches exactly (case-insensitive). This prevents someone forwarding a code to the wrong person.
- [ ] **Rate-limit invite code attempts** - Prevents brute-force guessing of codes. Even a simple `5 attempts per IP per hour` in your Edge Function is enough.
- [ ] **Log invite usage** - Keep a record of: who generated the code, what email it was for, when it was used, and from what IP (optional but useful). This helps you notice anything weird.
- [ ] **Admin-only code generation** - Only users with the admin role should be able to call the invite generation endpoint. Verify this is enforced at the DB level via RLS, not just checked in the UI.

---

## 4. Environment Variables & Secrets

### ✅ Actions

- [ ] **Never commit `.env` files** - Confirm `.env`, `.env.local`, and `.env.production` are in `.gitignore`. They should be.
- [ ] **Rotate your `SUPABASE_SERVICE_ROLE_KEY` if it's ever been committed** - Check your git history: `git log --all -S "service_role"`. If it appears anywhere, go to Supabase → Settings → API and regenerate it immediately.
- [ ] **Use `SUPABASE_ANON_KEY` on the frontend** - The anon key is safe to expose (RLS protects the data). The `service_role` key bypasses RLS entirely and must **never** be in frontend code or committed anywhere.
- [ ] **Vercel environment variables** - Set secrets in the Vercel dashboard under Settings → Environment Variables, not in `vercel.json`.

---

## 5. What Data Supabase Stores (And What You Control)

Understanding what's actually stored helps you make honest promises to users.

### Supabase stores:

- **Email addresses** - Required for auth. Stored in `auth.users`, which is separate from your public schema and not readable via normal RLS.
- **Hashed passwords** - Supabase handles this. Passwords are never stored in plaintext.
- **Session tokens (JWTs)** - Short-lived, refreshable. Not sensitive long-term.
- **IP addresses in auth logs** - Supabase logs auth events including IPs. These are in Supabase's internal logs, not your public tables.

### What you control:

- Everything in your `public` schema - profiles, watchlists, collections, ratings, etc.
- You decide what gets stored, how it's structured, and what RLS policies apply.

### ✅ Actions

- [ ] **Don't store data you don't need** - If you're not using it, don't collect it. No birth dates, phone numbers, location data unless a feature requires it.
- [ ] **Avoid logging sensitive user activity to external services** - No Segment, Mixpanel, LogRocket, Sentry with PII, etc. If you want error tracking, use a self-hosted or privacy-respecting option.

---

## 6. Account Deletion

Users should be able to leave and take their data with them (or have it deleted). Even if you're not legally required to do this, it's the right thing to do.

### ✅ Actions

- [ ] **Build a "Delete My Account" option in User Settings** - This should:
  1. Delete all user-owned rows in your public tables (cascade from `user_id`)
  2. Call `supabase.auth.admin.deleteUser(userId)` via a protected Edge Function (requires service role key server-side)
  3. Confirm to the user that it's done
- [ ] **Document what deletion removes** - Be honest with yourself: what tables have `user_id` foreign keys? Make sure they're all handled. A checklist in the codebase is fine.
- [ ] **Soft delete vs. hard delete** - For a personal project, hard delete is fine and simpler. No need for soft deletes unless you have a specific reason.

---

## 7. No Analytics - Keep It That Way

You've already committed to no tracking. Here's how to stay honest about it.

### ✅ Actions

- [ ] **Audit `index.html` and `main.tsx`** - Make sure there are no Google Analytics, Meta Pixel, Hotjar, or similar tags. Easy to accidentally add one via a library.
- [ ] **Check `package.json` for analytics dependencies** - Search for: `analytics`, `mixpanel`, `amplitude`, `segment`, `posthog`. If none are installed, you're good.
- [ ] **No CDN-loaded scripts from third parties** - Check for any `<script src="https://...">` tags that phone home.
- [ ] **Your Vercel deployment collects basic web analytics by default** - Check your Vercel dashboard. If Vercel Analytics is enabled, decide whether you're okay with Vercel seeing traffic data (they don't share it with you to sell, but it is collected). Disable it under the project settings if you want to be strict.

---

## 8. Simple Transparency for Users

You don't need a lawyer to write a privacy policy for a personal project. A plain-language note is better than no note.

### Recommended: Add a short "What we collect" note

Add a small section somewhere in the app (Settings, or a simple `/privacy` page) that says something like:

> **What gets stored:** Your email address, your password (hashed - I never see it), and whatever you add to the app (lists, ratings, collections).
>
> **What doesn't get stored:** Payment info, location, analytics, behavioral data.
>
> **Who sees your data:** Just you and the people you've explicitly shared collections with. I can see database contents as the admin, but I'm not looking, and I won't share it.
>
> **To delete your account:** Go to Settings → Delete Account. Everything goes.

This isn't legally binding, but it builds trust with friends and shows anyone reviewing your code (like a hiring manager) that you've thought about this carefully.

---

## 9. Rate Limiting

You already have rate limiting logic in the codebase (`tests/rateLimiter.test.ts`). Make sure it covers:

- [ ] **Invite code redemption** - Max attempts per IP per time window.
- [ ] **Login attempts** - Supabase has built-in brute force protection for auth. Confirm it's enabled in Auth settings (it is by default).
- [ ] **Any Edge Functions that write to the DB** - If a function generates invite codes or deletes accounts, it should be callable only by authenticated users with the right role.

---

## 10. HTTPS & Headers

Vercel handles HTTPS automatically. But check these:

### ✅ Actions

- [ ] **Verify `vercel.json` has security headers** - Open your `vercel.json` and check for a `headers` block. At minimum you want:
  ```json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ]
  }
  ```
- [ ] **Content-Security-Policy (CSP)** - This is harder to get right without breaking things. Add it last, after everything else is stable. Start in report-only mode.

---

## Priority Order

If you want to work through this in a sensible order:

1. **Confirm public sign-ups are disabled in Supabase** (most important - closes the obvious door)
2. **Audit RLS policies on all tables**
3. **Rotate service role key if there's any chance it got committed**
4. **Add "Delete My Account" to user settings**
5. **Add plain-language privacy note in the app**
6. **Add security headers to `vercel.json`**
7. **Verify Vercel Analytics is off if you want to stay strict**

---

## What You Can Honestly Say

Once you've worked through the checklist above, you can genuinely tell people:

- No ads, no tracking, no analytics
- No credit cards, no payment ever
- Your data isn't shared with anyone - not sold, not analyzed
- You can delete your account and everything that goes with it
- The app is invite-only, so no strangers can show up
- I built this for fun, not for money

That's a pretty solid set of promises for a solo side project. You don't have to be a tech giant to respect people's privacy - you just have to mean it.
