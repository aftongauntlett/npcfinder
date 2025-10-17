# Services Layer

The services layer separates business logic from React components, making the codebase more maintainable and testable.

## Purpose

Services handle:

- Data fetching and transformations
- Business logic
- API interactions
- Mock/real data switching

Components should focus on:

- UI rendering
- User interactions
- Local state management

## Files

### `config.ts`

Configuration for toggling between mock and real data:

```typescript
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === "true";
export const IS_DEV = import.meta.env.DEV;
```

Set `VITE_USE_MOCK=true` in `.env.local` for development with mock data.

### `recommendationsService.ts`

Handles all recommendation-related operations:

**Key Functions:**

- `getRecommendations(filters)` - Query recommendations with filters
- `getRecommendationsFromFriend(friendId, mediaType)` - Get recs from specific friend
- `getFriendsWithRecommendations(mediaType)` - Get friends who sent recs
- `getQuickStats(mediaType)` - Get hits/misses/queue counts
- `updateRecommendationStatus(id, status)` - Mark as hit/miss/consumed

**Usage Example:**

```typescript
import * as recommendationsService from "@/services/recommendationsService";

// In a React component
const friends = await recommendationsService.getFriendsWithRecommendations(
  "song"
);
const stats = await recommendationsService.getQuickStats("song");
```

**With TanStack Query:**

```typescript
const { data: friends } = useQuery({
  queryKey: ["friends", "music"],
  queryFn: () => recommendationsService.getFriendsWithRecommendations("song"),
});
```

## Mock vs Real Data

**Mock Data:**

- Uses `src/data/mockData.ts`
- No database required
- Fast development
- Useful for testing

**Real Data:**

- Uses Supabase client
- Requires database setup
- Production-ready

**Toggle:**

```bash
# In .env.local
VITE_USE_MOCK=true  # Use mock data
VITE_USE_MOCK=false # Use Supabase
```

## Adding a New Service

1. Create service file in `src/services/`
2. Define interfaces for data structures
3. Implement functions for operations
4. Export functions (not classes)
5. Use in components via custom hooks or directly

**Example:**

```typescript
// src/services/userService.ts
export interface User {
  id: string;
  name: string;
}

export async function getUser(id: string): Promise<User> {
  // Implementation
}

export async function updateUser(
  id: string,
  data: Partial<User>
): Promise<void> {
  // Implementation
}
```

## Best Practices

**Do:**

- Keep services simple and focused
- Return plain objects, not class instances
- Handle errors gracefully
- Use TypeScript interfaces
- Make functions async for consistency

**Don't:**

- Import React in services
- Use React hooks in services
- Manage UI state in services
- Create tight coupling between services

## Testing Services

Services are easy to test because they're pure functions:

```typescript
import { describe, it, expect } from "vitest";
import * as recommendationsService from "./recommendationsService";

describe("recommendationsService", () => {
  it("filters recommendations by status", async () => {
    const recs = await recommendationsService.getRecommendations({
      status: "hit",
    });

    expect(recs.every((r) => r.status === "hit")).toBe(true);
  });
});
```

## Architecture Benefits

**Separation of Concerns:**

- UI components focus on rendering
- Services focus on data and logic
- Easy to refactor either independently

**Testability:**

- Services can be tested without React
- Mock services easily in component tests
- Integration tests can use real services

**Flexibility:**

- Swap implementations (mock vs real)
- Add caching layers
- Change data sources without touching UI

## Integration with Components

**Direct Usage:**

```typescript
function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    recommendationsService.getQuickStats("song").then(setData);
  }, []);

  return <div>{data?.hits}</div>;
}
```

**With TanStack Query (Recommended):**

```typescript
function MyComponent() {
  const { data } = useQuery({
    queryKey: ["stats", "music"],
    queryFn: () => recommendationsService.getQuickStats("song"),
  });

  return <div>{data?.hits}</div>;
}
```

**With Custom Hook:**

```typescript
// src/hooks/useMusicStats.ts
export function useMusicStats() {
  return useQuery({
    queryKey: ["stats", "music"],
    queryFn: () => recommendationsService.getQuickStats("song"),
  });
}

// In component
function MyComponent() {
  const { data } = useMusicStats();
  return <div>{data?.hits}</div>;
}
```
