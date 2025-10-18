# NPC Finder

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.75-3ecf8e)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange)](https://github.com/aftongauntlett/npcfinder)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/aftongauntlett/npcfinder)](https://github.com/aftongauntlett/npcfinder/commits/main)

A privacy-focused recommendation engine for sharing movies, TV shows, and music with close friends. Built with modern React patterns, TypeScript, and Supabase.

> **⚠️ Active Development**: This project is actively being built and refactored. It's used personally but not all features are fully functional yet. Feel free to explore the code and architecture!

## Overview

NPC Finder is an invite-only platform where friends share media recommendations in a calm, intentional way. Track what you've watched and listened to, get recommendations from friends, and mark them as hits or misses.

**Key Philosophy:**

- Privacy-first (invite-only, no public access)
- Friend-focused (quality over quantity)
- Intentional discovery (recommendations, not algorithms)

## Features

### Media Recommendations

**Music:**

- Search songs and albums via iTunes API
- Send recommendations to friends with personal notes
- Mark recommendations as "listened", "hit", or "miss"
- View friend recommendation history

**Movies & TV:**

- Search via TMDB API with detailed metadata
- Personal watch list management
- Send recommendations with watch/rewatch suggestions
- Track watched status and ratings

### Social Features

- Friend connections with automatic reciprocal relationships
- View recommendations by friend
- See what friends loved (hits) vs missed (misses)
- Track sent recommendations and recipient responses

### Suggestions System

- Create suggestions for any topic
- Friends vote on suggestions (Kanban-style)
- Track suggestion status (pending, accepted, completed)
- Archive completed suggestions

### Customization

- 8 preset theme colors
- Dark/light mode with system detection
- Customizable dashboard card visibility
- Personal greeting and display name

## Tech Stack

**Frontend:**

- React 19 with TypeScript
- Vite for build tooling and HMR
- TailwindCSS for styling
- Framer Motion for animations
- TanStack Query for server state management
- React Router for navigation
- Lucide React for icons

**Backend:**

- Supabase (PostgreSQL + Auth + Realtime)
- Row-Level Security (RLS) for data access control
- Supabase CLI for database migrations

**External APIs:**

- TMDB (movies and TV)
- iTunes (music search)

**Testing:**

- Vitest with React Testing Library
- Simple, behavioral tests

## Architecture

**Project Structure:**

```
src/
├── components/         # React components
│   ├── pages/         # Page-level components
│   ├── layouts/       # Layout templates
│   ├── shared/        # Reusable UI components
│   ├── media/         # Media-specific components
│   └── admin/         # Admin panel components
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
├── lib/               # Core utilities and API clients
├── services/          # Business logic layer
├── data/              # Mock data and constants
└── utils/             # Helper functions
```

**Key Patterns:**

- **TanStack Query** for declarative server state management with automatic caching
- **React.memo** and useCallback for performance optimization
- **Service layer** separates business logic from UI components
- **Mock/real data toggle** for development without backend setup
- **Context providers** for global state (auth, theme, admin)
- **Custom hooks** encapsulate data fetching and business logic

See [services/README.md](src/services/README.md) for service layer documentation.

## Documentation

### Getting Started

- [Quick Start Guide](01-QUICK-START.md)
- [Database Migrations](02-DATABASE-MIGRATIONS.md)
- [API Setup](03-API-SETUP.md)
- [Invite System](04-INVITE-SYSTEM-QUICKSTART.md)

### Architecture & Testing

- [Testing Strategy](05-TESTING-STRATEGY.md)
- [Performance Audit](06-PERFORMANCE-AUDIT.md)
- [Services Layer](src/services/README.md)

### Privacy & Security

- [Privacy Reality Check](07-PRIVACY-REALITY-CHECK.md)
- [Security Recommendations](08-SECURITY-RECOMMENDATIONS-REVIEW.md)
- [Future: E2E Encryption](09-FUTURE-E2E-ENCRYPTION.md)

## Privacy & Security

**Your data is safe when others clone this repo.**

This app uses your own Supabase instance. When someone clones:

- They must create their own Supabase project
- They use their own database credentials
- Your database and their database are completely separate
- No way for data to mix or cross between instances

**How It Works:**

```bash
# Your setup (not in git)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here

# Their setup (their own Supabase)
VITE_SUPABASE_URL=https://their-project.supabase.co
VITE_SUPABASE_ANON_KEY=their-key-here
```

Without your credentials, they cannot access your database. This is standard for all open-source projects.

## Privacy Model

**Invite-Only Access:**

- No public signups
- Admin-generated invite codes
- One-time use codes with expiration
- Trusted friend network only

**Database Security:**

- Each installation uses its own Supabase database
- Row-Level Security (RLS) in PostgreSQL
- Users can only access their own data and friends' shared data
- JWT-based authentication
- No tracking or analytics

**Cloning This Repo:**

- Safe - they use their own database instance
- Your data stays on your Supabase instance
- No connection between installations
- Standard open-source model

**What's NOT Private:**

- Not end-to-end encrypted (standard web app security)
- Database admin can access data (on their own instance)
- Supabase (hosting provider) can access data (on their own instance)

See [Privacy Reality Check](07-PRIVACY-REALITY-CHECK.md) for full details.

## Development Patterns

**Service Layer:**

- Separates business logic from React components
- Easy to mock for testing
- See [services/README.md](src/services/README.md)

**Mock Data:**

- Toggle between mock and real data via environment variable
- Enables frontend development without backend setup
- Useful for testing and demos

**Component Organization:**

- Pages for route-level components
- Layouts for reusable page structures
- Shared for common UI components
- Feature folders for domain-specific components

**Testing:**

- Simple, behavioral tests with Vitest
- Mock external dependencies
- Test user interactions, not implementation details

## Quick Start

**Interested in the code?**

This is open-source and you can explore the architecture and implementation. The project is actively being refactored with modern patterns, so not everything is fully functional yet.

**Prerequisites:**

- Node.js 18+
- Supabase account (for full database features)

**Quick Look (Mock Data - No Setup Required):**

```bash
git clone https://github.com/aftongauntlett/npcfinder.git
cd npcfinder
npm install

# Add to .env.local
echo "VITE_USE_MOCK=true" > .env.local

# Start dev server - uses dummy data, perfect for exploring the UI
npm run dev
```

**Full Setup (Database Required):**

```bash
# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and anon key to .env.local

# Run development server
npm run dev

# Run tests
npm test
```

**Full Setup Guide:**
See [Quick Start Guide](01-QUICK-START.md) for complete database setup, migrations, invite codes, and deployment instructions.

**Note:** Each installation uses its own Supabase instance. When you set up your own, you get a completely separate database—no connection to any other instance.

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode
npm run lint             # Run ESLint
npm run db:migration:new # Create new database migration
```

## Contact

Built by Afton Gauntlett

- GitHub: [@aftongauntlett](https://github.com/aftongauntlett)

## License

Personal project. See LICENSE for details.
