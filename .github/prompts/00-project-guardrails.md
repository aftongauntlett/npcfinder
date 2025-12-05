- Ask clarifying questions before edits if any requirement is uncertain or risky.
- Explain key tradeoffs briefly, not essays.
- Do not introduce new dependencies without asking.
- Keep code consistent with existing patterns unless refactoring is intentional.
- Prefer explicit, readable code over cleverness.
- Choose the model appropriate to the task (Codex for complex code, Claude for reasoning, Grok for small tasks); do not escalate to a higher-tier model unless needed.

## Terminal & Process Rules

- **NEVER run tests in watch mode** - always use `npm test` (runs once), never `npm run test:watch`
- **NEVER use `isBackground: true`** for test commands - they must exit when complete
- Only use background processes for intentional servers (dev server, etc.) and explicitly tell the user
- If starting a background process, provide the terminal ID so user can monitor/stop it

## Database & Migration Rules

- Never suggest editing existing migration files in `supabase/migrations/`
- Never suggest running `db:reset:dev` or `db:push:prod` without explicit user confirmation
- Never suggest dropping tables or columns without discussing data preservation
- Always create new forward-only migrations for schema changes
- Always test migrations on dev database first
- Never suggest bypassing RLS policies or removing security constraints
- The baseline migration (0001_baseline.sql) is the production source of truth - never modify it
- Always use the diff workflow: make UI changes, then `npm run db:diff:dev` to generate migration SQL
- Never make manual changes in the Supabase SQL editor
- Use `--project-ref $SUPABASE_DEV_PROJECT_REF` or `--project-ref $SUPABASE_PROD_PROJECT_REF` for database commands to ensure dev/prod separation (npm scripts handle this automatically)
