# Dev/Prod Database Workflow

**Purpose**: Safe database development with separate dev and production databases  
**Benefit**: Test schema changes without risking production data  
**Last Updated**: November 16, 2025

---

## Overview

This workflow uses **two separate Supabase projects**:

- **Development Database**: For testing schema changes, experimenting with features
- **Production Database**: For real user data (protected from development mistakes)

When you run `npm run dev` (Vite development mode), the app automatically uses the dev database. When deployed to production, it uses the production database.

## Benefits

✅ **Safety**: Never accidentally corrupt production data  
✅ **Confidence**: Test migrations thoroughly before applying to prod  
✅ **Speed**: Experiment freely without fear  
✅ **Rollback**: Easy to reset dev database if things go wrong  
✅ **Real Testing**: Test with realistic data and schema

---

## Setup

### Step 1: Create Development Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name it clearly (e.g., "npc-finder-dev")
4. Choose same region as production (for consistency)
5. Save the database password

**Note**: Supabase free tier allows multiple projects - perfect for dev/prod separation.

### Step 2: Initialize Dev Database

Apply the baseline migration to your dev database:

1. Open Supabase Dashboard → Your Dev Project → SQL Editor
2. Copy entire contents of `supabase/migrations/20250116000000_baseline_schema.sql`
3. Paste and run
4. Verify tables were created: Database → Tables

Your dev database now has the exact same schema as production.

### Step 3: Configure Environment Variables

Add dev credentials to `.env.local`:

```bash
# Production Database (required)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key

# Development Database (optional but recommended)
VITE_SUPABASE_DEV_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_DEV_ANON_KEY=your-dev-anon-key

# CLI Tools - Project References (required for db:push:dev and db:push:prod)
SUPABASE_DEV_PROJECT_REF=your-dev-project-ref
SUPABASE_PROD_PROJECT_REF=your-prod-project-ref
```

**How to find these values**:

- Supabase Dashboard → Project Settings → API
- Copy "Project URL" → `VITE_SUPABASE_DEV_URL`
- Copy "anon public" key → `VITE_SUPABASE_DEV_ANON_KEY`

- Supabase Dashboard → Project Settings → General
- Copy "Reference ID" → `SUPABASE_DEV_PROJECT_REF`

### Step 4: Verify Automatic Switching

Start the dev server:

```bash
npm run dev
```

Check the browser console. You should see:

```
🔧 Using DEVELOPMENT database
```

If you see this, you're all set! The app is using your dev database.

**If you see** `⚠️ Using PRODUCTION database (dev database not configured)`:

- Double-check your `.env.local` file has dev variables
- Ensure variables start with `VITE_SUPABASE_DEV_`
- Restart the dev server (`Ctrl+C`, then `npm run dev`)

---

## Daily Development Workflow

### 1. Work on Features (Using Dev Database)

```bash
npm run dev
# App automatically connects to dev database
```

- All data changes happen in dev
- Safe to experiment with UI, features, data
- Can create test users, test data freely

### 2. Create Database Migration

When you need to change the schema (add table, modify column, etc.):

```bash
npm run db:migration:new add_user_preferences_table
```

This creates a new file: `supabase/migrations/YYYYMMDD_add_user_preferences_table.sql`

Edit the file with your SQL changes:

```sql
-- Add user preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 3. Apply Migration to Dev Database

```bash
npm run db:push:dev
```

This pushes all pending migrations to your **development** database only.

**Check the result**:

1. Supabase Dashboard → Dev Project → Database → Tables
2. Verify your new table appears
3. Test in the app (still running on dev database)

### 4. Test Thoroughly in Dev

- Create test data in the new table
- Verify RLS policies work correctly
- Test edge cases (null values, deletions, updates)
- Check application features using the new schema

**If something breaks**:

```bash
npm run db:reset:dev  # Drops and recreates dev database from all migrations
```

This is **safe** because it only affects dev. You can reset dev as many times as needed.

### 5. Push to Production (When Ready)

After thorough testing in dev:

```bash
npm run db:push:prod
```

You'll see:

```
⚠️  WARNING: Pushing to PRODUCTION database. Press Ctrl+C to cancel...
```

**5-second countdown gives you time to abort** if you made a mistake.

The migration will apply to **production** database with real user data.

### 6. Deploy Application Code

After production database is updated:

```bash
git add .
git commit -m "feat: add user preferences table"
git push origin main
```

Vercel automatically deploys the updated app code.

---

## Migration Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DEVELOP FEATURE                                           │
│    Developer writes code on localhost                        │
│    App automatically uses DEV database                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CREATE MIGRATION                                          │
│    npm run db:migration:new feature_name                     │
│    Write SQL in generated file                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. TEST IN DEV                                               │
│    npm run db:push:dev                                       │
│    Migration applied to DEV database                         │
│    Verify in dev environment                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. COMMIT MIGRATION                                          │
│    git add supabase/migrations/*                             │
│    git commit -m "feat: add feature"                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. APPLY TO PRODUCTION                                       │
│    npm run db:push:prod (5-second warning)                   │
│    Migration applied to PROD database                        │
│    Real users affected from this point                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. DEPLOY APP CODE                                           │
│    git push origin main                                      │
│    Vercel auto-deploys updated app                           │
│    Users can now use new feature                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Safety Checklist

Before pushing any migration to production, verify:

- [ ] **Tested in dev database** - Migration ran successfully
- [ ] **Tested app features** - UI works with new schema
- [ ] **RLS policies added** - All new tables have proper security
- [ ] **Indexes in place** - Performance optimizations included
- [ ] **Migration is idempotent** - Safe to run multiple times (use `IF NOT EXISTS`, `ON CONFLICT`, etc.)
- [ ] **No destructive changes** without backup plan (dropping columns, changing types)
- [ ] **Rollback plan** - Know how to reverse the change if needed
- [ ] **User impact assessed** - Understand how this affects existing users

---

## Common Workflows

### Adding a New Column

```sql
-- In new migration file
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update RLS policies if needed
-- Columns added to existing tables inherit the table's RLS
```

### Creating a New Table

```sql
-- In new migration file
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Always enable RLS on new tables
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own notes"
  ON user_notes FOR SELECT
  USING (auth.uid() = user_id);
