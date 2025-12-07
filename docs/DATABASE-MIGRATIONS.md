# Database Migrations

**Status**: Single Baseline + Forward-Only Migrations  
**Baseline Created**: December 5, 2025  
**Current Baseline**: `0001_baseline.sql`  
**Source**: Production database schema (pulled December 5, 2025)

---

## Overview

This project uses **database migrations** to manage schema changes in a version-controlled, reproducible way.

### ⚠️ Single Production Database Workflow

**CRITICAL**: This project works DIRECTLY with production database via linked Supabase CLI.

- **Linked Project**: All `db:*` commands operate on the Supabase project linked via CLI
- **How**: Changes are made carefully in Supabase Dashboard UI, then captured via migrations
- **Config**: Uses `VITE_SUPABASE_PROJECT_REF` from `.env.local` for linking (the only project ref needed)

### Migration Philosophy

**Single Baseline + Strict Forward-Only Approach**:

- ✅ One authoritative baseline migration contains the complete production schema
- ✅ All schema changes use `supabase db diff` workflow (never manual SQL editor changes)
- ✅ All future changes are forward-only migrations (never edit existing migrations)
- ✅ Migrations are applied directly to production database via linked CLI
- ✅ Changes are made carefully in Supabase Dashboard UI and tested before running migrations

**Why This Approach**:

- Production database is the source of truth
- Clean, simple migration history starting from a known-good state
- No historical baggage from prototype phase
- Professional workflow for schema changes
- Work directly in production with careful, tested changes

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
# Linked production database (only target available)
npm run db:push
```

**Note**: This project works directly in production via a linked Supabase CLI project.
The `db:push` command applies all pending migrations to the linked project.

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
   npm run db:diff
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

6. **Apply to production**

   ```bash
   npm run db:push
   ```

   This will apply all pending migrations to the linked production database.

7. **Verify the migration works**

   - Check that all tables/columns/indexes were created correctly
   - Test affected application features
   - Run your test suite: `npm run test`

**Note**: This project works directly with production database via a linked Supabase CLI project.
All changes are made carefully in the Supabase Dashboard UI and tested thoroughly before capturing as migrations.

### Why This Workflow?

- **Version controlled**: All changes tracked in git
- **Reproducible**: Anyone can recreate database state from migrations
- **Production-first**: Changes are applied via Dashboard UI, then captured for version control
- **Auditable**: Clear history of when and why schema changed
- **No drift**: Migration files capture the exact state of production schema changes

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
# List applied migrations
npm run db:migration:list
```

Shows which migrations are pending vs. applied.

### Applying Migrations

```bash
# Apply pending migrations to linked database
npm run db:push
```

**Note**: This applies to the linked production database. Make changes carefully.

### Checking Schema Differences

```bash
# See differences between current database and migration files
npm run db:diff
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

**3. Apply to Production Database**

```bash
npm run db:push
```

Verify in Supabase Dashboard:

- Table appears in Database → Tables
- Columns are correct
- RLS policies are in place

**4. Test in Application**

Run your app on localhost:

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
```

**Never edit an already-applied migration** - create a new one instead.

**6. Commit Migration**

```bash
git add supabase/migrations/YYYYMMDD_add_notification_settings.sql
git commit -m "feat: add notification settings table"
```

**7. Deploy Application Code**

```bash
git push origin main
```

Vercel automatically deploys the updated app that uses the new schema.

---

---

## Safety Rules

### ✅ DO

- **Make changes carefully** in Supabase Dashboard UI
- **Use the diff workflow** for all schema changes (`db:diff`)
- **Never edit the baseline** (`0001_baseline.sql`) - it's the production source of truth
- **Create new migrations** for all schema changes (forward-only)
- **Use idempotent SQL** when possible (`IF NOT EXISTS`, `ON CONFLICT`, etc.)
- **Include RLS policies** on all new tables
- **Add indexes** for frequently queried columns
- **Document complex changes** with comments in migration files
- **Test thoroughly** in the application before running migrations
- **Commit migrations to git** before applying

### ❌ DON'T

- **Don't edit existing migrations** - create new forward-only migrations
- **Don't make manual SQL editor changes** - always use the diff workflow
- **Don't modify the baseline** - production is the source of truth
- **Don't make destructive changes** without understanding impact
- **Don't bypass RLS** or remove security constraints
- **Don't run `supabase start`** - we work directly in production

---

## Troubleshooting

### Issue: Migration fails to apply

**Symptoms**: Error when running `npm run db:push`

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

### Issue: Need to check migration status

**Solution**:

```bash
# Check which migrations have been applied to linked production database
npm run db:migration:list
```

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
- Check the baseline migration for SQL examples

**Common Questions**:

- "How do I create a migration?" → Use diff workflow: make UI changes, then `npm run db:diff`
- "How do I apply migrations?" → `npm run db:push`
- "How do I check migration status?" → `npm run db:migration:list`
- "Can I edit an existing migration?" → No, create a new forward-only migration
- "Do we have a local/dev database?" → No, we work directly in production

---

**Last Updated**: December 7, 2025  
**Baseline Migration**: `0001_baseline.sql` (from production, December 5, 2025)
**Active Migrations**: All post-baseline migrations in `supabase/migrations/` directory
**Archived Migrations**: Not maintained in this repository (if they exist, they are in a separate location)
