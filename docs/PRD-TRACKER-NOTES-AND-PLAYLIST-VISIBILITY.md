# PRD: Tracker Notes + Completion Date Visibility via Playlists

Last updated: 2026-05-27
Status: Product decisions confirmed (implementation pending)

## Starter Prompt for Agent

Copy/paste this to start implementation from this PRD:

```text
Implement the feature in docs/PRD-TRACKER-NOTES-AND-PLAYLIST-VISIBILITY.md end-to-end.

Context and constraints:
- Tracker remains private and owner-editable for note/completed date.
- Playlist is the only share/public surface.
- Playlist details must show owner note/date as read-only to viewers.
- Use live tracker values when tracker row exists.
- If tracker row is deleted, preserve and show snapshot fallback values.
- Public and private+shared playlist visibility must both be supported.
- Playlist item note should not be primary note source for this flow.

Required deliverables:
1) Database migrations
   - Add snapshot columns on playlist_items:
     - owner_tracker_note_snapshot text null
     - owner_tracker_completed_at_snapshot timestamptz null
   - Add/replace function get_playlist_items_with_owner_context(playlist_id uuid)
     returning media + owner note/date with live-or-snapshot fallback.
   - Update can_view_playlist logic to support both:
     - explicit shares
     - public playlists (is_private = false)
   - Add trigger/function logic to sync snapshot fields from tracker updates.
   - Keep historical playlist entries after tracker deletion.

2) Service layer
   - Update playlistsService getPlaylistItems to use RPC/function return model.
   - Add typed fields owner_tracker_note and owner_tracker_completed_at.
   - Ensure no write path lets non-owner edit owner tracker fields.

3) UI
   - Playlist view supports list/grid parity with tracker style.
   - Clicking playlist item opens details modal.
   - Details modal shows owner note/date (read-only for non-owner).
   - Hide empty owner note/date sections.

4) Tests and validation
   - Add/adjust tests for RLS behavior, public/private visibility, live updates, and snapshot fallback.
   - Confirm tracker deletion does not remove playlist entries.
   - Confirm no TypeScript/lint errors.

Execution instructions:
- Use minimal, focused changes.
- Do not break existing tracker save/edit behavior.
- Explain schema and RLS changes clearly in migration comments.
- If any ambiguity remains, ask concise clarifying questions before coding.
```

## 1. Summary

Users maintain personal notes and completion dates in Tracker items. These fields remain privately owned and editable only by the owner.

When another user views media through the owner's shared/public playlist, they should see the owner's note and completion date for that media in playlist context.

If the viewer opens the same media in their own Tracker, they see only their own note/date.

If the owner later removes that media from Tracker, historical playlist entries should still preserve and display the last known owner note/date snapshot.

## 2. Product Intent

The user-facing model should be:

1. Tracker is private, personal, and per-user.
2. Playlists are the only shareable/public surface for media curation.
3. Notes/completion date are stored on the owner's Tracker item and can be displayed in playlist context for viewers.
4. Future profiles should expose only the user's public playlists (plus profile metadata later).

## 3. Goals

1. Keep `tracker_items.note` and `tracker_items.completed_at` as single source of truth.
2. Auto-set completion date when marking `done`, with manual edit in Tracker details modal.
3. Allow playlist viewers to see owner context (note/date) without exposing full owner tracker history.
4. Preserve strict write permissions: only owner can edit their tracker note/date.
5. Prepare for future profile pages that list only public playlists.
6. Preserve historical owner note/date context for playlist items after tracker deletion.

## 4. Non-Goals

1. Sharing entire tracker history.
2. Allowing users to edit another user's note/date.
3. Final profile feature set (friends, avatar, bio UX beyond playlist listing).
4. Reworking playlist item personal notes unless explicitly decided later.

## 5. Current State (Observed)

1. `tracker_items` already stores `note` and `completed_at`.
2. Tracker auto-sets `completed_at` when status changes to `done` in app service logic.
3. Tracker details modal now supports editing note and completion date.
4. Playlist item sourcing is enforced from owner tracker media (`enforce_playlist_items_from_tracker` trigger on insert/update).
5. RLS currently prevents direct cross-user reads from `tracker_items`.

## 6. Required Behavior

### 6.1 Tracker Behavior

1. Marking an item `done` auto-sets `completed_at` to current date/time if not supplied.
2. In Tracker details modal, owner can edit:
   - personal note
   - completion date (done items)
3. Only owner can write these fields.

