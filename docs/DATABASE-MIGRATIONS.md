# Database Migrations

**Status**: Single Baseline + Forward-Only Migrations  
**Baseline Created**: December 5, 2025  
**Current Baseline**: `0001_baseline.sql`  
**Source**: Production database schema (pulled December 5, 2025)

---

## Overview

This project uses **database migrations** to manage schema changes in a version-controlled, reproducible way.

### Migration Philosophy

**Single Baseline + Strict Forward-Only Approach**:

- ✅ One authoritative baseline migration contains the complete production schema
- ✅ All schema changes use `supabase db diff` workflow (never manual SQL editor changes)
- ✅ All future changes are forward-only migrations (never edit existing migrations)
- ✅ Development database can be reset freely to test migration chain
- ✅ Migrations are tested in dev database before applying to production

**Why This Approach**:

- Production database is the source of truth
- Clean, simple migration history starting from a known-good state
- No historical baggage from prototype phase
- Professional workflow for schema changes
- Easy to verify migration chain with `db:reset:dev`

---

## Migration Structure

```
supabase/migrations/
├── 0001_baseline.sql              ← Complete production schema (start here)
└── [future migrations]            ← Created as needed with db:diff workflow
```

**Note**: Future migrations will appear as new files when you create them using the diff workflow.

### Baseline Migration

**File**: `supabase/migrations/0001_baseline.sql`

**What It Contains**:

Complete production database schema as of December 5, 2025, including:

- **All tables**: user_profiles, connections, invite_codes, watchlists, recommendations (movie/music/book/game), libraries (music/game), reading_list, media_reviews, task system (task_boards, task_board_sections, tasks, board_shares), and more
- **All views**: With security_barrier enabled (movie_recommendations_with_users, music_recommendations_with_users, book_recommendations_with_users, game_recommendations_with_users, task_boards_with_stats, etc.)
- **All functions**: is_admin, handle_new_user, batch_connect_users, is_bootstrap_allowed, update triggers, task timestamp triggers, etc.
- **All triggers**: Admin protection, timestamp updates, status changes, auth user creation, etc.
- **All RLS policies**: Security policies for every table
- **All indexes**: Performance optimization
- **All constraints**: Data integrity rules
- **All table/column comments**: Documentation

**Source**: Generated from production database using `supabase db pull`

**When to Use**:

- Setting up a new database (development or production)
- Resetting development database to clean state
- Never on an existing database that already has data

**How to Apply**:

```bash
# Development database
npm run db:push:dev

# Production database (7-second safety warning)
npm run db:push:prod
```

**IMPORTANT**: This file must never be edited. It represents the exact state of a healthy production database and serves as the authoritative baseline.

---

## Creating New Migrations

### The Diff Workflow (REQUIRED)

**CRITICAL**: All schema changes must follow this workflow. Never make manual changes in the Supabase SQL editor.

#### Step-by-Step Process

1. **Make changes in Supabase Dashboard UI**

   - Navigate to Table Editor, Database settings, etc.
   - Create/modify tables, columns, indexes, etc. using the UI
   - These changes are applied directly to your database

2. **Generate a diff of your changes**

   ```bash
   npm run db:diff:dev
   ```

   This compares your current database schema against the last migration and shows the SQL diff.

3. **Review the generated SQL**

   - Verify the SQL accurately reflects your intended changes
   - Check for any unexpected alterations

4. **Create a new migration file**

   ```bash
   npm run db:migration:new <descriptive_name>

   # Examples:
   npm run db:migration:new add_user_preferences_table
   npm run db:migration:new add_email_notifications_column
   npm run db:migration:new create_comments_table
   ```

5. **Copy the diff SQL into your new migration**

   - Open the newly created migration file in `supabase/migrations/`
   - Paste the SQL from the diff output
   - Add any necessary comments

6. **Test in development**

   ```bash
   # Reset dev database to clean state
   npm run db:reset:dev

   # This will:
   # - Drop and recreate the database
   # - Apply baseline migration
   # - Apply all forward-only migrations (including your new one)
   ```

7. **Verify the migration works**

   - Check that all tables/columns/indexes were created correctly
   - Test affected application features
   - Run your test suite: `npm run test`

8. **Apply to production**
   ```bash
   npm run db:push:prod
   ```
   This has a 7-second safety warning before execution.

### Why This Workflow?

- **Version controlled**: All changes tracked in git
- **Reproducible**: Anyone can recreate database state from migrations
- **Testable**: Can verify migrations work on clean database
- **Auditable**: Clear history of when and why schema changed
- **Prevents drift**: Dev and prod databases stay in sync

---

## Forward-Only Migration Rules

### What "Forward-Only" Means

Once a migration file is created and committed to git:

