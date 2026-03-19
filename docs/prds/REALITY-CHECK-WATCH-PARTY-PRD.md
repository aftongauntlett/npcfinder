# PRD: Reality Check - In-Game Watch Parties

Date: 2026-03-18  
Status: Active Planning

## 1) Purpose

Capture the honest, buildable path for the long-term "Discord + MySpace + Stardew" vision so future work stays grounded in technical and legal reality.

## 2) Vision (Long-Term)

- Player joins and gets a personal home
- Home is visible on the map to everyone
- Home entry is friends-only
- Players can walk around homes with open proximity voice
- Optional seated mode: focus watch party with synchronized playback controls

## 3) Doable vs Not (Real Talk)

### ✅ Doable with current web stack

- Friends-only home access rules via Supabase + RLS
- Presence state: `walking` vs `seated`
- Proximity/chat channel for walking users
- Shared transport controls for seated users (`play/pause/seek` events)
- Dual rendering modes:
  - seated users see fullscreen player
  - walking users see in-world TV surface only

### ⚠️ Doable but high complexity

- Low-latency sync across browsers/devices
- Cross-tab/device reconnection and drift correction
- Reliable moderation controls for shared spaces
- Voice isolation rules (seated muted from roamers and vice versa)

### ❌ Not realistically safe without licensing/legal framework

- Streaming commercial movies/TV to groups from content your app does not have distribution rights for
- Re-broadcasting protected streams through your infrastructure
- Positioning this as a free public streaming platform for copyrighted catalogs

## 4) Legal-Safe Product Positioning

MVP should be framed as:

- Private social spaces
- Optional synchronized playback controls
- User-provided/self-hosted media sources only (for example personal Jellyfin/Plex libraries)
- No promise of platform-hosted commercial catalog playback

## 5) Recommended Implementation Phases

### Phase A - Homes + Social Presence (Build Now)

- Home ownership model and friend-gated entry
- Presence/movement state + room membership
- Voice channel split for walking users only

### Phase B - Seated Watch Mode (Build Next)

- Seat interactions (`sit`, `leave seat`)
- Shared playback state service (leaderless consensus or owner control)
- Mute partition:
  - seated users hear media only
  - walking users hear room voice only

### Phase C - Media Connectors (Careful)

- Bring-your-own-media connector contract
- Signed short-lived session tokens for connector launch
- Per-home permissions for "who can start playback"

### Phase D - Compliance Hardening (Required before scale)

- Terms clarifying user responsibility for media rights
- Abuse report flow and playback/session audit trail (minimal metadata)
- Jurisdiction-aware policy review before broad rollout

## 6) MVP Non-Goals

- Hosting or re-streaming licensed commercial catalogs
- Global town with hundreds of concurrent users per shard
- Fully custom user HTML/CSS profile rendering in first release

## 7) Engineering Constraints to Remember

- Browser autoplay and media device permissions are inconsistent
- WebRTC and media sync quality vary by network/device
- End-to-end encryption for group media sync + account recovery is a tradeoff space, not a free win
- "No ads/no data sale" is realistic; "store zero metadata" is not realistic if you need abuse/security operations

## 8) Success Criteria (Reality-Based)

- Friends can enter a friend home reliably
- Users can switch between walking and seated states
- Seated users stay within acceptable sync drift target (define and measure)
- Playback control permissions are enforced server-side
- Scope and legal boundaries are explicit in product copy and docs

## 9) Open Questions Needing Expert Input

- What licensing path (if any) is viable for commercial content in synchronized social playback?
- Which jurisdictions introduce the highest risk first?
- What minimum retention logs are needed for safety without violating privacy goals?

## 10) Copilot Execution Prompt

```text
Implement Phase A of docs/prds/REALITY-CHECK-WATCH-PARTY-PRD.md.

Scope:
- Home visibility + friends-only entry checks
- Presence state model (walking/seated placeholder)
- No media streaming implementation yet

Constraints:
- Supabase migrations + strict RLS
- Reuse existing route/layout/service/query patterns
- Minimal diff, no unrelated refactors

Return:
1) files changed
2) permission model details
3) tests added
4) deferred items for Phase B
```
