# Self-Hosting Guide

This guide walks you through setting up your own instance of NPC Finder. You'll have complete control over your data and can customize the platform for your friend group.

**Note**: NPC Finder is in active development. I recommend waiting for the v1.0 milestone before deploying to production unless you're comfortable with frequent updates and potential breaking changes.

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
2. Copy contents of `supabase/migrations/0001_baseline.sql`
3. Run the migration
4. This single migration contains the complete schema

**Note**: Old prototype migrations are archived in `supabase/migrations/archive/` and don't need to be run.

See [DATABASE-MIGRATIONS.md](DATABASE-MIGRATIONS.md) for detailed migration management.

### 3. Configure Environment

Create `.env.local`:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in: Supabase Dashboard > Settings > API

**Note**: This project works directly with production database via Supabase CLI. All database operations target the linked production project.

See [API-SETUP.md](API-SETUP.md) for complete API key setup (TMDB, Google Books, OMDB, iTunes).

### 4. Run Application

```bash
npm run dev
```

### 5. Create First Admin

**Important:** Admin status is determined by the `role` field in the `user_profiles` table (with `is_admin` as a generated column for backward compatibility). The frontend queries the database to check admin status.

1. Sign up through the app (use any email)
2. In Supabase Dashboard: SQL Editor
3. Run this SQL to make yourself admin:

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

**Alternative:** Use the super admin configuration script:

```bash
npm run admin:configure
```

This script will prompt you for an email and create a super admin user with enhanced privileges.

4. Refresh the app - you should now have access to the Admin Panel

**Note:** See [ROLE-SYSTEM.md](ROLE-SYSTEM.md) for complete role system documentation and details about `user`, `admin`, and `super_admin` roles.

### 6. Generate Invite Codes

1. Log in as admin
2. Go to Admin Panel
3. Create invite codes (requires email, 30-day expiration)
4. Share codes with intended recipients

See [INVITE-SYSTEM-QUICKSTART.md](INVITE-SYSTEM-QUICKSTART.md) for complete invite system documentation.

## External APIs (Optional)

### TMDB (Movies/TV)

1. Get free API key: https://www.themoviedb.org/settings/api
2. Add to `.env.local`:

```bash
VITE_TMDB_API_KEY=your-key
```

### Google Books (Books)

1. Get free API key: https://console.cloud.google.com/apis/credentials
2. Add to `.env.local`:

```bash
VITE_GOOGLE_BOOKS_API_KEY=your-key
```

### OMDB (Movie Ratings - Optional)

1. Get free API key: http://www.omdbapi.com/apikey.aspx
2. Add to `.env.local`:

```bash
VITE_OMDB_API_KEY=your-key
```

**Note:** Optional—enriches movie details with Rotten Tomatoes, Metacritic, awards.

### iTunes (Music)

No setup needed - iTunes Search API is public and free.

See [API-SETUP.md](API-SETUP.md) for detailed API configuration.

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

- Configure external APIs: [API Setup](API-SETUP.md)
- Learn about database updates: [Database Migrations](DATABASE-MIGRATIONS.md)
- Understand invite codes: [Invite System](INVITE-SYSTEM-QUICKSTART.md)
