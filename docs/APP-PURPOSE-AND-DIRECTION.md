# App Purpose and Direction

Date: 2026-03-14

## Current Product Reality

NPC Finder is currently a private, invite-only social utility for trusted friends, with two strong but different pillars:

1. **Media Collections** (movies/TV, books, music, games in mixed collections)
2. **Tasks Workbench** (task inbox + kanban + recipes + job tracker)

The app already supports identity, trust boundaries, sharing, and role-based admin controls. The core challenge is not whether the app works—it does. The challenge is **narrative clarity** and **product focus**.

## What The App Does Well Today

### 1) Trust-first social architecture

- Invite-only onboarding with admin oversight
- Supabase Auth + database-enforced RLS policies
- Explicit sharing primitives (friends/connections, membership roles)

This is a strong foundation for a “small trusted circle” product.

### 2) Mature technical foundation

- Clear route and layout structure for authenticated users
- TanStack Query data flows and cache invalidation patterns
- Strong migration and role-system documentation
- Existing automated tests and CI workflow

This gives you room to refine product direction without rebuilding infrastructure.

### 3) Practical utility in both domains

- **Media**: already moved toward collections-first with mixed-media add flow and collection sharing
- **Tasks**: robust template views (kanban, recipes, job applications) with search/filter/sort and singleton board support

Both pillars are useful; they simply target different user mindsets.

## Areas To Improve

### 1) Product story is split

Top-level navigation currently gives equal weight to `Tasks` and `Media`, but user motivation differs:

- Media feels social + curation + archival
- Tasks feels personal operations/productivity

Without a unifying narrative, the app can feel “feature-rich but identity-light.”

### 2) Naming and positioning drift

The codebase includes historical naming (`media lists` vs `collections`, legacy domains), while UI and docs increasingly describe collections-first behavior. This is normal after pivots, but it increases cognitive load for future contributors.

### 3) Shared social loop is under-leveraged

You already have sharing + trusted access, but there is no single “core loop” that consistently drives return usage across both pillars.

### 4) Landing-to-product continuity

The long-term profile/social vision (nostalgic custom profiles, MySpace-style expression) is compelling, but it is still conceptually separated from the current in-app daily workflows.

## Strategic Options

## Option A: Keep Both (Dual-Pillar App)

Positioning:

> “A private home base for your trusted circle: collect what you love and organize what you do.”

Pros:

- Preserves investment in Tasks
- Broad utility for daily use
- Better retention opportunities (multiple reasons to return)

Risks:

- Ongoing product complexity
- Harder messaging and onboarding
- Competes with specialized task tools and specialized media tools at once

Best if:

- You want a personal “digital home” product, not a single-use utility.

## Option B: Media-First (Recommended)

Positioning:

> “A private media clubhouse for close friends: archive, curate, and share what you watch, read, play, and listen to.”

Tasks become a secondary utility (or hidden beta module), not equal brand surface.

Pros:

- Clearer market identity
- Strong alignment with invite-only social model
- Better fit for future profile-expression features and nostalgic customization
- Easier to integrate media-server patterns (Jellyfin/Plex-like archival mindset)

Risks:

- Requires intentional de-emphasis of mature Tasks UX
- Some current power-user utility becomes less visible

Best if:

- Your primary motivation is social curation + media identity + close-friends engagement.

## Option C: Split Into Two Apps

Positioning:

- Product 1: media social archive
- Product 2: private task/workbench

Pros:

- Maximum clarity per product

Risks:

- Highest maintenance cost
- Fragmented community and deployment complexity

Best if:

- You explicitly want two independent products long-term.

## Recommended Direction (90-Day)

Recommend **Option B: Media-First with Tasks preserved behind a “Labs” posture**.

### Phase 1 (Weeks 1-3): Clarify purpose

- Update top-level copy across README + landing + app descriptions to media-first language
- Keep `Tasks` functional, but relabel as `Labs` or `Personal Tools`
- Define a one-sentence product promise and repeat it consistently

### Phase 2 (Weeks 4-8): Deepen media loop

- Tighten media collection workflows (create, add, share, revisit)
- Introduce “activity around collections” (light social signals)
- Ensure collection pages are the strongest UX in the app

### Phase 3 (Weeks 9-12): Connect identity

- Start profile customization MVP (nostalgia-inspired but scoped)
- Use profile expression to support media identity first (favorites, featured collection, theme)
- Delay heavy custom HTML/CSS profile complexity until moderation and safety patterns are clear

## Decision Rule (Use This)

When deciding roadmap items, prefer features that satisfy all 3:

1. Strengthens trusted-circle social interaction
2. Reinforces media curation/archival identity
3. Reuses existing RLS and sharing primitives with minimal complexity

If a feature fails 2 out of 3, it likely belongs in Labs/backlog.

## Immediate Documentation Actions Completed

- Added a repo-specific Copilot/agent guide: `docs/COPILOT-AGENTS-GUIDE.md`
- Added Traycer review prompts for deeper audits: `docs/TRAYCER-PROMPTS.md`
