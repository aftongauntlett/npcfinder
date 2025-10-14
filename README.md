# NPC Finder

A modern, invite-only personal dashboard for tracking movies, TV shows, games, books, fitness, and more. Built with React, TypeScript, and Supabase with a focus on privacy and customization.

## Privacy-First Design

**Invite-Only Access** - No public signups. Share codes with trusted friends only.

**Two-Tier Security Model:**

- Standard Security: Media tracking with friend sharing (current)
- E2E Encryption: Diary and health data (planned)

Read more: [Privacy Reality Check](docs/PRIVACY_REALITY_CHECK.md) | [Future E2E Encryption](docs/FUTURE_E2E_ENCRYPTION.md)

## Features

### Media Tracking

Comprehensive tracking for Movies, TV Shows, Games, and Books:

- Smart Search via external APIs (TMDB, RAWG, Google Books)
- Personal Ratings with 1-5 star system
- External critic and audience scores
- Friend comparisons and recommendations
- Top 10 custom lists
- Random suggestion generator

### Fitness Dashboard

- Weight tracking with trend visualization
- Body measurements (waist, hip, chest, thigh, arm)
- Workout logging with type, duration, and notes
- Meal tracking with quality tags
- Analytics and streak tracking
- Export/import data as JSON
- Offline storage with IndexedDB

### Customization

- Dashboard card visibility preferences
- Custom theme colors (8 preset options)
- Personalized greeting header
- Dark/light mode with system detection
- Responsive mobile-first design

### Additional Sections

- News, Bookmarks, Vault
- Food & Places reviews
- Journal for daily thoughts

## Tech Stack

## Tech Stack

- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS with dark mode
- Supabase (PostgreSQL, auth, real-time)
- Supabase CLI for automated database migrations
- Dexie for offline IndexedDB storage
- Recharts for data visualization
- Lucide React for icons

**External APIs:** TMDB, RAWG, Google Books, Open-Meteo

## Documentation

### Getting Started

- [Quick Start Guide](docs/QUICK_START.md) - Setup in 30 minutes
- [Invite System Setup](INVITE_SYSTEM_QUICKSTART.md) - How invite codes work
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) - Pre-launch checklist

### Architecture

- [Media System Guide](docs/MEDIA_SYSTEM_GUIDE.md) - Complete implementation details
- [Supabase Setup](docs/SUPABASE_SETUP.md) - Database schema and configuration
- [Database Migrations](docs/DATABASE_MIGRATIONS.md) - Professional migration workflow
- [API Setup](docs/API_SETUP.md) - External API integration

### Privacy & Security

- [Privacy Reality Check](docs/PRIVACY_REALITY_CHECK.md) - Honest privacy explanation
- [Future E2E Encryption](docs/FUTURE_E2E_ENCRYPTION.md) - Plan for sensitive data
- [Security Checks](docs/SECURITY_CHECKS.md) - How to run security audits

### Testing

- [Testing Guide](docs/TESTING_GUIDE.md) - Writing and running tests
- [Test Results](TEST_RESULTS.md) - Current coverage (78 tests passing)

## Project Showcase

This project demonstrates:

- Modern React patterns (Hooks, Context, custom hooks)
- Security architecture (invite-only, Row-Level Security)
- Database design with PostgreSQL and automated migrations
- External API integration with error handling
- Comprehensive testing with Vitest
- Privacy-conscious design decisions
- TypeScript for type safety
- Reusable component architecture
- Accessibility (ARIA labels, keyboard navigation)
- Performance optimization

## Privacy Model

**What IS Private:**

- Data protected from other users via Row-Level Security
- No selling, sharing, or third-party access
- No analytics or tracking
- Invite-only for trusted friends

**What Is NOT Private (Yet):**

- Not end-to-end encrypted (for media tracking)
- Admin can technically access database
- Supabase hosting provider can access data

**Future Plans:**

- E2E encryption for diary entries
- E2E encryption for health data
- Standard security for social features

Full explanation: [Privacy Reality Check](docs/PRIVACY_REALITY_CHECK.md)

## Quick Start

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier)
- Git

### Installation

```bash
git clone https://github.com/aftongauntlett/npcfinder.git
cd npcfinder
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Run database migrations
npm run db:migration:push

# Start development server
npm run dev

# Run tests
npm test
```

### First-Time Setup

1. Set up Supabase - Run SQL scripts in your dashboard
2. Create invite codes - Use admin panel
3. Invite friends - Share codes securely
4. Deploy - Push to Vercel/Netlify

See [Quick Start Guide](docs/QUICK_START.md) for detailed instructions.

##Contact

Questions? Check the docs or open an issue.

## License

Personal project for learning and portfolio purposes.

---

Built by Afton Gauntlett with a focus on privacy, security, and modern React patterns.
