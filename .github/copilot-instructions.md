# GitHub Copilot Instructions for NPC Finder Project

## Workflow Context

- User employs **Traycer.AI** for spec-driven development and planning
- Traycer generates detailed artifacts/specs before code generation
- When user provides structured prompts (especially numbered comments), they often come from Traycer's planning phase
- Focus on **execution** when given detailed specs - the high-level planning is already done
- Traycer provides codebase context and governance; Copilot executes the implementation

## Communication Style

- Never use emojis in responses
- Keep responses concise and technical
- Only create documentation files when explicitly requested

## Database & Migration Workflow

### Migration Rules (CRITICAL - NEVER VIOLATE)

1. **NEVER edit existing migration files after they've been created**
2. **NEVER delete migration files from the codebase**
3. **ALWAYS create new migrations to fix issues** (forward-only)
4. **Migration workflow:**
   ```bash
   supabase migration new descriptive_name
   # Edit the generated file
   supabase db push
   ```

### Migration Naming Convention

- Format: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Use clear, descriptive names (e.g., `add_composite_indexes`, not `fix_db`)
- Sequential numbering for same-day migrations (000000, 000001, 000002...)

### Database Source of Truth

- Production Supabase database = ultimate source of truth
- Migration files = reproducible history
- Always use `supabase db push` (never manual SQL editor)
- Project is already linked: `npc-finder` (hugcstixszgqcrqmqoss)

### Database Schema Snapshots

**For SQL snapshots (e.g., for Traycer review), use:**

```bash
supabase db dump --schema public > database_schema_snapshot_$(date +%Y%m%d).sql
```

**NEVER use `supabase db pull` for snapshots:**

- `db pull` creates a shadow database and replays ALL migrations
- Can fail on migration dependency issues (even if production is fine)
- Doesn't touch production, but causes confusion and unnecessary errors
- Use `db dump` instead - it directly exports from live database

### When Adding Indexes

- Always use `CREATE INDEX IF NOT EXISTS`
- Use composite indexes for common filter combinations
- Include ORDER BY column as last column (with DESC if needed)
- Add comment explaining the query pattern being optimized

## Documentation Standards

### Where to Put Documentation

- Project docs go in `/docs/` directory
- Number documentation files sequentially (00-, 01-, 02-, etc.)
- Use clear, descriptive filenames with hyphens (KEBAB-CASE-STYLE.md)

### Documentation Updates

- Update existing docs when implementation changes
- Keep README.md and QUICK-START guides current with actual behavior
- Document "why" not just "what"

## Code Standards

### Testing

- Tests go in `/tests/` directory
- Use Vitest for all tests
- Mock Supabase client using `vi.mock()`
- Test files: `*.test.ts` or `*.test.tsx`
- ESLint relaxed for test files (allow `any` types)

### TypeScript

- Strict typing in production code
- Pragmatic typing in tests (mocks can use `any`)
- Never suppress errors without understanding why

## Project-Specific Knowledge

### Authentication Flow

- Invite-only system (no public signup)
- Email validation required for invites
- 30-day expiration on invite codes
- `validateInviteCode()` (anon) → `signUp()` → `consumeInviteCode()` (authenticated)

### Auto-Connect

- Currently DISABLED for scalability
- Use `batch_connect_users()` for small groups
- Never re-enable auto-connect trigger without discussion

### Theme System

- Uses hex color picker with format: hash-RRGGBB
- Not preset color names
- Stored in user_profiles.theme_color

## Common Mistakes to Avoid

- Don't create summary markdown files after every change (only when we commit changes)
- Don't use emojis in technical responses or commit messages.
- Don't suggest editing old migrations (always create new ones)
- Don't run migrations manually in Supabase dashboard (use CLI)
- Don't assume Docker is running locally (it's slow on this machine)

## When Asked to "Implement Comments"

- Follow instructions verbatim
- Don't add extra features not requested
- Test your changes
- Update relevant documentation if implementation differs from docs

## File References

- Always use absolute paths: `/Users/test/Developer/repos/npc-finder/...`
- Check files exist before suggesting edits
- Read enough context before making changes (3-5 lines before/after)
