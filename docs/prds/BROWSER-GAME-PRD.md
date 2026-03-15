# PRD: Browser Social Game Strategy

Date: 2026-03-14  
Status: Phase 1 Scaffold Implemented

## 1) Decision

Build the game in a **separate repository** and integrate into NPC Finder via a thin integration layer.

## 2) Why Separate Repo?

- Different runtime and rendering concerns (game loop, assets, performance)
- Cleaner deployment and iteration cadence
- Reduces risk to core app stability
- Easier to scale game independently if it grows

## 3) Recommended Stack

- **Engine:** Phaser 3 (good for 2D browser games)
- **Language:** TypeScript
- **Client app:** Vite (or equivalent)
- **Backend/auth integration:** Supabase JWT/session handoff or signed token bridge

## 4) Integration Models

### Preferred (MVP): Embedded app route

- Host game at separate domain/subdomain (e.g. `play.npcfinder.com`)
- Open from NPC Finder route (`/app/game`) in same-tab redirect or controlled embed container
- Pass authenticated identity via short-lived signed token exchange

### Alternative: iframe embed

- Fast to ship but adds session/cookie/CSP complexity
- Use only if full-page routing is not acceptable

## 5) MVP Game Scope

Inspiration: light, cozy loop (Neopets/Gaia/Stardew vibes), but deliberately small:

- Player profile + avatar
- Daily action loop (3-5 repeatable actions)
- Lightweight inventory/progression
- Cosmetic personalization tied to app profile identity

## 6) Non-Goals (MVP)

- Real-time multiplayer world
- Player economy/marketplace
- Moderated UGC systems
- Complex combat systems

## 7) NPC Finder Integration Contract

Core integration points:

- identity handoff (user id, display name, avatar)
- friend/group context (optional, phase 2)
- event webhooks for profile activity snippets (optional)

Keep contract versioned and minimal.

## 8) Risks

- Scope explosion into full game studio project
- Asset pipeline and content production overhead
- Identity/session security mistakes across apps

## 9) Acceptance Criteria for Phase 0 (Architecture)

- ✅ New game repo scaffolded with Phaser + TypeScript
- ✅ Auth handoff design documented and reviewed
- ✅ NPC Finder has dedicated `/app/game` route, immersive layout behavior, and sidebar launch entry
- ✅ Supabase `game-launch` edge function scaffolded for short-lived tokenized launch flow
- ⏳ Gameplay loop implementation in progress (next phase)

## 10) Copilot Execution Prompt

```text
Implement Phase 0 of docs/prds/BROWSER-GAME-PRD.md.
In this repository:
- Add a placeholder /app/game launch route/page with clear copy
- Add documentation for integration contract and auth handoff assumptions

In a new repository plan:
- Provide scaffold instructions for Phaser + TypeScript game app
- Define token exchange flow between npc-finder and game app

Do not build full gameplay yet. Focus on architecture and safe integration.
```
