# PRD: Groups and Networks (Discord-Style Friend Groups)

Date: 2026-03-14  
Status: Draft (Execution Ready)

## 1) Problem

Today, sharing is mostly 1:1 and list/member based. Users need a way to organize friends into separate circles (family, gaming, film club, etc.) and share within those circles.

## 2) Goal

Allow users to create multiple private groups, invite friends into each group, and use groups as sharing audiences across app features.

## 3) Is This Feasible?

Yes. This fits the existing trust model and can be implemented incrementally with Supabase + RLS.

## 4) MVP Scope

- Create group
- Invite existing connections to group
- Accept/decline invitation
- Group roles: `owner`, `admin`, `member`
- View list of groups user belongs to
- Use group as target audience for collection sharing (phase 1.5 if needed)

## 5) Non-Goals (MVP)

- Real-time group chat
- Threads/channels/forums
- Public group discovery
- Cross-group federation

## 6) Data Model

Tables:

- `groups`
  - `id`, `name`, `description`, `created_by`, `is_archived`, timestamps
- `group_members`
  - `id`, `group_id`, `user_id`, `role`, `joined_at`
  - unique `(group_id, user_id)`
- `group_invites`
  - `id`, `group_id`, `inviter_id`, `invitee_id`, `status`, `expires_at`, timestamps
  - unique active invite per `(group_id, invitee_id)`

Optional bridge table (phase 1.5):

- `media_list_group_access`
  - allows group-based viewer/editor permission grants

## 7) Permission Model

- Owner/admin can invite/remove members
- Members can view group roster
- Invitee can accept or decline pending invite
- Group membership should be limited to existing `connections` for MVP trust safety

## 8) UX

- New route: `/app/groups`
- Views:
  - My Groups list
  - Group detail (members, pending invites)
  - Create Group modal
  - Invite Friends modal

## 9) Acceptance Criteria

- User can create multiple groups
- User can invite connected friends to a group
- Invitee can accept/decline
- Group roles enforce admin actions
- RLS prevents unauthorized access to group data

## 10) Risks

- RLS complexity and policy drift
- Edge cases on role transfer/owner departure
- Future migration complexity if channels/chat are added later

## 11) Copilot Execution Prompt

```text
Implement docs/prds/GROUPS-NETWORKS-PRD.md MVP.
Requirements:
- Add migrations + strict RLS for groups, group_members, group_invites
- Enforce connection-based invite rules for MVP
- Build /app/groups page with create, invite, and membership management
- Keep implementation consistent with existing services/hooks/query patterns
- Add tests for membership permissions and invite flow
Deliver concise implementation notes and any deferred items.
```
