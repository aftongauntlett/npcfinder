# API Setup

## TMDB (Movies & TV)

**Free tier: 3,000 requests/day**

### Setup

1. Create account: https://www.themoviedb.org/signup
2. Go to Settings > API
3. Request API key (choose "Developer")
4. Add to `.env.local`:
```bash
VITE_TMDB_API_KEY=your-key-here
```

### Usage

- Search movies/TV shows
- Get metadata (posters, descriptions, ratings)
- No authentication required for search

### Limits

- 3,000 requests per day
- 40 requests per 10 seconds
- Free forever

### If You Hit Limits

App will show error message. Users can try again later or search less frequently.

## iTunes Search API

**Free, no API key needed**

### Setup

None! It's public and free.

### Usage

- Search songs and albums
- Get previews and artwork
- No rate limits published

### Limits

- No known hard limits
- Be respectful (don't spam)
- Built-in debouncing in app

## Rate Limit Handling

Both APIs have built-in error handling:

```typescript
// TMDB
if (response.status === 429) {
  throw new Error('Rate limit reached. Try again later.');
}

// iTunes
if (response.status === 503) {
  throw new Error('Service temporarily unavailable.');
}
```

## Testing Without APIs

Use mock data:

```bash
# In .env.local
VITE_USE_MOCK=true
```

App works fully without external API calls.

## Optional: Spotify Integration

Not currently implemented, but planned for future.

Would require:
- Spotify Developer account
- OAuth setup
- User authentication per user

See: https://developer.spotify.com/documentation/web-api

## Cost Summary

| API | Cost | Limit |
|-----|------|-------|
| TMDB | Free | 3k/day |
| iTunes | Free | Unlimited* |
| Supabase | Free | 500MB database, 2GB bandwidth |

*No published limits, reasonable use expected
