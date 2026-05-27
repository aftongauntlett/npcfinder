# Current App State (Agent Reference)

Last updated: 2026-05-26

This document is an internal source of truth for docs + agent work. Use it to avoid reintroducing removed features or linking to deleted docs.

## Product Surface (Current)

- Private media tracker with collaborative playlists
- Primary experience: Tracker (personal media diary)
- Secondary experience: Playlists (mixed-media curation + invite-only sharing)
- Admin + invite management: active

## Active Routes

- Public:
  - `/` (landing)
  - `/login`, `/forgot-password`, `/reset-password`
- Authenticated:
  - `/app` -> redirects to `/app/tracker/movies-tv`
  - `/app/tracker` -> redirects to `/app/tracker/movies-tv`
  - `/app/tracker/movies-tv`
  - `/app/tracker/books`
  - `/app/tracker/music`
  - `/app/tracker/games`
  - `/app/playlists`
  - `/app/settings`
  - `/app/admin` (role-protected)

## Navigation Labels

Sidebar currently exposes:

- Tracker
  - Movies & TV
  - Books
  - Music
  - Games
- Playlists
- Settings
- Admin (role-protected)

## Media Model (Current UX)

- Shared catalog model via `media`
- Tracker model via `tracker_items` (`want_to`, `in_progress`, `done`) with genre-scoped routes
- Playlists model via `playlists`, `playlist_items`, `playlist_shares`
- Playlist item sourcing is from user tracker entries (not direct external API search)
- Playlist sharing is invite-only and view-only for guests
- Tracker is private and never shared

## Removed / Deprecated Product Areas

- Recommendations surface has been removed from routed app UX
- Tasks/Kanban/Recipes surface has been removed from routed app UX
- Top nav has been replaced by sidebar navigation
- App-wide/public collections are removed from active UX
- Collection member edit roles are removed from active UX

Note: Remaining legacy files may still exist in the repository while migration and feature cleanup continues, but they are not part of the routed product surface.

## Documentation Policy

- Do not link to deleted docs such as `API-SETUP.md`, `APP-PURPOSE-AND-DIRECTION.md`, or `TRAYCER-PROMPTS.md`
- Keep root docs focused on currently accessible flows and existing files
- If routes or nav labels change, update this file first, then update `README.md` and `docs/README.md`
