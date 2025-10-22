# Database Migrations

## What Are Migrations?

Database migrations are version-controlled SQL files that update your database schema.

## Location

All migrations are in: `supabase/migrations/`

Each file is timestamped: `20250101000000_description.sql`

## Running Migrations

### With Supabase CLI

```bash
# Install CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push

# Check status
supabase migration list
```

### Manually

1. Open Supabase dashboard
2. Go to SQL Editor
3. Copy migration file contents
4. Run in editor
5. Check for errors

## Creating New Migrations

```bash
# Create new migration file
supabase migration new add_feature_name

# Edit the generated file in supabase/migrations/
# Add your SQL changes

# Test locally (if using local Supabase)
supabase db reset

# Push to production
supabase db push
```

## Migration Best Practices

### Always Include

```sql
-- Add column with default
ALTER TABLE table_name
ADD COLUMN new_column TEXT DEFAULT 'default_value';

-- Add NOT NULL after data is populated
ALTER TABLE table_name
ALTER COLUMN new_column SET NOT NULL;
```

### Never Do

```sql
-- Don't drop columns in production without backup
ALTER TABLE table_name DROP COLUMN old_column;

-- Don't rename columns without data migration plan
ALTER TABLE table_name RENAME COLUMN old TO new;
```

## Current Schema

Main tables:

- `user_profiles` - User accounts and settings
- `connections` - Friend relationships
- `invite_codes` - Invitation system
- `music_recommendations` - Music sharing
- `movie_recommendations` - Movie/TV sharing
- `suggestions` - Group suggestions

## Rollback

Migrations don't auto-rollback. To undo:

1. Create new migration that reverses changes
2. Or restore from Supabase backup (Settings > Database > Backups)

## Common Issues

**"Migration failed"**

- Check SQL syntax
- Check for conflicting column names
- Check for missing tables/columns

**"Can't drop column - in use"**

- Remove foreign key constraints first
- Check for dependent views/functions

## Production Safety

Before running migrations in production:

1. Test in development first
2. Backup database
3. Plan rollback strategy
4. Run during low-traffic time
5. Monitor for errors

## Recent Security Migrations (October 2025)

### 20251021000011_fix_remaining_search_paths.sql

**Date**: October 21, 2025  
**Purpose**: Security hardening - Function search path protection  
**What It Does**: Adds `SET search_path` to 6 functions flagged by Supabase Security Advisor to prevent schema hijacking attacks  
**Critical**: Yes - includes SECURITY DEFINER function `validate_invite_code`  
**Safe to Run**: Yes - only adds security constraints, doesn't change function behavior or data

**Functions Secured**:

- `validate_invite_code(code_value text)` - Critical SECURITY DEFINER function
- `update_user_profiles_updated_at()` - Trigger function
- `update_music_rec_consumed_at()` - Trigger function
- `update_movie_rec_watched_at()` - Trigger function
- `update_watchlist_updated_at()` - Trigger function
- `verify_data_integrity()` - Admin utility function

### 20251021000012_add_security_barrier_to_music_view.sql

**Date**: October 21, 2025  
**Purpose**: Security hardening - View security barrier consistency  
**What It Does**: Adds `security_barrier='true'` to `music_recommendations_with_users` view for consistency with movie view  
**Critical**: Medium - prevents information leakage through query optimization  
**Safe to Run**: Yes - only adds security constraint, doesn't change view logic or data

**Why It Matters**: Security barriers prevent query optimization from pushing predicates down in ways that could leak information through side effects. Both movie and music views now have consistent security posture.

**Context**: These migrations address issues flagged by Supabase Security Advisor during October 2025 audit. See `08-SECURITY-RECOMMENDATIONS-REVIEW.md` for full audit details.

## Need Help?

Check existing migrations in `supabase/migrations/` for examples.
