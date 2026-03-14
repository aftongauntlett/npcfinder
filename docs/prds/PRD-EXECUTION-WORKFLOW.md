# PRD Execution Workflow (Copilot + Traycer)

Use this workflow to turn PRDs into safe, incremental implementation work.

## Step 1: Pick PRD and freeze scope

- Select one PRD from this folder
- Copy MVP scope and non-goals into your task prompt
- Do not mix multiple PRDs in one implementation pass

## Step 2: Run Traycer review first

- Use `docs/TRAYCER-PROMPTS.md` prompt relevant to that PRD
- Ask Traycer for:
  - architecture impact
  - security/RLS risks
  - migration concerns
  - phased rollout plan

## Step 3: Hand off to Copilot in vertical slices

Recommended slice order:

1. DB migration + RLS
2. service layer
3. query hooks
4. UI route/page
5. tests + docs updates

## Step 4: Verification checklist

- `npm run lint`
- `npm run typecheck`
- targeted tests for touched domain
- manual permission checks for any auth-sensitive feature

## Step 5: PR template for feature slices

Include:

- scope in/out
- migration summary
- permission model notes
- rollout/backout plan
- follow-up tickets

## Copilot Prompt Template

```text
Implement one vertical slice for [PRD FILE].

Current slice: [DB | services | hooks | UI | tests]
Must follow:
- existing architecture patterns in npc-finder
- invite-only trust model and role constraints
- minimal diff, no unrelated refactors

Return:
1) files changed
2) behavior changes
3) validation run output summary
4) deferred items for next slice
```
