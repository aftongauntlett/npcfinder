# Testing Strategy

## Current Setup

Using **Vitest** (designed for Vite projects)

## Running Tests

```bash
npm test              # Run once and exit
npm run test:watch    # Watch mode for development
npm run test:coverage # With coverage report
```

## What to Test

✅ **Do test:**

- User interactions (clicks, form input)
- Rendered output (what users see)
- Error handling
- Edge cases

❌ **Don't test:**

- Implementation details (internal state)
- Third-party libraries
- CSS/styling

## Test Structure

Use AAA pattern (Arrange, Act, Assert):

```typescript
it("should do something", () => {
  // Arrange: Set up test data
  const input = "test";

  // Act: Perform the action
  const result = myFunction(input);

  // Assert: Check the result
  expect(result).toBe("expected");
});
```

## React Component Tests

Use React Testing Library:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";

it("should handle click", () => {
  // Arrange
  render(<MyButton />);
  const button = screen.getByRole("button");

  // Act
  fireEvent.click(button);

  // Assert
  expect(screen.getByText("Clicked!")).toBeInTheDocument();
});
```

## Mocking Supabase

Mock the Supabase client for tests:

```typescript
import { vi } from "vitest";

// Mock Supabase client
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
    },
  },
}));

// In test
import { supabase } from "../lib/supabase";

it("should fetch data", async () => {
  const mockData = { id: "1", name: "Test" };

  (supabase.from as any).mockReturnValue({
    select: vi.fn().mockResolvedValue({ data: mockData, error: null }),
  });

  // Test code that uses supabase
});
```

## Current Coverage

Run `npm run test:coverage` to see:

- Line coverage
- Branch coverage
- Function coverage

Goal: 70%+ coverage for critical paths

## Adding New Tests

1. Create test file next to component: `Button.test.tsx`
2. Import component and testing utilities
3. Write tests using AAA pattern
4. Run tests: `npm run test:watch`
5. Fix any failures
6. Commit tests with code changes

## Performance Note

**Always use `--run` flag in CI/CD:**

```json
"test": "vitest --run"
```

Watch mode (`vitest` without flags) spawns processes that don't exit. Only use for local development with explicit `test:watch` command.

## Examples

See `tests/example.test.ts` and `tests/SimpleButton.test.tsx` for working examples.
