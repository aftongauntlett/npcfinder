# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Documentation - Truth Sweep & Cohesion (2025-01-XX)

**Truth-First Changes:**

- **Removed** unverifiable claim about Have I Been Pwned integration (was only a Supabase dashboard feature, not implemented in code)
- **Fixed** API documentation: Changed "Open Library" to "Google Books API" (actual implementation)
- **Added** OMDB API to documentation (was used in code but not mentioned)
- **Removed** RAWG API from features (listed in `.env.example` but not implemented)
- **Moved** Suggestions System to Roadmap (code exists but no database table)

**Cohesion & Style:**

- Rewrote README.md to match house style: concise, truth-first, recruiter-friendly
- Restructured README sections: Title, Links, Tech Stack, Motivation, Features, Architecture, Build & Run, Status, Roadmap, License
- Changed positioning from "open-source: clone and run" to "invite-only" with optional self-hosting
- Added Roadmap section with realistic goals (games support, suggestions board, friend requests)

**Documentation Improvements:**

- Created `/docs/README.md` index for easy navigation
- Reduced duplication across docs (env setup, API keys, invite system)
- Updated `API-SETUP.md` with correct API names and added OMDB section
- Clarified `SECURITY-RECOMMENDATIONS-REVIEW.md` that HIBP is a dashboard feature, not code
- Updated `DATABASE-MIGRATIONS.md` schema list to match actual migrations
- Marked `QUICK-START.md` as "Advanced Self-Hosting (Optional)"

**Verified Claims:**

- ✅ TMDB API (movies/TV)
- ✅ iTunes API (music)
- ✅ Google Books API (books)
- ✅ OMDB API (ratings/awards)
- ✅ Row-Level Security policies
- ✅ Invite-only authentication with email validation
- ✅ TanStack Query, React 19, Vite, TypeScript stack
- ✅ No E2E encryption (standard web app security model)

**Files Changed:**

- `README.md` - Complete rewrite (~500 words, cohesive structure)
- `docs/API-SETUP.md` - Fixed API names, added OMDB, removed/marked RAWG
- `docs/QUICK-START.md` - Reduced duplication, added "Advanced Self-Hosting" heading
- `docs/DATABASE-MIGRATIONS.md` - Updated schema list
- `docs/SECURITY-RECOMMENDATIONS-REVIEW.md` - Clarified HIBP as dashboard feature
- `docs/README.md` - NEW: Documentation index
- `CHANGELOG.md` - NEW: This file

**No Changes:**

- `docs/INVITE-SYSTEM-QUICKSTART.md` - Already accurate
- `docs/PRIVACY-REALITY-CHECK.md` - Already accurate
- `docs/TESTING-STRATEGY.md` - Already accurate
