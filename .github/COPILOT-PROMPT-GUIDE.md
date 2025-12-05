# Copilot Prompt Guide

Quick reference for writing effective prompts that leverage the project's copilot instructions.

## High-Impact Openers

### Feature Work

```
"Working on [feature name]. Context: [1-2 sentence description].
Need to: [specific task]"
```

**Example:**

> "Working on music recommendations. Context: users can send albums to friends with optional reviews. Need to: add a 'mark as listened' button to received recommendations"

**Why it helps:** Gives domain context + specific scope immediately.

---

### Refactoring

```
"Refactor [component/file]. Issues: [what's wrong].
Keep: [constraints]"
```

**Example:**

> "Refactor `MovieCard.tsx`. Issues: 250 lines, mixes data fetching + presentation. Keep: existing prop interface for backwards compatibility"

**Why it helps:** Triggers `90-refactor-triggers.md` checklist with explicit constraints.

---

### Bug Fixes

```
"Bug: [what's broken]. Expected: [correct behavior].
Current: [actual behavior]. Context: [relevant details]"
```

**Example:**

> "Bug: invite codes show as expired when they're not. Expected: valid for 30 days. Current: expiring after 7 days. Context: users reporting this for codes created last week"

**Why it helps:** Structured problem statement = faster diagnosis.

---

### Traycer-Generated Specs

```
"Traycer spec incoming. Read it, ask questions first, then propose a plan."
```

**Why it helps:** Explicitly invokes `10-traycer-handoff.md` workflow (assumptions → plan → implement).

---

## Quick Wins

### DO:

- **Reference files**: "In `MovieCard.tsx`, make the card bigger"
- **State constraints**: "Don't change the API, just the UI"
- **Mention tests**: "This is fragile, add a test"
- **Flag privacy**: "This touches user data, double-check privacy"

### DON'T:

- Assume Copilot remembers previous chat history (each chat is fresh)
- Say "the component" without naming it
- Skip context for non-obvious domain rules

---

## Examples: Bad vs Good

### Vague vs Clear

**❌ Vague:**

> "Make the card bigger"

**✅ Clear:**

> "In `src/components/media/MovieCard.tsx`, increase card height from 200px to 300px. Ensure it stays responsive on mobile."

---

### Context-Free vs Contextual

**❌ Context-Free:**

> "Add a share button"

**✅ Contextual:**

> "Add a share button to `MovieCard`. Context: users can only share with existing connections (no public sharing per privacy rules). Use existing `sendRecommendation()` function."

---

## Maximum Efficiency Formula

Start with:

1. **What** (specific file/component/feature)
2. **Why** (user problem or goal)
3. **Constraints** (what NOT to change)

**Example:**

> "In `src/components/music/AlbumCard.tsx` (what), add a 'listened' status badge because users can't tell if they've heard recommendations yet (why). Don't modify the database schema—use existing `is_consumed` field (constraints)."

---

## Special Cases

### Exploring Code

> "Show me all components that handle recommendations. I'm exploring before making changes."

### Design Questions

> "Should I split `UserProfile.tsx`? It's 180 lines but feels cohesive. Check against refactor triggers."

### Security/Privacy Review

> "Adding admin feature to view user stats. Flag any privacy issues before I implement."

### Database Changes

> "Need to add a `last_listened_at` column to `music_recommendations`. Create migration using diff workflow and update types."

**Note**: Always use the diff workflow: make UI changes in Supabase Dashboard, run `npm run db:diff:dev`, create new migration, test with `npm run db:reset:dev`.

---

## Key Context Copilot Has

When you reference these topics, Copilot can pull from `15-project-context.md`:

- **Auth flow**: invite-only, 30-day expiration, validateInviteCode → signUp → consumeInviteCode
- **Privacy rules**: no public sharing, no social metrics, secure by default
- **Theme system**: hex format `#RRGGBB` in `user_profiles.theme_color`
- **Migrations**: single baseline (`0001_baseline.sql`), never edit it, always create new forward-only migrations using diff workflow
- **Auto-connect**: disabled by design
- **UX values**: calm, minimal, accessible-first

---

## Summary

**You don't need essays**, but adding:

- **File name** (which component?)
- **One sentence of context** (what's the domain rule?)
- **Explicit constraints** (what's off-limits?)

...will reduce back-and-forth by ~50%.

**Think of it as a briefing, not just a command.** The 5 extra seconds you spend framing the task saves 5 minutes of clarification loops.
