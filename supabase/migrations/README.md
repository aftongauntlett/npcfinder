# Migrations Directory

This directory contains database schema migrations for the NPC Finder application.

## Quick Reference

### Current State

**Baseline Migration**: `20250116000000_baseline_schema.sql`

- Complete schema as of November 16, 2025 (consolidated fixes November 19, 2025)
- Single source of truth for database structure
- Includes all tables, views (with security_barrier), functions, triggers, RLS policies, indexes
- **Consolidated Updates** (Nov 19, 2025):
  - ✅ Added `game_library.description_raw` column
  - ✅ Updated `book_recommendations` to allow `'listen'` type
  - ✅ Added `security_barrier='true'` to all recommendation views
  - ✅ Added missing `game_recommendations_with_users` view

**Forward-Only Migrations**: 2 additional migrations required after baseline

1. `20251119000000_allow_bootstrap_invite_creation.sql` - Bootstrap RLS policy
2. `20251119000001_add_auth_user_trigger.sql` - Auto-create user profiles on signup

**Archived Migrations**: See `archive/` directory

- Prototype phase migrations (Oct 2024 - Jan 2025)
- Historical reference only
- **Do not run these on new databases**

### Setup Instructions

To set up a fresh database, apply migrations in order:

```bash
# Apply all migrations (baseline + forward-only)
npm run db:push:dev
```

This applies:
1. Baseline schema (all tables, views, functions, RLS policies)
2. Bootstrap RLS policy (allows admin invite creation)
3. Auth trigger (auto-creates user profiles on signup)

Then create your admin invite code:

```bash
npm run db:create-bootstrap-code
```

### Known Issues (Resolved)

**Issue**: Original baseline migration (created Nov 16, 2025) was incomplete  
**Impact**: Missing 6 critical tables that were added in archived migrations but never consolidated  
**Resolution**: Baseline has been corrected to include all tables (reading_list, book_recommendations + view, game_library, game_recommendations, music_library, media_reviews)  
**Action Required**: If you ran the incomplete baseline before this fix, either:

1. Run the archived migrations for the missing tables (20251024201314, 20251024201354, 20251104001011, 20251104001052, 20251102000000, 20251022000001, 20251023043630), OR
2. Reset your database and re-run the corrected baseline migration

### Creating New Migrations

```bash
# Create a new migration file
npm run db:migration:new <descriptive_name>

# Example
npm run db:migration:new add_user_preferences_table
```

### Applying Migrations

```bash
# Test on development database (SAFE)
npm run db:push:dev

# Apply to production database (5-second warning)
npm run db:push:prod
```

### Checking Migration Status

```bash
# List migrations for dev database
npm run db:migration:list:dev

# List migrations for prod database
npm run db:migration:list:prod
```

## Important Rules

⚠️ **NEVER edit existing migration files**

- Always create new forward-only migrations
- Editing old migrations breaks the migration chain

⚠️ **NEVER edit the baseline migration**

- `20250116000000_baseline_schema.sql` is the foundation
- Represents the clean starting point for all new databases
- All fixes have been consolidated (as of Nov 19, 2025)
- Future changes go in new forward-only migrations

⚠️ **Always test in dev first**

- Use `npm run db:push:dev` to test migrations
- Only push to production when confident

## Full Documentation

For complete migration workflow, development setup, and best practices:

📖 **[Database Migrations Guide](../../docs/DATABASE-MIGRATIONS.md)**  
📖 **[Dev/Prod Workflow](../../docs/DEV-PROD-WORKFLOW.md)**

## Emergency Procedures

If a migration breaks production:

1. Create a reverse migration (don't delete the broken one)
2. Test the reverse migration in dev first
3. Apply to production with caution
4. Review what went wrong

See full troubleshooting in the documentation above.
