# Copilot + Agent Guide

This guide defines how coding agents (Copilot Chat, external review agents, and scripted assistants) should operate safely and effectively in this repository.

## 1) Project Mission (for agents)

NPC Finder is a private, invite-only web app for trusted friends.

Current product pillars:

- **Media Collections**: mixed-media collections, sharing, and discovery workflows
- **Tasks Workbench**: inbox + kanban + recipe + job tracker workflows

Agents should prioritize work that improves product clarity, trust/safety, and user-facing reliability.

## 2) Required Setup Context

Before making changes, agents should assume:

- Stack: React + TypeScript + Vite + Tailwind + TanStack Query + Supabase
- Auth and data access are enforced by Supabase + RLS
- Migrations are authoritative for schema changes
- This repo uses invite-only / trusted-circle assumptions

Quick commands:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
```

## 3) Database Safety Rules (Critical)

From `package.json`, `db:*` commands target linked production Supabase projects.

Agent rules:

1. Never run destructive DB commands automatically.
2. Never assume local ephemeral DB unless explicitly configured.
3. Prefer migration files + review over direct destructive SQL.
4. Call out blast radius for schema changes.
5. If you create a migration file, run that migration before committing and report the execution result.

## 4) Codebase Navigation Hints

High-value entry points:

- App shell/routes: `src/App.tsx`, `src/components/layouts/AuthenticatedAppLayout.tsx`
- Main navigation: `src/components/shared/layout/Sidebar.tsx`
- Media collections: `src/components/pages/media/*`, `src/services/mediaListsService.ts`, `src/hooks/useMediaListsQueries.ts`
- Tasks system: `src/components/pages/tasks/*`, `src/components/tasks/*`, `src/hooks/useTasksQueries.ts`
- Auth/admin/roles: `src/contexts/AuthContext.tsx`, `src/contexts/AdminContext.tsx`, `docs/ROLE-SYSTEM.md`
- Setup docs: `docs/QUICK-START.md`, `docs/DATABASE-MIGRATIONS.md`, `docs/API-SETUP.md`

## 5) Preferred Agent Workflow

For non-trivial tasks:

1. **Read first**: inspect route + data hook + service + related tests
2. **Summarize intent**: state what user-visible behavior will change
3. **Edit minimally**: preserve existing APIs and style unless refactor is requested
4. **Validate locally**:
   - `npm run lint`
   - `npm run typecheck`
   - targeted tests (then broader tests only if needed)
5. **Report clearly**: what changed, risks, and next checks

## 6) Guardrails for Product Consistency

Agents should default to these heuristics:

- Prefer collections-first media experiences over re-introducing domain fragmentation
- Avoid adding parallel patterns when an existing shared component/hook exists
- Respect invite-only and trusted-friend assumptions for social features
- Keep role and permission enforcement at both frontend and DB policy levels
- Do not add user-generated HTML/script execution paths in profile customization work

## 7) Definition of Done for Agent PRs

A change is complete when:

1. Behavior is implemented and aligned with existing UX patterns
2. Types and lint pass for touched files
3. Relevant tests pass (or tests are added for new critical behavior)
4. Documentation is updated if behavior or setup changed
5. No unrelated refactors are bundled

## 8) Common Task Prompts (Copy/Paste)

### A) Implement a feature safely

```text
Act as a senior maintainer for npc-finder.
Goal: implement [FEATURE] in the existing architecture.
Constraints:
- Use existing hooks/services/components where possible
- Preserve invite-only trust model and role permissions
- Keep diff minimal and focused
- Run lint + typecheck + targeted tests
Output:
1) concise change summary
2) files changed
3) verification results
4) follow-up risks
```

### B) Refactor without behavior drift

```text
Refactor [MODULE] for readability and maintainability without changing user-visible behavior.
Requirements:
- No API contract changes unless explicitly listed
- Keep existing tests passing
- Add/adjust tests only where coverage is missing for touched logic
Provide a brief before/after architecture note.
```

### C) Investigate bug with root-cause bias

```text
Investigate and fix [BUG].
Process:
1) identify reproducible path
2) locate root cause in hook/service/component chain
3) apply minimal fix at source
4) add regression test if test pattern exists nearby
Return: root cause, fix, and validation steps.
```

## 9) When To Use Traycer

Use Traycer for:

- broad architecture consistency audits
- security policy drift checks (RLS/auth/admin)
- dead-code and duplication discovery
- roadmap-level product coherence review

Prompt pack is available in `docs/TRAYCER-PROMPTS.md`.
