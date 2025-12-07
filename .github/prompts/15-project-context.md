# Project Context: NPC Finder

This file provides domain context — not instructions.  
Use this to stay aligned with how the app works.

## Core Concepts

- Invite-only private social app for trusted sharing (movies, TV, music)
- Calm UX, no social metrics (no likes/follows)
- Direct recommendations between known friends
- Split feedback model:
  - Private “hit/miss” feedback to sender
  - Optional public mini-review for friends

## Auth & Invite Flow

- No public signup
- Flow: validateInviteCode (anon) → signUp → consumeInviteCode (auth)
- Invite codes expire after 30 days
- Err on secure defaults; never expose list of users or invites

## Theme System

- Custom user color (hex format `#RRGGBB`)
- Stored in `user_profiles.theme_color`
- Respect accessibility contrast when suggesting UI

## Database / Supabase

- Single baseline migration (`0001_baseline.sql`) = production source of truth
- Never modify baseline or existing migrations — always add new forward-only migrations
- Use diff workflow: UI changes in Dashboard → `npm run db:diff` → create migration → apply with `db:push`
- Test all migrations carefully in Supabase Dashboard UI before capturing

## Auto-Connect

- Auto-friend-connect feature disabled by design
- Manual / opt-in connections only

## UI/UX Values

- Privacy & trust > growth mechanics
- Clean, minimal UI
- Accessible first: semantic HTML, keyboard nav, ARIA when needed
- Responsive by default

## Performance & Structure

- Favor composable components (hooks for logic)
- Extract shared UI pieces (cards, lists, buttons)
- Avoid repetition (≥3 occurrences → propose extraction)

## Testing Expectations

- Use Vitest
- Mock Supabase client
- Add tests for new logic or behavior changes

---

**Reminder:** if domain rules conflict with a prompt file, ask before coding.
