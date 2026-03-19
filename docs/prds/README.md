# Product PRDs

This directory contains implementation-ready PRDs for active and future product work.

Use these docs as source-of-truth prompts for Copilot and external review agents.

## PRDs

- [Profiles Nostalgia PRD](PROFILES-NOSTALGIA-PRD.md)
- [Groups and Networks PRD](GROUPS-NETWORKS-PRD.md)
- [Browser Game Strategy PRD](BROWSER-GAME-PRD.md)
- [Privacy Security PRD](PRIVACY-SECURITY-PRD.md)
- [Reality Check Watch Party PRD](REALITY-CHECK-WATCH-PARTY-PRD.md)
- [PRD Execution Workflow](PRD-EXECUTION-WORKFLOW.md)

## Current Milestones

- Browser game foundation implemented: `/app/game` route + Supabase `game-launch` token scaffold (see `docs/BROWSER-GAME-INTEGRATION.md`)

## Implementation Status Snapshot (2026-03-18)

- Browser Game PRD: **Partially complete** (Phase 0 scaffold done, gameplay and multiplayer phases pending)
- Privacy Security PRD: **Partially complete** (strong RLS/invite/security baseline; account deletion backend function exists; full checklist still not finished)
- Groups Networks PRD: **Not started** (no groups tables, route, hooks, or tests yet)
- Profiles Nostalgia PRD: **Not started** for PRD scope (current settings/profile basics exist, but no `/app/profile/:userId` customization system from PRD)
- Reality Check Watch Party PRD: **New** (planning baseline for realistic future execution)

## Archive Decision

No PRDs moved to archive yet. Current set should remain active because none are fully complete end-to-end.

## Recommended Order

1. Groups and Networks (foundation)
2. Profiles (identity and expression)
3. Browser Game gameplay iteration (foundation already in place)
