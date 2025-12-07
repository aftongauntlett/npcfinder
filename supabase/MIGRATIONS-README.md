# Migrations Directory

This directory contains database schema migrations for the NPC Finder application.

## ⚠️ IMPORTANT: Single Production Database Workflow

**This project works DIRECTLY in production** - there is no separate local dev database.

- All `db:*` npm scripts operate on the linked production project
- The laptop is too slow for local Supabase development
- Changes are made carefully in Supabase Dashboard UI, then captured via migrations
- Linked project configured via `npx supabase link --project-ref` (uses VITE_SUPABASE_PROJECT_REF from .env.local)

## Current State

**Single Baseline Migration**: `0001_baseline.sql`

- Complete, authoritative schema pulled from production database (December 5, 2025)
- Single source of truth for all database structure
- Includes all tables, views, functions, triggers, RLS policies, indexes, and constraints
- Generated using `supabase db pull` from a healthy production database

**All previous migrations have been consolidated into this baseline.**

## Migration Philosophy

This project follows a **strict forward-only migration approach**:

✅ **DO:**

- Use the baseline migration (`0001_baseline.sql`) as the foundation for all new databases
- Create new migrations for all future schema changes using `supabase db diff`
- Test migrations carefully in Supabase Dashboard UI before capturing them
- Make schema changes in Dashboard UI, then use `npm run db:diff` to generate migration SQL

❌ **NEVER:**

- Edit existing migration files (including the baseline)
- Make manual changes in the Supabase SQL editor
- Skip migrations or apply them out of order
- Delete or rename migration files

## Setup Instructions

### Fresh Database Setup

⚠️ **WARNING**: All commands operate on the linked production database.

To apply migrations to the linked production database:

```bash
# Apply all pending migrations to production
npm run db:push
```

This applies the baseline migration and all forward-only migrations in order.

### Creating Your First Admin User

After pushing migrations to a fresh database, you need to create an admin user:

**Option 1: Using the super admin script (recommended)**

```bash
npm run admin:configure
```

This creates a super admin user with enhanced privileges that cannot be demoted.

**Option 2: Manual SQL update**

Sign up through the app, then run in Supabase SQL Editor:

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

See `docs/ROLE-SYSTEM.md` and `docs/QUICK-START.md` for complete role system documentation.

## Working with Migrations

### Creating New Migrations

**CRITICAL**: Never make manual changes in the Supabase SQL editor. Always use the diff workflow:

```bash
# 1. Make your schema changes carefully in Supabase Dashboard UI (tables/columns/etc)
#    These changes apply directly to production, so test thoroughly in the UI first

# 2. Generate a migration from the diff
npm run db:diff

# 3. Review the generated SQL diff output

# 4. Create a properly named migration file
npm run db:migration:new <descriptive_name>

# 5. Copy the SQL from the diff into your new migration file

# 6. Apply the migration to production
npm run db:push
```

**Note**: Since we work directly in production, the Dashboard UI changes are already applied.
The migration file captures those changes for version control and reproducibility.

### Checking Migration Status

```bash
# List applied migrations for linked production database
npm run db:migration:list
```

## Important Rules

⚠️ **NEVER edit existing migration files**

- Editing breaks the migration chain and causes deployment failures
- Always create new forward-only migrations

⚠️ **NEVER make manual changes in SQL editor**

- Use the dashboard UI to modify schema, then use `db:diff` to capture changes
- Manual SQL changes won't be tracked in version control

⚠️ **Work carefully in production**

- All database operations target the linked production database
- Test schema changes thoroughly in the Supabase Dashboard UI before capturing migrations
- Changes made in the UI are applied immediately to production

⚠️ **Migrations are forward-only**

- No rollback support
- If you need to undo a change, create a new migration that reverses it

## Additional Resources

See `docs/DATABASE-MIGRATIONS.md` for detailed migration workflow and best practices.

## Recent Migrations

### Role System Migration (December 7, 2025)

**Migration: `20251207_add_role_system.sql`**

- Adds `user_role` enum type with three values: `user`, `admin`, `super_admin`
- Adds `role` column to `user_profiles` table
- Migrates existing `is_admin` boolean data to new role system
- Sets super admin from `app_config` table
- Creates helper functions: `get_user_role()`, `is_super_admin()`
- Updates triggers for role-based protection
- Maintains backward compatibility with generated `is_admin` column

**Migration: `20251207_update_rls_for_roles.sql`**

- Updates all RLS policies to use `get_user_role()` instead of `is_admin()`
- Adds missing admin override policies to several tables
- Restricts `app_config` table access to admins only (security fix)
- Updates policies on: tasks, boards, watchlists, libraries, reviews, recommendations, connections
- Adds comprehensive admin policies for: invite codes, audit logs, rate limits
- Implements consistent role-based access patterns across all tables

**See:** `docs/ROLE-SYSTEM.md` for complete role system documentation

⚠️ **NEVER edit the baseline migration**

- `0001_baseline.sql` is the foundation and represents the production schema as of December 5, 2025
- If you need to change the schema, create a new forward-only migration
- The baseline should only be recreated when doing a full consolidation from production

⚠️ **Schema consolidation strategy**

- **Historical consolidation**: All migrations prior to December 5, 2025 have been consolidated into `0001_baseline.sql`
- **Archived migrations**: If archived migrations exist, they are in a separate repository or branch (not in this workspace)
- **No archive directory**: This repository does not maintain a `supabase/migrations/archive/` directory
- **Future consolidation**: May be performed by:
  1. Pulling fresh schema from production with `npm run db:pull`
  2. Creating a new baseline migration file
  3. Archiving old migrations elsewhere (not in this repo)
  4. This is a major operation done only when necessary

⚠️ **Work carefully with production**

- All changes target the linked production database
- Test thoroughly in Supabase Dashboard UI before capturing migrations

## Full Documentation

For complete migration workflow and best practices:

📖 **[Database Migrations Guide](../../docs/DATABASE-MIGRATIONS.md)**

## Emergency Procedures

If a migration breaks production:

1. Create a reverse migration (don't delete the broken one)
2. Test the reverse migration in dev first
3. Apply to production with caution
4. Review what went wrong

See full troubleshooting in the documentation above.
