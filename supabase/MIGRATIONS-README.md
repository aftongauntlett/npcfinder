# Migrations Directory

This directory contains database schema migrations for the NPC Finder application.

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
- Test migrations in development before applying to production
- Reset your dev database freely using `npm run db:reset:dev`

❌ **NEVER:**

- Edit existing migration files (including the baseline)
- Make manual changes in the Supabase SQL editor
- Skip migrations or apply them out of order
- Delete or rename migration files

## Setup Instructions

### Fresh Database Setup

To set up a new database (development or production):

```bash
# Development database (safe to experiment)
npm run db:push:dev

# Production database (7-second safety warning)
npm run db:push:prod
```

This applies the baseline migration and all forward-only migrations in order.

### Creating Your First Admin User

After pushing migrations to a fresh database:

```bash
# Create bootstrap invite code
npm run db:create-bootstrap-code
```

The first user to sign up automatically receives admin privileges.

## Working with Migrations

### Creating New Migrations

**CRITICAL**: Never make manual changes in the Supabase SQL editor. Always use the diff workflow:

```bash
# 1. Make your schema changes in Supabase Dashboard (tables/columns/etc)
# 2. Generate a migration from the diff
npm run db:diff:dev

# 3. Review the generated SQL in the new migration file
# 4. Create a properly named migration file
npm run db:migration:new <descriptive_name>

# 5. Copy the SQL from the diff into your new migration file
# 6. Test in development
npm run db:push:dev

# 7. After testing, apply to production
npm run db:push:prod
```

### Checking Migration Status

```bash
# List migrations for dev database
npm run db:migration:list:dev

# List migrations for prod database
npm run db:migration:list:prod
```

### Resetting Development Database

Safe to do at any time during development:

```bash
npm run db:reset:dev
```

This drops and recreates your dev database, then reapplies all migrations from scratch.

## Important Rules

⚠️ **NEVER edit existing migration files**

- Editing breaks the migration chain and causes deployment failures
- Always create new forward-only migrations

⚠️ **NEVER make manual changes in SQL editor**

- Use the dashboard UI to modify schema, then use `db:diff` to capture changes
- Manual SQL changes won't be tracked in version control

⚠️ **ALWAYS test in dev first**

- Apply and test all migrations in development before production
- Use `npm run db:reset:dev` to verify migrations work on a clean database

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

- `0001_baseline.sql` is the foundation
- Contains complete schema including tasks system (as of Nov 23, 2025)
- If you need to change the schema, create a new forward-only migration
- The baseline should only be modified when consolidating for a fresh database reset

⚠️ **Schema consolidation workflow**

- When preparing for production deployment with a fresh database
- Individual migrations can be consolidated into the baseline
- Consolidated migrations are moved to `archive/` for historical reference
- This keeps the migration chain clean and manageable
- Represents the clean starting point for all new databases
- All fixes have been consolidated (as of Nov 19, 2025)
- Future changes go in new forward-only migrations

⚠️ **Always test in dev first**

- Use `npm run db:push:dev` to test migrations
- Only push to production when confident

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