### 6.2 Playlist Context Behavior

1. Viewer opening an owner's playlist item can see owner note/date for that media.
2. This owner context is read-only to viewers.
3. Viewer's own Tracker note/date must never be shown in owner's playlist context.
4. Outside playlist context, users only access their own tracker note/date.
5. Owner note/date should be live whenever the owner tracker row exists. If owner edits or clears either field, viewers should see updated values next time playlist data is fetched.
6. If owner tracker row no longer exists (historical playlist entry), playlist should fall back to preserved snapshot values.
7. Playlist viewers should get list/grid presentation parity with Tracker, and clicking an item opens a details modal that shows owner note/date as read-only.

### 6.3 Privacy Boundary

1. Share/public capability remains at playlist level only.
2. Tracker remains private as a standalone surface.
3. Exposed owner fields via playlist context are limited to minimum required fields.
4. Public playlists and private playlists with explicit shares must both be supported.

## 7. Data Ownership Model

1. Source of truth for user-editable media journal data:
   - `tracker_items.note`
   - `tracker_items.completed_at`
2. Playlist surfaces may read owner tracker fields in constrained context.
3. No duplicate writeable owner note/date fields should be introduced on `playlist_items`.
4. `playlist_items.note` should no longer be a source of truth for display note content in this flow; tracker note is canonical.
5. Historical fallback snapshots on `playlist_items` are read-only caches, not user-editable sources.

## 8. Database Design + Migration Instructions

## 8.1 Existing Source Fields

Existing tracker source fields remain correct:

1. `public.tracker_items.note text`
2. `public.tracker_items.completed_at timestamptz`

## 8.2 Add Historical Snapshot Fields on Playlist Items

To preserve owner context after tracker deletion, add snapshot cache columns:

1. `public.playlist_items.owner_tracker_note_snapshot text null`
2. `public.playlist_items.owner_tracker_completed_at_snapshot timestamptz null`

Rules:

1. These fields are system-maintained only.
2. No direct user editing path.
3. They are fallback values when owner tracker row is missing.

## 8.3 Add Controlled Read Path for Playlist Context

Because RLS blocks direct cross-user `tracker_items` reads, add a controlled DB layer that exposes only needed owner fields for playlist-visible media.

Recommended approach:

1. Add `SECURITY DEFINER` SQL function:
   - Example: `public.get_playlist_items_with_owner_context(check_playlist_id uuid)`
2. Function responsibilities:
   - verify caller can view playlist via `public.can_view_playlist(check_playlist_id, auth.uid())`
   - fetch playlist items + media
   - join tracker item owned by playlist owner for each media_id
   - return limited owner context fields with fallback:
     - `owner_tracker_note`
     - `owner_tracker_completed_at`
3. Do not return unrelated owner tracker fields.

Suggested return fields (minimum):

1. playlist item: `id, playlist_id, media_id, position, created_at`
2. media payload needed by UI
3. owner context: `owner_tracker_note, owner_tracker_completed_at`

Implementation note:

1. Join to owner tracker row as a `LEFT JOIN` so historical playlist items can remain visible even if owner later removes media from tracker.
2. Return logic should be:
   - `owner_tracker_note = COALESCE(tracker_items.note, playlist_items.owner_tracker_note_snapshot)`
   - `owner_tracker_completed_at = COALESCE(tracker_items.completed_at, playlist_items.owner_tracker_completed_at_snapshot)`

## 8.4 Historical Retention Rule (Confirmed)

Current trigger enforces owner-tracker membership only on `INSERT/UPDATE` of playlist items.

Confirmed behavior:

1. If media is removed from tracker, related playlist items are allowed to remain as historical entries.
2. Removing playlist items must not affect tracker items.
3. Do not add tracker-delete guards or cascades that remove historical playlist entries.

Additional note:

1. Existing insert/update trigger (`enforce_playlist_items_from_tracker`) still enforces that newly added/updated playlist items originate from owner tracker entries.
2. Historical retention after tracker deletion is achieved by leaving delete-time enforcement off.
3. Add DB sync logic so snapshot fields stay current while tracker row exists.

Recommended sync logic:

1. On playlist item insert:
   - initialize snapshot columns from owner tracker note/completed_at for that media.
2. On tracker item note/completed_at update:
   - propagate latest values into matching owner playlist item snapshot columns.
3. On tracker item delete:
   - do nothing to playlist items (snapshots already contain last known values).

