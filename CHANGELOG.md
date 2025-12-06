# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security - 2025-12-07

**Comprehensive Security Audit Implementation**

#### Fixed - High Priority

- **H1:** Removed database URL logging from production console output
- **H2:** Implemented server-side rate limiting to prevent client-side bypass attacks
  - Added `rate_limits` table and `check_rate_limit()` function
  - Rate limits: 10 attempts per hour, 60 minute block duration
- **M1:** Secured invite code validation with server-side rate limiting

#### Fixed - Medium Priority

- **M2:** Created super admin configuration script (`npm run admin:configure`)
- **M3:** Implemented complete account deletion with GDPR compliance
  - Added `delete-user` Edge Function to remove auth.users records
  - Updated privacy.ts to call Edge Function for full deletion
- **M4:** Integrated Sentry for production error tracking
  - Errors no longer exposed in browser console
  - Added sanitization before sending to Sentry
  - New environment variable: `VITE_SENTRY_DSN`
- **M5:** Removed unused `VITE_ADMIN_USER_ID` environment variable

#### Added - Defense in Depth

- **L1:** Created server-side validation helper library
  - `verifyOwnership()` - Check resource ownership
  - `verifyConnection()` - Verify user connections
  - `verifyAdminStatus()` - Early admin validation
  - `verifyBoardAccess()` - Board access validation
- **L2:** Implemented admin audit logging
  - New `admin_audit_log` table tracks all admin actions
  - Logged actions: view user list, grant/revoke admin status
- **L3:** Removed debug information from scrape-url Edge Function in production
- **L4-L5:** Added CSP violation reporting Edge Function

#### Database Migrations

- `20251207000001_add_rate_limiting.sql` - Server-side rate limiting infrastructure
- `20251207000002_secure_invite_validation_rate_limit.sql` - Secure invite validation
- `20251207000003_add_audit_logging.sql` - Admin audit trail

#### Edge Functions

- `delete-user` - Complete account deletion with service role privileges
- `csp-report` - CSP violation logging endpoint

#### Documentation

- Added `docs/SECURITY-AUDIT-IMPLEMENTATION.md` - Full implementation guide
- Added `docs/SECURITY-IMPLEMENTATION-SUMMARY.md` - Quick reference
- Added `docs/SECURITY-MIGRATION-GUIDE.md` - Deployment guide

**Security Grade Improvement:** B+ → A

All critical and medium-severity security issues resolved. No breaking changes.

---

## [1.1.0] - 2025-11-26

### Added - Tasks System

- **Board-Based Task Management:** Complete task organization system
  - 4 board templates: Job Tracker, Recipe Collection, Kanban, Markdown To-Do List (default)
  - Custom fields per template (e.g., salary range for job applications, ingredients for recipes)
  - Sections/columns within boards for workflow organization
  - Rich task metadata: priority, due dates, tags, status tracking
  - Inbox for unorganized tasks
- **Task Features:**
  - Template-specific data collection via JSONB fields
  - Display order management for boards and tasks
  - Archive functionality for completed items
  - Date-based filtering (today, upcoming, overdue)
- **URL Metadata Scraping:**
  - Edge function for extracting job posting and recipe metadata
  - Supports JSON-LD schema.org parsing
  - Authentication-protected endpoint
- **UI Components:**
  - Task board views (Kanban, List, Table)
  - Drag-and-drop task management
  - Modal dialogs for creation and editing
  - Empty states and loading indicators

### Technical - Tasks Implementation

- **Database:** 3 new tables (`task_boards`, `task_board_sections`, `tasks`)
- **Service Layer:** Complete CRUD operations with optimistic updates
- **State Management:** TanStack Query hooks with cache invalidation
- **Utilities:** Date helpers (date-fns), validation, sorting, grouping
- **Security:** RLS policies, user isolation, proper foreign key constraints
- **Edge Function:** `scrape-url` with authentication and CORS support

---

## [1.0.0] - 2025-11-19

### Added - Development Infrastructure

- **Separate Dev/Prod Databases:** Created dedicated development Supabase project for safe testing
- **Database Migration System:** Consolidated schema into versioned migration file
  - Created `0001_baseline.sql` with complete database structure
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

- Migration file: `0001_baseline.sql`
- Tables: `user_profiles`, `invite_codes`, `invite_code_audit_log`, `connections`, `app_config`, `user_watchlist`, `user_watched_archive`, `movie_recommendations`, `music_library`, `music_recommendations`, `reading_list`, `book_recommendations`, `game_library`, `game_recommendations`, `task_boards`, `task_board_sections`, `tasks`, `board_shares`, `media_reviews`
- Full RLS policies, triggers, indexes, and views

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

- Migration: `0001_baseline.sql`
- Tables: `user_profiles`, `invite_codes`, `invite_code_audit_log`, `connections`, `app_config`, `user_watchlist`, `user_watched_archive`, `movie_recommendations`, `music_library`, `music_recommendations`, `reading_list`, `book_recommendations`, `game_library`, `game_recommendations`
- Comprehensive RLS policies for user data isolation

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
