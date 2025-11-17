# Migrations Directory

This directory contains database schema migrations for the NPC Finder application.

## Quick Reference

### Current State

**Baseline Migration**: `20250116000000_baseline_schema.sql`

- Complete schema as of November 16, 2025
- Single source of truth for database structure
- Includes bootstrap invite code for initial admin access

**Archived Migrations**: See `archive/` directory

- Prototype phase migrations (Oct 2024 - Jan 2025)
- Historical reference only
- **Do not run these on new databases**

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

- `20250116000000_baseline_schema.sql` is sacred
- It represents the clean starting point

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
