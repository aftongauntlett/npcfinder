# Database Migrations

**Status**: Baseline + Forward-Only Migrations  
**Last Reset**: November 16, 2025  
**Last Consolidation**: November 23, 2025 (Tasks System)  
**Current Baseline**: `20250116000000_baseline_schema.sql`

---

## Overview

This project uses **database migrations** to manage schema changes in a version-controlled, reproducible way.

### Migration Philosophy

**Baseline + Forward-Only Approach**:

- ✅ Single baseline migration contains the complete, correct schema
- ✅ All old prototype migrations are archived (preserved for history)
- ✅ Recently added features can be consolidated into baseline before production deployment
- ✅ All future changes are forward-only migrations (never edit existing migrations)
- ✅ Migrations are tested in dev database before applying to production

**Why This Approach**:

- Clean starting point before real user data
- Simplified migration chain (no replaying 60+ prototype migrations)
- Historical record preserved in archive
- Professional workflow for production database
- Easy consolidation of development features into baseline

---

## Migration Structure

```
supabase/migrations/
├── 20250116000000_baseline_schema.sql              ← Complete schema (start here)
├── 20251119000000_allow_bootstrap_invite_creation.sql  ← Bootstrap RLS policy
├── 20251119000001_add_auth_user_trigger.sql            ← Auto-create user profiles
├── archive/                                        ← Old prototype migrations (reference only)
    ├── README.md
    ├── 20241001000000_create_user_profiles.sql
    ├── 20241002000000_create_recommendations.sql
    └── ... (60+ archived files)
```

**Note**: Future migrations will appear as additional files (e.g., `20250120000000_add_user_preferences.sql`) after you create them.

### Baseline Migration

**File**: `supabase/migrations/20250116000000_baseline_schema.sql`

**What It Contains**:

- All tables (user_profiles, connections, invite_codes, watchlists, movie/music/book/game recommendations and libraries, reading_list, media_reviews, **tasks system**, etc.)
- All views with security_barrier (movie_recommendations_with_users, music_recommendations_with_users, book_recommendations_with_users, game_recommendations_with_users, **task_boards_with_stats**)
- All functions (is_admin, handle_new_user, batch_connect_users, update triggers, **task timestamp triggers**, etc.)
- All triggers (admin protection, timestamp updates, status changes, etc.)
- All RLS policies (security policies for every table)
- All indexes (performance optimization)
- All table/column comments (documentation)

**Consolidated Updates**:

- Nov 17, 2025: Added `game_library.description_raw`, book `'listen'` type, `security_barrier` to views
- **Nov 23, 2025: Consolidated tasks system** (3 tables: task_boards, task_board_sections, tasks)
  - Template support: job_tracker, markdown, recipe, kanban, custom
  - Flexible configuration: column_config, field_config, item_data
  - Inbox tasks support (nullable board_id)
  - Full RLS policies, triggers, indexes, and views
  - Replaces 5 individual migrations (now archived)
- **Dec 1, 2025: Updated board template types**
  - Removed old templates: grocery, notes, todo
  - Added markdown template as the new default
  - Migration auto-converts old templates to markdown

**Note**: This baseline was initially created from archived prototype migrations and has been tested in dev database. All known issues have been fixed and consolidated.

**Consolidation Workflow**:

When preparing for a fresh production database deployment, recently added features can be consolidated into the baseline to keep the migration chain clean:

1. **Before consolidation**: Baseline + 5 task migrations + 2 bootstrap migrations = 8 files
2. **After consolidation**: Baseline (with tasks) + 2 bootstrap migrations = 3 files
3. **Result**: Cleaner migration history, easier to understand and maintain

Consolidated migrations are moved to `archive/` for historical reference. This is the recommended approach before deploying to a fresh production database.

**When to Run**:

- When setting up a new database (dev or prod)
- Never on an existing database that already has data
- If resetting database to clean state

**How to Run**:

1. Supabase Dashboard → SQL Editor
2. Copy entire file contents
3. Paste and execute
4. Verify tables created: Database → Tables

### Forward-Only Migrations