- ✅ **Can**: Apply it to databases that don't have it yet
- ❌ **Cannot**: Edit the file
- ❌ **Cannot**: Delete the file
- ❌ **Cannot**: Rename the file
- ❌ **Cannot**: Change the order

### If You Need to Fix a Mistake

Create a new migration that reverses or corrects the previous one:

```bash
# Wrong: Editing 0002_add_user_preferences.sql
# Right: Creating 0003_fix_user_preferences.sql
npm run db:migration:new fix_user_preferences
```

### Why No Rollbacks?

- Migrations may have been applied to production
- Data may have been created/modified based on the schema
- Rolling back can cause data loss or corruption
- Forward-only keeps a clear audit trail

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

# Apply to PRODUCTION database (7-second warning)
npm run db:push:prod
```

**Always test in dev first!**

### Resetting Development Database

```bash
# Drop and recreate dev database from all migrations
npm run db:reset:dev
```

**⚠️ This is DESTRUCTIVE** - drops and recreates the entire database

**Use Cases**:

- Testing that migrations work from scratch
- Cleaning up after failed experiments
- Verifying migration order is correct

**Never run on production** - this command is dev-only for safety

### Checking Schema Differences

```bash
# See differences between current database and migration files
npm run db:diff:dev
```

Shows the SQL needed to bring migration files in sync with your current database state. Use this after making changes in the Supabase Dashboard UI to generate migration SQL.

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

---

## Safety Rules

### ✅ DO

- **Always test in dev first** before applying to prod
- **Use the diff workflow** for all schema changes (`db:diff:dev`)
- **Never edit the baseline** (`0001_baseline.sql`) - it's the production source of truth
- **Create new migrations** for all schema changes (forward-only)
- **Use idempotent SQL** when possible (`IF NOT EXISTS`, `ON CONFLICT`, etc.)
- **Include RLS policies** on all new tables
- **Add indexes** for frequently queried columns
- **Document complex changes** with comments in migration files
- **Test migration chain** with `db:reset:dev` before applying to production
- **Commit migrations to git** before applying to prod

### ❌ DON'T

- **Don't edit existing migrations** - create new forward-only migrations
- **Don't make manual SQL editor changes** - always use the diff workflow
- **Don't modify the baseline** - production is the source of truth
- **Don't run `db:reset:dev` on production** - it's dev-only
- **Don't skip dev testing** - always test before prod
- **Don't make destructive changes** without understanding impact
- **Don't bypass RLS** or remove security constraints

---

## Troubleshooting

### Issue: Migration fails to apply

**Symptoms**: Error when running `npm run db:push:dev` or `db:push:prod`

**Possible Causes**:

1. Syntax error in SQL
2. Conflicting constraint or index names
3. Attempting to modify existing objects (use `IF NOT EXISTS`)
4. RLS preventing the migration from running

**Solutions**:

1. Review the migration SQL carefully
2. Test SQL snippets in Supabase Dashboard SQL editor
3. Check for naming conflicts with existing database objects
4. Ensure migration uses idempotent patterns

### Issue: Dev and prod databases out of sync

**Symptoms**: Application works in dev but fails in production

**Cause**: Migrations not applied to production, or manual changes made in SQL editor

**Solution**:

```bash
# Check which migrations are missing in prod
npm run db:migration:list:prod

# Apply missing migrations
npm run db:push:prod
```

**Prevention**: Always use the diff workflow, never make manual SQL editor changes

### Issue: Need to undo a migration

**You Cannot**: Migrations are forward-only, no rollback support

**Solution**: Create a new migration that reverses the change

```bash
npm run db:migration:new revert_previous_change
```

Then write SQL that undoes the previous migration (e.g., `DROP TABLE`, `DROP COLUMN`, etc.)

---

## Need Help?

**Quick Reference**:

- See `supabase/MIGRATIONS-README.md` for command quick reference
- See `docs/DEV-PROD-WORKFLOW.md` for dev/prod setup
- Check the baseline migration for SQL examples

**Common Questions**:

- "How do I create a migration?" → Use diff workflow: make UI changes, then `npm run db:diff:dev`
- "How do I test safely?" → `npm run db:push:dev` (uses dev database)
- "How do I apply to prod?" → `npm run db:push:prod` (has 7-second warning)
- "I broke dev database" → `npm run db:reset:dev` (rebuilds from migrations)
- "Can I edit an existing migration?" → No, create a new forward-only migration

---

**Last Updated**: December 5, 2025  
**Baseline Migration**: `0001_baseline.sql` (from production, December 5, 2025)

- 2 critical (bootstrap RLS + auth trigger)
- 7 feature migrations (Dec 2025: board templates, repeatable tasks, media reviews, tasks enhancements, board shares fixes)

**Archived Migrations**: 60 files in `supabase/migrations/archive/`
