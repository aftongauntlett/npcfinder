# Performance Audit

## Issue

MacBook Air became extremely slow - multiple vitest processes consuming 1.4-1.6GB each.

## Root Cause

**Vitest watch mode spawning multiple processes**

- `"test": "vitest"` ran in watch mode by default
- Each test run spawned a new watcher that never exited
- 6-7 simultaneous processes = ~10GB RAM on 8GB machine

## Fix

```json
{
  "scripts": {
    "test": "vitest --run",        // Exits after completion
    "test:watch": "vitest",        // Separate watch command
    "test:coverage": "vitest --coverage --run"
  }
}
```

## Code Audit Results

✅ **All clean - no memory leaks found:**

- Event listeners properly cleaned up
- React Query config is optimal
- No infinite loops
- No leaked intervals/timeouts
- Media queries properly removed

## Monitoring Performance

```bash
# Check current test memory usage
npm test

# Should complete in <1 second
# Should use <200MB RAM
# Should exit cleanly
```

## VS Code Settings

Added file watcher exclusions to reduce overhead:

```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/coverage/**": true,
    "**/.git/**": true
  }
}
```

## Recommendations

1. Always use `--run` flag in CI/CD
2. Only use watch mode for active development
3. Kill zombie processes if laptop slows down: `pkill -f vitest`
4. Monitor Activity Monitor for runaway processes

## Current Status

✅ Tests run fast (<1s)
✅ Memory usage normal (<200MB)
✅ No zombie processes
✅ System performance restored
