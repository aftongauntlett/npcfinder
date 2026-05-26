# Current App State (Agent Reference)

Last updated: 2026-05-18

This document is an internal source of truth for docs + agent work. Use it to avoid reintroducing removed features or linking to deleted docs.

## Product Surface (Current)

- Invite-only social app for trusted circles
- Primary experience: shared media collections
- Secondary experience: generic tasks workspace
- Admin + invite management: active

## Active Routes

- Public:
  - `/` (landing)
  - `/login`, `/forgot-password`, `/reset-password`
- Authenticated:
  - `/app` (dashboard)
  - `/app/media`
  - `/app/media/:collectionId`
  - `/app/tasks`
  - `/app/settings`
  - `/app/admin` (role-protected)

No dedicated `/app/game` route is currently wired into the authenticated app router.

## Navigation Labels

Top nav currently exposes:

- Dashboard
- Tasks
- Media

## Media Model (Current UX)

- Collections-first UX under `/app/media`
- Collections can be private or app-wide
- Collection member roles: `viewer`, `editor`
- "Mixed" collections are first-class and are the default create flow

## Removed / Deprecated Product Areas

- Dedicated game page/route has been removed from the routed app surface
- Job tracking template has been removed (see migration `20260518000000_remove_job_applications_template.sql`)

Note: Some legacy game-related types/services remain in code for compatibility and ongoing cleanup, but they are not a top-level routed product area.

## Documentation Policy

- Do not link to deleted docs such as `API-SETUP.md`, `APP-PURPOSE-AND-DIRECTION.md`, or `TRAYCER-PROMPTS.md`
- Keep root docs focused on currently accessible flows and existing files
- If routes or nav labels change, update this file first, then update `README.md` and `docs/README.md`
