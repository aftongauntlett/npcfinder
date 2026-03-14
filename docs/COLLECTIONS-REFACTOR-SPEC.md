# Collections-First Media Refactor (Spec)

Date: 2026-01-26

## Summary

Replace the current Media experience (separate domain pages, watch/read/play/listen lists, item-level status, item-level sharing/recommending, sorting/filtering) with a **single Media area** centered on **Collections**.

Collections are **mixed-media** (movies, TV, books, games, music all in the same collection). Users manage their library by creating collections and adding items to them via a **unified Add Item flow** that searches all providers behind the scenes.

Sharing is done by **collection membership + roles** (owner/editor/viewer). Public links are a future enhancement.

Phase 1 delivers the new Media screen and collection detail UI while keeping old domain pages intact (but no longer linked once the new screen is wired).

## Goals

- One unified Media experience:
  - List collections
  - Create collection
  - Open collection detail
  - Add/remove items in a collection
  - Share a collection via membership roles
- Collections can contain mixed media types.
- Unified search: user searches once, results include mixed types with a label.
- Remove item-level status from the new flow (collections replace watched/read/done).
- Keep old domain pages intact during Phase 1; only stop linking to them.

## Non-Goals (Phase 1)

- Deleting old pages/components/DB tables.
- Public share links.
- Item-level recommendations/sharing.
- “History” / “watched/read” toggles.
- Advanced sorting/filtering.
- Full data migration of old per-domain lists into new mixed collections (optional later).

## Current State (Observed)

- Collections exist in the data model already:
  - `media_lists` (collection metadata)
  - `media_list_items` (items)
  - `media_list_members` (sharing/membership)
  - View: `media_lists_with_counts`
- Client code includes a collections-first service layer:
  - `getCollections`, `getCollection`, `createMediaList`, `addMediaItemToCollection`, etc.
- The UI still has domain-specific pages and behaviors (watch list / reading list / etc.) and some item-level actions.

## Target UX (Phase 1)

### Media (Collections) landing

- Route: `/media` (or whichever existing route is used for “Media” entry)
- Shows:
  - List of **all** user-accessible collections (owned + shared + authenticated-public)
    - Includes existing domain-specific collections and new `mixed` collections
  - Button: “New Collection”
  - Optional: quick search box to filter collections by title

### Create collection

- Minimal fields:
  - Title (required)
  - Description (optional)
  - Visibility: private/public

Visibility semantics (Phase 1):

- **Private**: only owner + explicit members can view.
- **Public (authenticated)**: any logged-in user can view read-only.
  - Not anonymous.
  - Not link-based.

### Collection detail

- Shows:
  - Collection title + metadata
  - “Add Item” button
  - Member list + role management (owner/editor/viewer)
  - Items list (mixed types)
- Items list:
  - Each item shows title, subtitle/author/artist (when present), type label, poster/cover (optional)
  - Action: remove from collection
  - Optional: filter chips by media type (movie/tv/book/game/song/album/playlist)

### Add Item modal (unified)

- Single search input.
- Behind the scenes searches multiple providers concurrently.
- Results are merged and displayed as a single list with a **type label**.
- Selecting a result adds it to the currently open collection.

## Data Model & Backend Changes

Collections must be mixed-media.

### `media_lists.media_domain`

Today this appears to be treated as a domain discriminator (movies/books/games/music).

Phase 1 option (recommended): introduce a new domain value `mixed`.

- Update TypeScript `MediaDomain` to include `"mixed"`.
- Update database constraint / enum to allow `mixed`.
- Update any views (e.g., `media_lists_with_counts`) and RLS policies if they filter by domain.

Notes:

- This keeps existing schema shape and minimizes client-side changes.
- Existing domain-specific lists can keep their domain value; new collections created from `/media` use `mixed`.

Additionally:

- `/media` should list all accessible collections regardless of domain.
- Create from `/media` defaults to `media_domain = mixed`.

### `media_list_items.media_type`

Continue using existing `media_type` field to represent the item type.

