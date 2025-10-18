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

## Need Help?

Check existing migrations in `supabase/migrations/` for examples.
