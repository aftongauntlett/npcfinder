# Quick Start

## Prerequisites

- Node.js 18+
- Supabase account (free tier)

## Installation

```bash
git clone https://github.com/aftongauntlett/npcfinder.git
cd npcfinder
npm install
```

## Database Setup with Supabase

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Save your database password

### 2. Set Up Database

In Supabase dashboard:

1. Click SQL Editor
2. Copy contents of `supabase/migrations/` files
3. Run each migration in order
4. Enable Row Level Security on all tables

### 3. Configure Environment

Create `.env.local`:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in: Supabase Dashboard > Settings > API

### 4. Run Application

```bash
npm run dev
```

### 5. Create First Admin

1. Sign up through the app
2. In Supabase: SQL Editor
3. Run:

```sql
UPDATE user_profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

### 6. Generate Invite Codes

1. Log in as admin
2. Go to Admin Panel
3. Create invite codes (requires email, 30-day expiration)
4. Share codes with intended recipients

**Note**: Each invite code is tied to a specific email address and expires after 30 days.

## External APIs (Optional)

### TMDB (Movies/TV)

1. Get free API key: https://www.themoviedb.org/settings/api
2. Add to `.env.local`:

```bash
VITE_TMDB_API_KEY=your-key
```

### iTunes (Music)

No setup needed - iTunes Search API is public and free.

## Common Issues

**"Missing environment variables"**

- Check `.env.local` exists
- Check variables are spelled correctly
- Restart dev server after changes

**"Database connection failed"**

- Verify Supabase URL and key
- Check if project is paused (free tier auto-pauses)

**"No invite codes available"**

- You need to be admin
- Create codes in Admin Panel

## Deployment

**Vercel:**

```bash
npm run build
vercel --prod
```

Add environment variables in Vercel dashboard.

**Netlify:**

```bash
npm run build
netlify deploy --prod
```

Add environment variables in Netlify dashboard.

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Check code quality
```

## Next Steps

- See [Database Migrations](DATABASE_MIGRATIONS.md) for schema updates
- See [Testing Strategy](TESTING_STRATEGY.md) for adding tests
- See [API Setup](API_SETUP.md) for API key details