- This field becomes the primary way to filter inside a mixed collection.

### Membership roles

Use `media_list_members.role` as source of truth.

- Roles:
  - owner
  - editor
  - viewer
- Client enforcement:
  - Owner/editor can add/remove items.
  - Viewer can read.
- Server enforcement should already be via RLS; Phase 1 will validate and adjust if needed.

## Client/API Design

### Services

Continue to use [src/services/mediaListsService.ts](../src/services/mediaListsService.ts) as the backing service.

Needed additions/changes (Phase 1):

- `getCollections()` should support fetching mixed collections without requiring a domain toggle in the UI.
  - Add `getCollectionsForMedia()` that internally requests `media_domain = mixed`.
  - Alternatively, allow `getCollections(mediaDomain)` to accept `mixed`.

- Add `getAllAccessibleCollections()` (name TBD) that fetches all collections the user can access, regardless of domain.
  - This powers `/media`.
- New helper: unified provider search.
  - Introduce `searchAllMedia(query)` that calls existing per-provider searches and normalizes results into the shared `MediaItem` shape.

### Normalized search result shape (Phase 1)

Unified add flow should use a single normalized result type.

Preferred approach: reuse the existing `MediaItem` shape exported from the shared media modal.

Requirements:

- `external_id`: provider ID (canonical per-provider identifier)
- `media_type`: one of the canonical item types we store in `media_list_items.media_type` (`movie`, `tv`, `book`, `game`, `song`, `album`, `playlist`)
- `title`: display title
- `poster_url`: cover/poster when available

Optional enrichment fields (best-effort): `subtitle`, `authors`, `artist`, `album`, `isbn`, `page_count`, `platforms`, `genres`, `release_date`, `description`.

Note on “provider”:

- Phase 1 duplicate prevention should use the canonical identifiers we persist in `media_list_items`.
- If the schema does not store an explicit provider, treat `(media_type, external_id)` as the canonical identity.

### Hooks

Hooks in [src/hooks/useMediaListsQueries.ts](../src/hooks/useMediaListsQueries.ts) will be updated to:

- Use a single query key space for Media collections (mixed).
- Avoid forcing callers to provide a per-domain value.

## UI Implementation (Phase 1)

### New screens/components

- `MediaCollectionsPage` (new): list + create
- `CollectionDetailPage` (new): items + members + add item
- `AddItemToCollectionModal` (new): unified search and add

### Navigation cutover

- Replace “Media” sidebar entry to point to the new collections-first page.
- Keep old pages/routes intact but remove sidebar links to them.

## Acceptance Criteria (Phase 1)

- A signed-in user can:
  - Create a collection in Media.
  - View all collections they can access (owned + shared + authenticated-public).
  - Open a collection and add mixed media items to it via one search box.
  - Remove items from a collection.
  - Share a collection by adding members with roles (and revoke access).
  - View collections shared with them.
- No item-level status (watched/read/done) in the new Media flow.
- Old domain pages still compile and work, but are no longer linked from the primary navigation.

## Duplicate handling (Phase 1)

- Prevent duplicates within a single collection.
- Allow the same item to appear across different collections.
- Define “duplicate” using the canonical identifiers in `media_list_items`.
  - If no explicit provider column exists, use `(list_id, media_type, external_id)`.
- DB: add/confirm a unique constraint or unique index.
- Client: handle conflicts gracefully (toast: “Already in this collection”).

## Rollout Plan

1. Implement DB support for `media_domain = mixed` (migration + update TS types).
2. Implement new Media screens + routes (collections list + detail).
3. Implement unified search modal + add-to-collection.
4. Wire navigation to new Media.
5. Validate end-to-end usage before removing old pages.

## Open Questions / Follow-ups

- Should we auto-create default collections (e.g., Favorites) in mixed mode, or let users create manually?
- How should duplicate items be handled within a collection (prevent duplicates vs allow)?
- Should collection items be de-duplicated across collections (global library) later, or remain purely per-collection?
