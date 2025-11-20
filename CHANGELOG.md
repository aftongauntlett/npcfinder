# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### In Progress
- **Tasks System:** Board-based task management (not yet deployed)

---

## [1.0.0] - 2025-11-19

### Added - Development Infrastructure
- **Separate Dev/Prod Databases:** Created dedicated development Supabase project for safe testing
  - Dev project: `tajptqmefszgxwollifi`
  - Prod project: `hugcstixszgqcrqmqoss` (existing)
- **Database Migration System:** Consolidated schema into versioned migration file
  - Created `20250116000000_baseline_schema.sql` with complete database structure
  - Includes all tables, RLS policies, triggers, indexes, and views
  - NPM scripts for migration management: `db:push:dev`, `db:push:prod`, `db:migration:list`, etc.
- **Development Workflow:** Clear separation between dev and production environments
  - Dev environment for feature development and testing
  - Prod environment protection with confirmation prompts
  - Documentation in `DEV-PROD-WORKFLOW.md`

### Changed - Database Management
- Migrated from ad-hoc schema changes to formal migration system
- Centralized all database logic in `/supabase/migrations/`
- Updated npm scripts in `package.json` for database operations

### Technical
- Migration file: `20250116000000_baseline_schema.sql`
- Tables: `profiles`, `invite_codes`, `watchlist`, `music_library`, `reading_list`, `game_library`, `recommendations`, `rate_limit_log`
- Full RLS policies, triggers, indexes, and materialized views

---

## [0.9.0] - 2025-01-16 (Pre-Migration Baseline)

### Summary
Stable baseline release with core entertainment tracking features. This version includes Movies, TV Shows, Music, Books, and Games management with a complete invite-only authentication system.

### Features
- **Movies & TV Shows:** Search (TMDB API), watchlist, ratings, reviews, recommendations
- **Music:** Search (iTunes API), library management, album/artist tracking
- **Books:** Search (Google Books API), reading list, progress tracking
- **Games:** Personal game library (manual entry)
- **User System:** Invite-only registration with email validation, profile management
- **Recommendations:** AI-powered content suggestions (OpenRouter integration)
- **Security:** Row-Level Security (RLS) policies, rate limiting, secure authentication

### Technical Stack
- Frontend: React 19, TypeScript, Vite, TailwindCSS
- Backend: Supabase (PostgreSQL + Auth)
- State Management: TanStack Query v5
- APIs: TMDB, iTunes, Google Books, OMDB, OpenRouter

### Database
- Migration: `20250116000000_baseline_schema.sql`
- Tables: profiles, invite_codes, watchlist, music_library, reading_list, game_library, recommendations, rate_limit_log

### Documentation - Truth Sweep & Cohesion (2025-01-16)

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
