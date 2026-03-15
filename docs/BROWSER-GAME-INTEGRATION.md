# Browser Game Integration (Phase 0)

Date: 2026-03-14
Status: Phase 1 Scaffolded

## Current Integration in NPC Finder

- Sidebar navigation includes a **Game** entry
- Dedicated authenticated route: `/app/game`
- Route uses an immersive layout (sidebar hidden while in game)
- Embedded game view via iframe
- Optional **Open in new tab** action for full-focus play
- Client launch flow requests a short-lived launch token before embed/new-tab open
- Supabase Edge Function `game-launch` mints signed launch token

## Game Source + Hosting

Provided links:

- Repo: https://github.com/aftongauntlett/npcfinder-game
- Vercel project: https://vercel.com/afton-gauntletts-projects/npcfinder-game

## Environment Configuration

NPC Finder reads the game URL from:

- `VITE_GAME_APP_URL` (optional)

Fallback if not set:

- `https://npcfinder-game.vercel.app`

Recommended local `.env.local` entry:

```bash
VITE_GAME_APP_URL=https://npcfinder-game.vercel.app
```

If you switch to a custom domain later (example `https://play.npcfinder.com`), update only this value.

## Supabase Edge Function Setup (Phase 1)

Function added:

- `supabase/functions/game-launch/index.ts`

Required Edge Function secrets:

- `GAME_LAUNCH_SIGNING_SECRET` (required, strong random secret)

Optional Edge Function secrets:

- `GAME_APP_URL` (default: `https://npcfinder-game.vercel.app`)
- `GAME_LAUNCH_PATH` (default: `/`)
- `GAME_LAUNCH_TTL_SECONDS` (default: `60`, minimum enforced: `30`)
- `GAME_TOKEN_ISSUER` (default: `npc-finder`)
- `GAME_TOKEN_AUDIENCE` (default: `npcfinder-game`)

Example commands:

```bash
npx supabase secrets set GAME_LAUNCH_SIGNING_SECRET="replace-with-long-random-secret"
npx supabase secrets set GAME_APP_URL="https://npcfinder-game.vercel.app"
npx supabase functions deploy game-launch
```

## Auth Handoff (Next Phase)

Phase 1 scaffold now mints launch tokens and passes them as `launch_token`.

Next implementation step is on the game app side:

1. Read `launch_token` on `/auth/launch`
2. Verify signature, issuer, audience, and expiry
3. Exchange for game session and redirect to main gameplay route

## Minimal Contract Fields (v1)

- `sub` (user id)
- `display_name`
- `avatar_url`
- `iat` / `exp`
- `iss` / `aud`

Keep token lifetime short (ex: 60 seconds) and avoid storing long-lived credentials in the game frontend.

## Remaining Inputs Needed

To complete secure auth handoff, confirm:

- Final production game origin (vercel subdomain or custom domain)
- Keep token transport as query launch token (current scaffold)
- Token verification implementation in game repo
