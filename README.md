# NPC Finder

[![Status](https://img.shields.io/badge/Status-In%20Development-orange)](https://github.com/aftongauntlett/npcfinder)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/aftongauntlett/npcfinder)](https://github.com/aftongauntlett/npcfinder/commits/main)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)

A private, invite-only media tracking platform for small friend groups. Track movies, TV shows, music, books, and games. Share recommendations with friends, not algorithms.

Built with React 19, TypeScript, and Supabase with Row-Level Security.

> **Live Site**: [npcfinder.com](https://npcfinder.com)  
> **Documentation**: [docs/](docs/README.md)

## Features

- **Media Tracking**: Movies, TV shows, music, books, and games
- **Personal Libraries**: Watchlists, reading lists, and game libraries with custom statuses
- **Recommendations**: Send and track media recommendations with friends
- **Reviews & Ratings**: Rate and review content with privacy controls
- **Customization**: Custom themes, dark/light mode, configurable dashboard
- **Admin Tools**: Invite code management and user activity monitoring

## Tech Stack

**Frontend**: React 19, TypeScript, Vite, TailwindCSS, Framer Motion, TanStack Query, React Router  
**Backend**: Supabase (PostgreSQL + Auth with Row-Level Security)  
**APIs**: TMDB, iTunes, Google Books, RAWG, OMDB  
**Testing**: Vitest, React Testing Library

## Security

- **Authentication**: Supabase Auth with session management
- **Database Security**: Row-Level Security (RLS) policies on all user tables
- **Admin Protection**: Multi-layer authorization with database triggers
- **Invite System**: Email-validated invite codes with expiration
- **XSS Protection**: All user content rendered as plain text
- **Security Headers**: CSP, X-Frame-Options, and other protective headers

For comprehensive security documentation, see:

- [Security Review 2025](docs/SECURITY-REVIEW-2025.md) - Full security assessment
- [Security Checklist](docs/SECURITY-CHECKLIST.md) - Ongoing maintenance tasks
- [Rate Limiting Guide](docs/RATE-LIMITING-GUIDE.md) - Optional rate limiting implementation

## Quick Start

```bash
git clone https://github.com/aftongauntlett/npcfinder.git
cd npcfinder
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

npm run dev
```

For complete setup including database migrations, API configuration, and deployment, see [docs/QUICK-START.md](docs/QUICK-START.md).

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm test                 # Run tests
npm run lint             # Run ESLint
npm run db:migration:new # Create new database migration
```

## Documentation

- [Quick Start Guide](docs/QUICK-START.md) - Complete setup and deployment
- [API Setup](docs/API-SETUP.md) - Configure external APIs
- [Database Migrations](docs/DATABASE-MIGRATIONS.md) - Schema management
- [Invite System](docs/INVITE-SYSTEM-QUICKSTART.md) - User access control
- [Testing Strategy](docs/TESTING-STRATEGY.md) - Writing and running tests
- [Privacy & Security](docs/PRIVACY-REALITY-CHECK.md) - What is and isn't private
- [Services Layer](src/services/README.md) - Business logic architecture

## Privacy & Access

- **Invite-only**: Admin-generated codes with email verification and 30-day expiration
- **Row-Level Security**: PostgreSQL RLS enforces data isolation
- **Database Isolation**: Each installation uses its own Supabase project
- **Standard Security Model**: Not end-to-end encrypted; database admin can access data

See [docs/PRIVACY-REALITY-CHECK.md](docs/PRIVACY-REALITY-CHECK.md) for full details.

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

Built by [Afton Gauntlett](https://www.aftongauntlett.com/)