These migrations must be applied **after** the baseline migration. They add features required for bootstrap setup, user authentication, and ongoing feature development.

#### Critical Migrations (Required for Bootstrap)

These two migrations must be run immediately after the baseline to enable initial setup:

##### 1. Allow Bootstrap Invite Creation

**File**: `supabase/migrations/20251119000000_allow_bootstrap_invite_creation.sql`

**Purpose**: Adds RLS policy to allow invite code creation when no users exist in the database.

**What It Does**:

- Creates `is_bootstrap_allowed()` function (returns true only when user count = 0)
- Adds RLS policy allowing INSERT to `invite_codes` during bootstrap phase
- Enables the bootstrap script (`npm run db:create-bootstrap-code`) to work

**When to Run**: After baseline, before creating your first admin user

##### 2. Add Auth User Trigger

**File**: `supabase/migrations/20251119000001_add_auth_user_trigger.sql`

**Purpose**: Auto-creates user profile when user signs up via Supabase Auth.

**What It Does**:

- Creates trigger `on_auth_user_created` on `auth.users` table
- Calls `handle_new_user()` function after each signup
- Automatically inserts row into `user_profiles` table
- Ensures every authenticated user has a profile entry

**Why It's Critical**: Without this trigger, users can sign up but the app will fail with 406 errors (missing profile data).

**When to Run**: After baseline, before first user signup

#### Feature Migrations (December 2025)

Additional migrations that add new features and improvements:

- **`20251201000000_update_board_template_types.sql`** - Updated task board template types (removed grocery/notes/todo, added markdown as default)
- **`20251202000000_add_repeatable_tasks.sql`** - Added repeatable/recurring task functionality
- **`20251203000000_media_reviews_and_music_metadata.sql`** - Enhanced media reviews system and music metadata
- **`20251204000000_add_tasks_enhancements.sql`** - Additional task system enhancements
- **`20251204000001_fix_board_shares_foreign_key.sql`** - Fixed foreign key constraints on board_shares table
- **`20251204000002_restrict_board_shares_update_to_owners.sql`** - Restricted board share updates to owners only
- **`20251204000003_canonicalize_template_types.sql`** - Canonicalized task board template types

---

### Archived Migrations

**Location**: `supabase/migrations/archive/`

**What They Are**: 60+ migrations from prototype phase (Oct 2024 - Jan 2025)

**Status**: Superseded by baseline migration

**Purpose**: Historical reference only

**⚠️ NEVER run these on new databases** - they're already included in the baseline

---

## Dev vs Prod Databases

### Two-Database Setup

This project uses separate databases for development and production:

**Development Database** (Testing):

- Safe to experiment
- Can reset freely
- Your local work

**Production Database** (Real Data):

- Real user data
- Protected by 5-second warning
- Deploy only after testing

### How It Works

The app automatically switches based on environment:

```javascript
// In src/lib/supabase.ts
if (import.meta.env.DEV && dev_env_vars_exist) {
  → Use development database
} else {
  → Use production database
}
```

**Vite Development Mode** (`npm run dev`): Uses dev database  
**Production Build** (`npm run build` + deploy): Uses production database

**CLI Tools** require project ref configuration in `.env.local`:

```bash
SUPABASE_DEV_PROJECT_REF=your-dev-project-ref
SUPABASE_PROD_PROJECT_REF=your-prod-project-ref
```

Find project refs in: Supabase Dashboard → Project Settings → General → Reference ID

**See full setup**: [DEV-PROD-WORKFLOW.md](DEV-PROD-WORKFLOW.md)

---

## Available Commands

### Creating Migrations

```bash
# Create new migration file
npm run db:migration:new add_user_preferences_table
```

**Result**: Creates `supabase/migrations/YYYYMMDDHHMMSS_add_user_preferences_table.sql`

**Edit the file** with your SQL changes.

### Checking Migration Status

```bash
# List migrations for dev database
npm run db:migration:list:dev

# List migrations for prod database
npm run db:migration:list:prod
```

Shows which migrations are pending vs. applied to the specified database.

