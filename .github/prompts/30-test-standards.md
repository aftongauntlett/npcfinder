- Vitest + Testing Library for unit/integration; Playwright for a few high-value E2Es.
- Write tests for: new logic, bug fixes, fragile codepaths, core reducers/hooks, and accessibility-critical flows.
- Mock Supabase client/services; don't hit the network.
- Aim for meaningful assertions, not snapshots by default.

## Running Tests (CRITICAL)

- **ALWAYS use `npm test` (runs once and exits)** - NEVER use `npm run test:watch` or `vitest` directly
- **NEVER use `isBackground: true`** when running test commands in terminal
- Watch mode processes consume significant CPU/memory and can hang indefinitely
- If tests need to run continuously, explicitly ask the user first and provide the terminal ID
- User can kill hanging test processes with: `npm run kill:tests` or `pkill -f vitest`
- Check for hanging processes: `ps aux | grep -E "(vitest|vite|jest)" | grep -v grep`
