# Copilot Instructions (NPC Finder)

Model Selection:

- Use GPT-5-Codex for complex coding tasks, refactors, Supabase logic, and multi-file work.
- Use Claude Sonnet 4.5 for brainstorming, UX thinking, content wording, or architectural questions.
- Use Grok Code Fast 1 for small UI components, scaffolds, or low-risk utility code.

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

Reusable Components (CRITICAL):

- ALWAYS check if a reusable component exists before creating a new one
- NEVER use inline `<input>`, `<textarea>`, `<select>`, or `<button>` elements directly
- MANDATORY components from `src/components/shared/ui/`:
  - Button - for ALL buttons (including icon-only with `size="icon"`)
  - Input - for ALL text/email/number inputs
  - Textarea - for ALL text areas
  - Select - for ALL native dropdown selects
  - Dropdown - for custom dropdown menus (non-native)
  - Modal - base for ALL modals
  - ConfirmDialog - for ALL confirmation dialogs
  - Card - for ALL content containers
- NEVER use deprecated components: IconButton, ActionButton, CustomDropdown
- Reference 25-component-library-guide.md for complete component usage rules
- When building forms/modals, always use Input/Textarea/Select components with labels, errors, and helper text
- When building dropdown menus, always use Dropdown or Select, never build custom implementations

Tests: add/adjust tests when behavior changes or is new/fragile. Ensure `typecheck`, `lint`, and `test` pass before calling the task complete.

Commits: conventional-style messages, no emojis, small logical units. Prompt the user to commit if work is complete.

Documentation: Do NOT create new documentation files or markdown summaries unless explicitly requested by the user. Update existing docs only when necessary to reflect code changes.

When migrations are required: never edit old migrations; create a new one using the diff workflow.

Database Operations (CRITICAL):

- This project works DIRECTLY with production database via linked Supabase CLI
- NEVER suggest running `supabase start` or local database
- ALWAYS use npm scripts for database operations:
  - `npm run db:push` - Apply migrations to production
  - `npm run db:migration:list` - List applied migrations
  - `npm run db:diff` - Generate diff of schema changes
  - `npm run db:migration:new <name>` - Create new migration file
  - `npm run db:pull` - Pull current schema from production
- Migration workflow: 1) Make changes in Supabase Dashboard UI, 2) Run `npm run db:diff`, 3) Create new migration with `npm run db:migration:new <name>`, 4) Copy diff SQL into migration file, 5) Apply with `npm run db:push`
- All scripts use VITE_SUPABASE_PROJECT_REF from .env.local

When a Traycer plan is provided, follow 10-traycer-handoff.md. If anything is unclear, ask first; otherwise propose a minimal plan, then implement and summarize.

After loading prompts, reference 15-project-context.md for domain rules.
