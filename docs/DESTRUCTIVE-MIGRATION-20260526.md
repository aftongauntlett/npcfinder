# Destructive Migration Notice (2026-05-26)

## Scope

This document describes destructive schema changes introduced by:

- `supabase/migrations/20260526000002_destructive_cleanup_legacy_features.sql`

## Why This Is Destructive

The migration permanently removes legacy feature schemas that are being replaced by the new Tracker + Playlists data model.

Dropped data structures include:

- Recommendations:
  - `movie_recommendations`
  - `music_recommendations`
  - `book_recommendations`
  - `game_recommendations`
  - `movie_recommendations_with_users`
  - `music_recommendations_with_users`
  - `book_recommendations_with_users`
  - `game_recommendations_with_users`
- Tasks / Kanban / Recipes:
  - `task_boards`
  - `task_board_sections`
  - `tasks`
  - `task_board_members`
  - `task_boards_with_stats`
  - `board_shares`
- Legacy collections + role-based members:
  - `media_lists`
  - `media_list_items`
  - `media_list_members`
  - `media_lists_with_counts`
- Legacy personal media libraries (superseded by `tracker_items`):
  - `user_watchlist`
  - `user_watched_archive`
  - `reading_list`
  - `game_library`
  - `music_library`

## Safety Preconditions

Before applying the destructive migration, verify that:

1. `20260526000001_tracker_playlists_media_catalog.sql` has completed successfully.
2. Data has been backfilled into:
   - `media`
   - `tracker_items`
   - `playlists`
   - `playlist_items`
   - `playlist_shares`
3. Application routes and services no longer read from dropped tables.
4. A recent production backup exists.

## Rollback Strategy

This migration is forward-only. Rollback requires restoring from backup or a compensating migration that recreates dropped schema and reloads data.

## Product Impact

Users move to:

- Tracker: personal diary model (`tracker_items`)
- Playlists: curated collections (`playlists`, `playlist_items`, `playlist_shares`)
