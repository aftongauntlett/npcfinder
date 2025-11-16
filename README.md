# NPC Finder

[![Status](https://img.shields.io/badge/Status-In%20Development-orange)](https://github.com/aftongauntlett/npcfinder)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/aftongauntlett/npcfinder)](https://github.com/aftongauntlett/npcfinder/commits/main)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)

A private, invite-only life-management hub for small, trusted friend groups. No ads. No tracking. No public profiles. No strangers. A modular platform where you control your data.

Built with React 19, TypeScript, and Supabase. Currently featuring full media tracking (TMDB, iTunes, Google Books, RAWG) with personal libraries, reviews, and recommendations. Expanding into multi-purpose modules for tasks, recipes, fitness, planning, and more - all with the same privacy-first approach and Row-Level Security.

> **Status**: In active development. Private, invite-only tool for small groups (not a public social platform). Media tracking fully functional, additional modules in planning.

## Links

- **Live Site**: [npcfinder.com](https://npcfinder.com)
- **Advanced Self-Hosting**: See [docs/QUICK-START.md](docs/QUICK-START.md) for running your own instance (optional)
- **Documentation**: [docs/README.md](docs/README.md)

## Tech Stack

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.x-ff4154?logo=react-query&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1-646cff?logo=vite&logoColor=white)

**Frontend:**

- React 19 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Framer Motion for animations
- TanStack Query for server state
- React Router for navigation

**Backend:**

- Supabase (PostgreSQL + Auth)
- Row-Level Security (RLS)

**External APIs:**

- TMDB (movies and TV)
- iTunes (music)
- Google Books (books)
- RAWG (games)
- OMDB (ratings and awards)

**Testing:**

- Vitest with React Testing Library

## Motivation

Share media recommendations with friends, not advertisers. NPC Finder is invite-only, designed for small groups (5-50 people) who trust each other.

Currently focused on media tracking (movies, TV, music, books, games), expanding into a modular life dashboard for tasks, recipes, fitness, and planning. Each installation runs its own isolated database.

## Who Should Use This

- **Small friend groups** who want a private space to share media recommendations
- **Developers** learning React + Supabase or wanting to self-host a media tracker
- **People tired of ad-driven feeds** who want recommendations from real friends

## Platform Vision

Evolving into a modular life dashboard beyond media - recipes, tasks, fitness, diaries, collaborative planning. Future consideration: Discord-style networks for custom permissions. All modules maintain invite-only access, RLS, and isolated databases.

## Features

**Media Types:**

- Movies & TV (TMDB)
- Music (iTunes)
- Books (Google Books)
- Games (RAWG)

**Recommendations:**

- Send recommendations to friends with personal notes
- Track sent and received recommendations
- Mark items as hit, miss, or queued
- View recommendation history by friend

**Reviews & Ratings:**

- Rate items 1-5 stars
- Write reviews (up to 1000 characters)
- Privacy controls (public to friends or private)
- View friends' reviews
- Track consumption dates

**Personal Libraries:**

- Watchlist for movies/TV
- Reading list for books
- Game library for playing/played
- Music library for listening/listened

**Customization:**

- Custom theme colors
- Dark/light mode
- Dashboard card visibility
- Personal greeting and display name

**Admin Panel:**

- Generate invite codes (email-specific, 30-day expiration)
- View user stats and activity
- Manage connections

## Architecture

```
src/
├── components/         # React components
│   ├── pages/         # Page-level components
│   ├── layouts/       # Layout templates
│   ├── shared/        # Reusable UI components
│   └── media/         # Media-specific components
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
├── lib/               # Core utilities and API clients
├── services/          # Business logic layer
└── utils/             # Helper functions
```

**Patterns:**

- TanStack Query for server state management
- Service layer separates business logic from UI
- Context providers for global state (auth, theme, admin)
- Custom hooks encapsulate data fetching
- React.memo and useCallback for performance

See [src/services/README.md](src/services/README.md) for service layer details.

### Component Architecture

NPC Finder uses a **consistent component system** for displaying media across all types (movies, TV, books, games, music). This ensures a unified user experience and maintainable codebase.

**Display Components:**

- **List Views** (`MediaListItem`): All personal libraries use this component for consistent horizontal list display

  - Compact layout optimized for readability
  - Supports action buttons (toggle complete, recommend, remove)
  - Shows poster, title, creator info, year, ratings, genres

- **Card Views** (`UnifiedMediaCard`): Grid/tile displays use this component for consistent vertical card display

  - Poster-focused design with hover overlay
  - Shows title, year, rating on hover
  - Status badges for tracking progress

- **Recommendations** (`MediaRecommendationCard`): All recommendation views use this component with render props
  - Hit/Miss buttons for received recommendations
  - Comment system and status tracking
  - Unsend functionality for sent recommendations

**Shared Components:**

- `MediaPoster` - Image display with fallback icons
- `StatusBadge` - Progress indicators (watching, reading, playing)
- `StarRating` - 1-5 star rating display and input
- `ActionButtonGroup` - Reusable action button toolbar
- `GenreChips` - Genre/category tag display

**Media Type Data Mapping:**

| Media Type | Title | Subtitle (Creator / Context) | Year          | Genres     | Personal Rating | Critic Rating      | Notes                                                            |
| ---------- | ----- | ---------------------------- | ------------- | ---------- | --------------- | ------------------ | ---------------------------------------------------------------- |
| Movies/TV  | title | director                     | release_date  | genres     | ❌              | TMDB vote_average  | media_type badge (Movie/TV)                                      |
| Books      | title | authors                      | publishedDate | categories | ✅              | ❌                 | Primary category displayed                                       |
| Games      | name  | platforms                    | released      | genres     | ✅              | metacritic (0-100) | Shows platforms instead of creator (developer/studio not stored) |
| Music      | title | artist                       | release_date  | genre      | ✅              | ❌                 | Album/track based                                                |

**Deprecated Components:**

⚠️ Do not use `MediaCard` or `BookCard` in new code - these are deprecated wrappers around `UnifiedMediaCard` maintained only for backward compatibility. They will be removed in v2.0.0.

Migration: Replace `<MediaCard ... />` with `<UnifiedMediaCard mediaType='movie' ... />`

## Build & Run

**Prerequisites:**

- Node.js 18+
- Supabase account

**Setup:**

```bash
git clone https://github.com/aftongauntlett/npcfinder.git
cd npcfinder
npm install

# Create .env.local with your Supabase credentials
cp .env.example .env.local

# Run development server
npm run dev

# Run tests
npm test
```

See [docs/QUICK-START.md](docs/QUICK-START.md) for complete setup including database migrations, invite codes, and deployment.

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode
npm run lint             # Run ESLint
npm run db:migration:new # Create new database migration
```

## Privacy & Security

**Access Control:**

- Invite-only signups with admin-generated codes (email-specific, 30-day expiration)
- Row-Level Security (RLS) in PostgreSQL
- JWT-based authentication

**Database Isolation:**
Each installation uses its own Supabase project with unique credentials. No connection between installations.

**What's NOT Private:**
Not end-to-end encrypted. Database admin and Supabase can access data. Standard web app security model (like Netflix, Spotify).

See [docs/PRIVACY-REALITY-CHECK.md](docs/PRIVACY-REALITY-CHECK.md) for full details.

## Roadmap

**Note:** Aspirational features under consideration. Not currently available and may change.

**Productivity:** Suggestions board with voting, trackers and to-do lists  
**Social:** Friend requests, personalized profiles (MySpace/AOL-style)  
**Experience:** Virtual home customization, friend visits  
**Privacy:** End-to-end encryption

## Documentation

**Setup:**

- [Quick Start](docs/QUICK-START.md)
- [Database Migrations](docs/DATABASE-MIGRATIONS.md)
- [API Setup](docs/API-SETUP.md)
- [Invite System](docs/INVITE-SYSTEM-QUICKSTART.md)

**Development:**

- [Testing Strategy](docs/TESTING-STRATEGY.md)
- [Services Layer](src/services/README.md)

**Security:**

- [Privacy Reality Check](docs/PRIVACY-REALITY-CHECK.md)
- [Security Recommendations](docs/SECURITY-RECOMMENDATIONS-REVIEW.md)

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

Built by [Afton Gauntlett](https://www.aftongauntlett.com/)
