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

### Limits

- 3,000 requests per day
- 40 requests per 10 seconds
- Free forever

## iTunes Search API (Music)

**Free, no API key needed**

### Setup

None required. Public API.

### Usage

- Search songs and albums
- Get previews and artwork
- No published rate limits

## Google Books API (Books)

**Free tier with API key required**

### Setup

1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Create a new project or select existing
3. Enable Google Books API
4. Create credentials (API key)
5. Add to `.env.local`:

```bash
VITE_GOOGLE_BOOKS_API_KEY=your-key-here
```

### Usage

- Search books by title, author, ISBN
- Get metadata and covers
- Standard Google API quotas (generous for personal use)

## OMDB API (Movie Ratings & Awards)

**Free tier: 1,000 requests/day**

### Setup

1. Get API key: http://www.omdbapi.com/apikey.aspx
2. Add to `.env.local`:

```bash
VITE_OMDB_API_KEY=your-key-here
```

### Usage

- Enriches TMDB data with Rotten Tomatoes scores
- Metacritic ratings
- Awards information
- Box office data

**Note:** Optional—app works without it but provides richer movie details when configured.

## ⚠️ RAWG API (Games) - PLANNED

**Not Yet Implemented**

Games support is planned but not yet implemented. API key listed in `.env.example` for future use.

### Future Setup

1. Create account: https://rawg.io/apidocs
2. Get API key
3. Add to `.env.local`:

```bash
VITE_RAWG_API_KEY=your-key-here
```

### Limits

- 20,000 requests per month (free tier)
- Approximately 667 requests per day

## Rate Limit Handling

All APIs have built-in error handling in the app. If you hit limits, the app will display an error message and users can try again later.

## Cost Summary

| API          | Cost | Limit                  |
| ------------ | ---- | ---------------------- |
| TMDB         | Free | 3,000/day              |
| iTunes       | Free | Unlimited\*            |
| Google Books | Free | Standard API quotas    |
| OMDB         | Free | 1,000/day              |
| RAWG         | Free | Planned (20,000/month) |

\*No published limits, reasonable use expected