## 8.5 Migration File Plan

Create a new migration, for example:

1. `supabase/migrations/20260527xxxxxx_playlist_owner_context_function.sql`
2. `supabase/migrations/20260527xxxxxx_playlist_owner_context_snapshots.sql`

Contents should include:

1. create/replace function `get_playlist_items_with_owner_context`
2. grant execute to authenticated
3. update `public.can_view_playlist` to support both:
   - explicit share access
   - public playlist access (using `playlists.is_private = false` as public)
4. add snapshot columns to `playlist_items`
5. add trigger/function to keep snapshot columns synced from owner tracker updates
6. comments documenting privacy boundary
7. tests/verification SQL snippets in migration comments

## 9. Service Layer Changes

Update playlist read path in `playlistsService`:

1. `getPlaylistItems(playlistId)` should call RPC/function instead of direct `playlist_items` select for view surfaces that need owner context.
2. Extend TS type for playlist item view model:
   - `owner_tracker_note: string | null`
   - `owner_tracker_completed_at: string | null`
3. Treat `playlist_items.note` as deprecated in UI read-path for this feature (do not display as primary note source).
4. Keep write methods unchanged for tracker fields:
   - tracker updates remain in tracker service only.
5. Ensure API response always includes owner context values via live-or-snapshot fallback.

## 10. UI Requirements

### 10.1 Tracker Details Modal

1. Date picker in More Details for done items.
2. Save should persist note/date together.
3. Date remains auto-set on mark-done but editable later.

### 10.2 Playlist Item UI

1. Playlist media should support both list and grid view, matching tracker-style behavior.
2. Clicking playlist item opens details modal.
3. Show owner note/date only in playlist context details.
4. Label clearly, for example:
   - "Owner note"
   - "Completed on"
5. Hide sections when values are null/empty.
6. Owner note/date fields are read-only for non-owners.

### 10.3 Personal Tracker UI

1. Always show current user's own note/date only.
2. Never blend owner context into personal tracker screens.

## 11. Security + RLS Requirements

1. No direct cross-user read access to `tracker_items` table via generic queries.
2. Cross-user owner note/date exposure must be constrained to playlist visibility checks.
3. Writes to tracker note/date remain owner-only (`tracker_items_update` policy).
4. Function should return no PII beyond playlist/media fields already visible in playlist context.
5. Public playlist visibility must still not imply tracker-table browsing rights.

## 12. Acceptance Criteria

1. Marking item done auto-populates completion date.
2. User can edit completion date and note in Tracker details modal.
3. Edited date/note persist and reload correctly.
4. Shared/public playlist viewer sees owner's note/date for playlist media.
5. Viewer opening same media in own tracker sees only own note/date.
6. Viewer cannot edit owner's note/date anywhere.
7. Direct cross-user tracker query remains denied by RLS.
8. Public playlists are viewable without explicit share (authenticated users), while private playlists remain share-gated.
9. Removing media from tracker does not remove existing playlist entries.
10. After tracker deletion, playlist details still show last preserved owner note/date snapshot.

## 13. Testing Plan

1. Unit tests:
   - date conversion helpers
   - tracker update payload merging note/date
2. Integration tests:
   - mark done sets date
   - edit note/date in modal saves both fields
3. RLS/DB tests:
   - unauthorized direct tracker read blocked
   - authorized playlist context RPC returns owner note/date with live-or-snapshot behavior
   - private playlist denied without share
   - public playlist allowed without share (authenticated)
4. Regression tests:
   - playlist add-from-tracker constraints still enforced
   - tracker deletions do not delete historical playlist items
   - tracker deletion preserves owner note/date display via snapshot fallback
   - tracker sort/filter by completed date still works

## 14. Rollout Plan

1. Phase 1 (already started): tracker modal date edit + save behavior.
2. Phase 2: DB function + playlist service/view model changes.
3. Phase 3: snapshot sync triggers + playlist UI list/grid parity + details modal owner-note/date display.
4. Phase 4: profiles MVP exposing only public playlists.

## 15. Confirmed Product Decisions

1. Playlist viewer sees owner note/date in playlist context only.
2. Owner note/date updates are live and should reflect latest tracker values.
3. Tracker note is canonical; playlist item note is not the primary note source for this flow.
4. Support both public playlists and private playlists with explicit sharing.
5. Historical playlist entries may remain even after owner removes media from tracker.
6. When tracker row no longer exists, playlist should display preserved owner note/date snapshot.
