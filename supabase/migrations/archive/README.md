# Archived Prototype Migrations

**Archive Date**: November 16, 2025  
**Status**: Historical Reference Only - Do Not Run

## Purpose

This directory contains all migrations created during the prototype development phase (October 2024 - January 2025). These migrations have been **superseded by the baseline migration** and are preserved here for historical reference only.

## What Happened

Before inviting real users to the application, we consolidated 60+ incremental prototype migrations into a single baseline migration (`20250116000000_baseline_schema.sql`). This provides:

- ✅ Clean starting point for production database
- ✅ Single source of truth for schema
- ✅ Historical record of development journey
- ✅ Simplified migration chain going forward

## Important Notes

⚠️ **NEVER run these migrations on new databases**

The baseline migration (`../20250116000000_baseline_schema.sql`) contains the cumulative result of all these migrations. Running these archived migrations would:

- Cause conflicts with the baseline
- Create duplicate tables/functions
- Break the database schema

## What's Archived

All migrations from the prototype phase, including:

- **User System**: User profiles, admin roles, authentication
- **Media Tracking**: Watchlists, reading lists, music/game libraries
- **Recommendations**: Movie, music, book, and game recommendation systems
- **Social Features**: User connections, friend system
- **Security**: RLS policies, admin protection triggers, invite system
- **Performance**: Indexes, composite indexes, query optimization
- **Reviews**: Media reviews and ratings system

## Baseline Migration

The complete, correct schema is now in:

```
../20250116000000_baseline_schema.sql
```

All future schema changes must be forward-only migrations created after this baseline.

## Development History

These migrations represent approximately 4 months of development work:

- October 2024: Initial user system and movie recommendations
- November 2024: Music and book features, game library
- December 2024: Security hardening, performance optimization
- January 2025: Invite system, admin controls, final polish

The archive preserves this history while allowing a clean production start.

---

**For current migration workflow**, see: `../../docs/DATABASE-MIGRATIONS.md`