### Applying Migrations

```bash
# Apply to DEVELOPMENT database (safe, no warning)
npm run db:push:dev

# Apply to PRODUCTION database (5-second warning)
npm run db:push:prod
```

**Always test in dev first!**

### Resetting Development Database

```bash
# Drop and recreate dev database from all migrations
npm run db:reset:dev
```

**⚠️ This is DESTRUCTIVE** - only use on development database

**Never run on production** - this command is dev-only for safety

### Checking Schema Differences

```bash
# See differences between database and migration files
npm run db:diff:dev
```

Useful if you made manual changes in Supabase Dashboard and want to create a migration for them.

---

## Migration Workflow

### Step-by-Step Process

**1. Create Migration File**

```bash
npm run db:migration:new add_notification_settings
```

**2. Write SQL Changes**

Edit the generated file in `supabase/migrations/`:

```sql
-- Add notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_notification_settings_user_id
  ON notification_settings(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**3. Test in Development Database**

```bash
npm run db:push:dev
```

Verify in Supabase Dashboard (dev project):

- Table appears in Database → Tables
- Columns are correct
- RLS policies are in place

**4. Test in Application**

Run your app on localhost (uses dev database automatically):

```bash
npm run dev
```

Test the feature thoroughly:

- Create test data
- Verify queries work
- Check RLS prevents unauthorized access
- Test edge cases

**5. Fix Issues (If Needed)**

If the migration has problems:

```bash
# Create a new migration that fixes it
npm run db:migration:new fix_notification_settings

