# Database Migrations

**Status**: Baseline + Forward-Only Migrations  
**Last Reset**: November 16, 2025  
**Current Baseline**: `20250116000000_baseline_schema.sql`

---

## Overview

This project uses **database migrations** to manage schema changes in a version-controlled, reproducible way.

### Migration Philosophy

**Baseline + Forward-Only Approach**:

- ✅ Single baseline migration contains the complete, correct schema
- ✅ All old prototype migrations are archived (preserved for history)
- ✅ All future changes are forward-only migrations (never edit existing migrations)
- ✅ Migrations are tested in dev database before applying to production

**Why This Approach**:

- Clean starting point before real user data
- Simplified migration chain (no replaying 60+ prototype migrations)
- Historical record preserved in archive
- Professional workflow for production database

---

## Migration Structure

```
supabase/migrations/
├── 20250116000000_baseline_schema.sql    ← The complete schema (start here)
├── archive/                              ← Old prototype migrations (reference only)
    ├── README.md
    ├── 20241001000000_create_user_profiles.sql
    ├── 20241002000000_create_recommendations.sql
    └── ... (60+ archived files)
```

**Note**: Future migrations will appear as additional files (e.g., `20250120000000_add_user_preferences.sql`) after you create them.

### Baseline Migration

**File**: `supabase/migrations/20250116000000_baseline_schema.sql`

**What It Contains**:

- All tables (user_profiles, connections, watchlists, recommendations, etc.)
- All functions (is_admin, batch_connect_users, etc.)
- All triggers (admin protection, timestamp updates, etc.)
- All RLS policies (security policies for every table)
- All indexes (performance optimization)
- Bootstrap invite code (BOOTSTRAP_ADMIN_2025 for initial admin access)

**When to Run**:

- When setting up a new database (dev or prod)
- Never on an existing database that already has data
- If resetting database to clean state

**How to Run**:

1. Supabase Dashboard → SQL Editor
2. Copy entire file contents
3. Paste and execute
4. Verify tables created: Database → Tables

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

### Bootstrap Invite Code

The baseline includes a permanent invite code for admin access after database reset:

**Code**: `BOOTSTRAP_ADMIN_2025`  
**Email**: `afton.gauntlett@gmail.com`  
**Expires**: December 31, 2099 (effectively never)  
**Purpose**: Create initial admin account after fresh database setup

**How to use**:

1. Reset database (apply baseline migration)
2. Sign up with email: `afton.gauntlett@gmail.com`
3. Use invite code: `BOOTSTRAP_ADMIN_2025`
4. You now have admin access to create more invite codes

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

**Last Updated**: November 16, 2025  
**Baseline Migration**: `20250116000000_baseline_schema.sql`  
**Archived Migrations**: 60 files in `supabase/migrations/archive/`
