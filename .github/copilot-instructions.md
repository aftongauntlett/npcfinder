# Copilot Instructions (NPC Finder)

Read the prompt files in .github/prompts/. Obey them in this order:

1. 00-project-guardrails.md
2. 10-traycer-handoff.md
3. 15-project-context.md
4. 20-coding-standards.md
5. 30-test-standards.md
6. 40-review-checklist.md
7. 90-refactor-triggers.md

If given a Traycer plan: ask clarifying questions first (risks, assumptions), then propose a short plan of edits (files/sections), then implement.

Never use `any` in production code. Prefer precise types, generics, or discriminated unions. If typing is hard, add a TODO and propose a follow-up.

Accessibility and responsiveness are required. Use semantic HTML, proper ARIA only when needed, and ensure keyboard support.

Produce small, focused components. If a component exceeds ~200 lines or clearly mixes responsibilities, propose a split.

Prefer data-driven patterns (maps/arrays/config) over copy-paste. If encountering repetition (≥3 occurrences), propose an extraction.

Tests: add/adjust tests when behavior changes or is new/fragile. Ensure `typecheck`, `lint`, and `test` pass before calling the task complete.

Commits: conventional-style messages, no emojis, small logical units. Prompt the user to commit if work is complete.

When migrations are required: never edit old migrations; create a new one and use the CLI.

When a Traycer plan is provided, follow 10-traycer-handoff.md. If anything is unclear, ask first; otherwise propose a minimal plan, then implement and summarize.

After loading prompts, reference 15-project-context.md for domain rules.