# Or reset dev database and fix the original migration
npm run db:reset:dev
```

**Never edit an already-applied migration** - create a new one instead.

**6. Commit Migration**

```bash
git add supabase/migrations/YYYYMMDD_add_notification_settings.sql
git commit -m "feat: add notification settings table"
```

**7. Apply to Production**

```bash
npm run db:push:prod
```

You'll see:

```
⚠️  WARNING: Pushing to PRODUCTION database. Press Ctrl+C to cancel...
```

**5 seconds to abort** if you realize something's wrong.

**8. Deploy Application Code**

```bash
git push origin main
```

Vercel automatically deploys the updated app that uses the new schema.

---

## Safety Rules

### ✅ DO

- **Always test in dev first** before applying to prod
- **Create new migrations** for all schema changes
- **Use idempotent SQL** (`IF NOT EXISTS`, `ON CONFLICT`, etc.)
- **Include RLS policies** on all new tables
- **Add indexes** for frequently queried columns
- **Document complex changes** with comments in migration files
- **Commit migrations to git** before applying to prod

### ❌ DON'T

- **Don't edit existing migrations** - create new forward-only migrations
- **Don't modify the baseline** (`20250116000000_baseline_schema.sql`) - it's sacred
- **Don't run `db:reset:dev` on production** - it's dev-only for safety
- **Don't skip dev testing** - always test before prod
- **Don't make destructive changes** without backup plan
- **Don't bypass RLS** or remove security constraints
- **Don't reference archived migrations** for new work

---

## Task Board Template Types

### Canonical Template Types

The `task_boards.template_type` column uses a CHECK constraint to enforce allowed values. The canonical set is:

| Template Type | Description                                         |
| ------------- | --------------------------------------------------- |
| `job_tracker` | Job application tracking with status history        |
| `markdown`    | Simple list-based tasks with markdown support       |
| `recipe`      | Recipe management with ingredients/instructions     |
| `kanban`      | Board with columns (To Do, In Progress, Done)       |
| `grocery`     | Shopping list with categories and purchase tracking |
| `custom`      | User-defined board with flexible configuration      |

**Migration**: `20251204000003_canonicalize_template_types.sql`

**Why This Matters**: Earlier migrations defined this constraint differently, which could cause schema drift between environments. The canonical migration ensures all databases use the same definition.

**Removed Types**: `notes` and `todo` were converted to `markdown` in migration `20251201000000_update_board_template_types.sql`.

**Type Safety**: The TypeScript type `TemplateType` in `src/services/tasksService.types.ts` matches this database constraint exactly.

---

## The Baseline Migration

### What Makes It Special

**File**: `supabase/migrations/20250116000000_baseline_schema.sql`

**Purpose**: Single source of truth for complete schema

**When Created**: November 16, 2025 (database reset before real users)

**What It Replaced**: 60+ prototype migrations from Oct 2024 - Jan 2025

**Why It's Sacred**:

- Represents clean starting point
- New databases start from this baseline
- Editing it would break new database setups
- All future changes must be new migrations

### Bootstrap Admin Setup

After applying migrations to a fresh database, you need to create an admin invite code.

**Step 1**: Apply all migrations in order

```bash
# Apply baseline + forward-only migrations to dev database
npm run db:push:dev
```

This applies:

1. `20250116000000_baseline_schema.sql` (complete schema)
2. `20251119000000_allow_bootstrap_invite_creation.sql` (bootstrap RLS)
3. `20251119000001_add_auth_user_trigger.sql` (auto-create profiles)

**Step 2**: Create your admin invite code

```bash
npm run db:create-bootstrap-code
```

This will:

- Prompt for your admin email address
- Generate a secure invite code (e.g., `XKCD-2K4P-9MNQ-7HJR`)
- Insert it into the database
- Display the code for you to use during signup

**Step 3**: Sign up with admin privileges

1. Go to your app signup page
2. Sign up with the email you provided
3. Use the generated invite code
4. You now have admin access!

**Security Notes**:

- Each deployment uses its own unique admin credentials
- No credentials are stored in git repository
- Invite code is single-use and tied to your email
- You can create additional invite codes from the admin panel

---

## Troubleshooting

### Issue: Application fails with "relation does not exist" errors

**Symptoms**: Errors like:

- `relation "public.reading_list" does not exist`
- `relation "public.book_recommendations" does not exist`
- `relation "public.game_library" does not exist`
- `relation "public.game_recommendations" does not exist`
- `relation "public.music_library" does not exist`
- `relation "public.media_reviews" does not exist`

**Cause**: You ran the incomplete baseline migration before it was fixed (Nov 16, 2025).

**Solution - Option 1** (Run missing migrations):

```bash
# Apply the archived migrations for the missing tables
# In Supabase Dashboard → SQL Editor, run these in order:
# 1. 20251024201314_create_reading_list.sql
# 2. 20251024201354_create_book_recommendations.sql
# 3. 20251104001011_create_game_library.sql
# 4. 20251104001052_create_game_recommendations.sql
# 5. 20251102000000_create_music_library.sql
# 6. 20251022000001_create_media_reviews.sql
# 7. 20251023043630_fix_media_reviews_rating_constraint.sql
```

**Solution - Option 2** (Reset and re-run corrected baseline):

```bash
# WARNING: This will delete all data
# 1. In Supabase Dashboard → Database → drop all public tables
# 2. Run the corrected baseline migration
# 3. Use BOOTSTRAP_ADMIN_2025 to re-invite admin
```

**Prevention**: Always pull the latest migrations before setting up a new database.

---

## Need Help?

**Quick Reference**:

- See `supabase/migrations/README.md` for command quick reference
- See `docs/DEV-PROD-WORKFLOW.md` for dev/prod setup
- Check existing migrations for SQL examples

**Common Questions**:

- "How do I create a migration?" → `npm run db:migration:new description`
- "How do I test safely?" → `npm run db:push:dev` (uses dev database)
- "How do I apply to prod?" → `npm run db:push:prod` (has 5-second warning)
- "I broke dev database" → `npm run db:reset:dev` (resets from migrations)

---

**Last Updated**: December 4, 2025  
**Baseline Migration**: `20250116000000_baseline_schema.sql` (consolidated fixes)  
**Forward-Only Migrations**: 9 total

- 2 critical (bootstrap RLS + auth trigger)
- 7 feature migrations (Dec 2025: board templates, repeatable tasks, media reviews, tasks enhancements, board shares fixes)

**Archived Migrations**: 60 files in `supabase/migrations/archive/`