```

### Modifying RLS Policies

```sql
-- In new migration file
DROP POLICY IF EXISTS "old_policy_name" ON table_name;

CREATE POLICY "new_policy_name"
  ON table_name FOR SELECT
  USING (new_condition);
```

### Rolling Back a Change

If a production migration causes issues, create a **reverse migration**:

```bash
npm run db:migration:new rollback_user_preferences
```

Write SQL to undo the previous change:

```sql
-- Reverse migration
DROP TABLE IF EXISTS user_preferences;
```

Test in dev, then apply to prod.

**Note**: Never delete or edit the original migration file - the reverse migration is the correct approach.

---

## Troubleshooting

### Migration Conflicts

**Problem**: Multiple developers creating migrations at the same time

**Solution**:

1. Pull latest changes: `git pull`
2. Check for migration conflicts: `npm run db:migration:list`
3. If your migration has same timestamp, rename it with a later timestamp
4. Test in dev database
5. Coordinate with team before pushing to prod

### Schema Drift (Dev and Prod Out of Sync)

**Problem**: Dev database schema doesn't match prod

**Solution**:

```bash
# Reset dev database to match migrations
npm run db:reset:dev

# This drops dev database and replays all migrations
# Your dev database will match prod exactly
```

### Checking Migration Status

```bash
# List all migrations and their status
npm run db:migration:list
```

Shows which migrations have been applied to the linked database.

### Accidental Production Change

**If you accidentally ran a destructive migration on production**:

1. **Don't panic** - Supabase has automatic backups
2. Go to: Supabase Dashboard → Database → Backups
3. Download most recent backup (before the migration)
4. Contact Supabase support if needed (for restoration)
5. Create reverse migration to undo changes
6. Review safety checklist above to prevent future accidents

---

## Team Collaboration (Future)

When multiple developers work on the project:

### Migration Coordination

1. **Communicate** before creating migrations (Slack/Discord)
2. **Pull frequently** to get latest migrations
3. **Test together** in shared dev database (optional second dev project)
4. **One person pushes** to production after team review

### Development Database Options

**Option 1**: Each developer has own dev database

- Pros: Complete isolation, can experiment freely
- Cons: More Supabase projects needed

**Option 2**: Shared dev database for team

- Pros: Easier coordination, one source of truth
- Cons: One developer's changes affect others

**Recommendation**: Start with individual dev databases, add shared dev if needed.

---

## Emergency Procedures

### Rollback a Migration

1. Create reverse migration (see "Rolling Back a Change" above)
2. Test reverse migration in dev
3. Apply to prod: `npm run db:push:prod`
4. Verify issue is resolved

### Restore from Backup

1. Supabase Dashboard → Database → Backups
2. Download backup file (before the problem)
3. Contact Supabase support for restoration assistance
4. Or manually restore to a new project and migrate users

### Force Reset Production (DANGER)

**Only if catastrophic failure and no other options**:

1. Create new migration that drops/recreates everything
2. Export all user data first
3. Test extensively in dev
4. Apply to prod during maintenance window
5. Re-import user data

**This should NEVER be necessary** with proper dev/prod workflow.

---

## Advanced: Database Diff

If you make manual changes in Supabase Dashboard (not recommended):

```bash
# See what's different between your database and migrations
npm run db:diff:dev
```

This shows SQL needed to bring migrations up to date with database.

**Use case**: If you quickly tested something in SQL Editor and want to convert it to a migration.

---

## Summary

**Development Database = Your Sandbox**

- Experiment freely
- Reset as needed
- No user impact

**Production Database = Sacred**

- Only apply tested migrations
- 5-second warning before changes
- Real user data lives here

**The Workflow**:

1. Develop feature (uses dev DB automatically)
2. Create migration
3. Test in dev
4. Push to prod (when confident)
5. Deploy app code

This workflow **prevents production disasters** while enabling fast development.

---

**For migration syntax and best practices**, see: [DATABASE-MIGRATIONS.md](DATABASE-MIGRATIONS.md)  
**For emergency procedures**, see: [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md)
