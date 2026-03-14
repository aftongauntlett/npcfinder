# PRD: Nostalgia-Style Profiles

Date: 2026-03-14  
Status: Draft (Execution Ready)

## 1) Problem

NPC Finder has strong trust and sharing infrastructure, but users have limited identity expression. A nostalgia-style profile system can increase belonging and social stickiness.

## 2) Goal

Introduce customizable user profiles inspired by early 2000s social web aesthetics, while preserving safety, readability, and app performance.

## 3) Non-Goals (MVP)

- No custom HTML/CSS/JS embedding
- No public discovery outside invite ecosystem
- No profile comments or messaging in this phase

## 4) Target UX (MVP)

- Profile page route: `/app/profile/:userId`
- Editable profile fields:
  - display name
  - headline/tagline
  - bio
  - avatar URL/upload hook (existing pipeline if available)
  - top 8 friends (selected connections)
  - featured media collection (optional)
  - theme preset (safe curated presets only)
- Profile sections:
  - About
  - Featured Collection
  - Top Friends
  - Recent Activity (phase-gated, optional)

## 5) Data Model Changes

New table (or extension pattern):

- `user_profile_customizations`
  - `user_id` PK/FK
  - `headline` text
  - `bio` text
  - `theme_preset` text
  - `featured_collection_id` uuid nullable
  - `top_friends` uuid[] nullable
  - timestamps

RLS:

- Owner can update own profile customization
- Authenticated users can view profiles they are allowed to see under existing friend/trust rules

## 6) Backend/API Notes

- Reuse existing `user_profiles` for core identity fields
- Add service/hook pair:
  - `profileCustomizationService`
  - `useProfileCustomizationQueries`
- Validate `top_friends` against existing `connections`
- Validate `featured_collection_id` is accessible by profile owner

## 7) Frontend Implementation Notes

- Add page + editor modal/drawer
- Use existing form primitives and validation style
- Keep theme system preset-only (no user CSS)
- Ensure accessible contrast for all presets

## 8) Acceptance Criteria

- Users can view profile pages for allowed users
- Users can edit and save their profile customization
- Top friends only include connected users
- Featured collection renders correctly with permission-safe behavior
- No script/style injection vectors introduced

## 9) Risks

- Scope creep into full social network complexity
- Theme readability regressions
- Data leakage if profile visibility checks drift

## 10) Copilot Execution Prompt

```text
Implement docs/prds/PROFILES-NOSTALGIA-PRD.md as an MVP.
Constraints:
- No custom HTML/CSS/JS user content
- Reuse existing auth, connections, and media collection permission patterns
- Add migrations + RLS for any new tables
- Keep UI consistent with existing components and Tailwind tokens
Deliver:
1) migration(s)
2) service + query hooks
3) profile page + edit flow
4) tests for permission-sensitive behavior
5) short implementation notes in docs
```
