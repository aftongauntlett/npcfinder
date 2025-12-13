# NPC Finder

[![Status](https://img.shields.io/badge/Status-In%20Development-orange)](https://github.com/aftongauntlett/npcfinder)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/aftongauntlett/npcfinder)](https://github.com/aftongauntlett/npcfinder/commits/main)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)

NPC Finder is built as a real production application, not a single-page demo. It includes:

- a normalized PostgreSQL schema with strict Row-Level Security
- role-based admin enforcement backed by database policies
- a Supabase-driven auth and invite system
- a component architecture with shared UI primitives
- React Query-based caching and data fetching
- structured migrations and environment-specific workflows
- accessibility-focused UI updates
- automated testing with Vitest + RTL
- a growing suite of domain modules (media, recommendations, tasks, recipes, jobs)

**Live Site**: [npcfinder.com](https://npcfinder.com)  
**Documentation**: [docs/](docs/README.md)

## Features

- **Media Tracking**: Movies, TV shows, music, books, and games with personal libraries and custom statuses
- **Friend Recommendations**: Send and track media recommendations with personal notes and feedback
- **Recipe & Meal Planning**: Save recipes, plan meals, and organize your cooking schedule
- **Personal Trackers**: Kanban boards, task management, recipe and job application tracking
- **Reviews & Ratings**: Rate and review content with privacy controls
- **Customization**: Custom themes, dark/light mode, configurable dashboard
- **Friend Connections**: Manual, opt-in connections with trusted friends
- **Admin Tools**: Invite code management and user activity monitoring

## Tech Stack

**Frontend**: React 19, TypeScript, Vite, TailwindCSS, Framer Motion, TanStack Query, React Router  
**Backend**: Supabase (PostgreSQL + Auth with Row-Level Security)  
**APIs**: TMDB, iTunes, Google Books, RAWG, OMDB  
**Testing**: Vitest, React Testing Library

## For Users

NPC Finder is currently invite-only while in beta. To join:

1. Receive an invite code from an existing admin
2. Visit [npcfinder.com](https://npcfinder.com)
3. Sign up with the email address your invite was sent to

No public signup is available - this keeps the platform private and trusted.

### Privacy & Access

- **Invite-only**: Admin-generated codes with email verification and 30-day expiration
- **Row-Level Security**: PostgreSQL RLS enforces data isolation
- **Database Isolation**: Each installation uses its own Supabase project
- **Standard Security Model**: Not end-to-end encrypted; database admin can access data

See the Privacy & Security section below for details.

## For Developers: Self-Hosting

Want to run NPC Finder for your own friend group? Follow these steps to set up your own instance.

### Quick Start

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

### Supabase Setup

See [docs/QUICK-START.md](docs/QUICK-START.md) for detailed Supabase project setup and database migration instructions.

### Environment Configuration

Configure your `.env.local` file with Supabase credentials and optional API keys. See [docs/API-SETUP.md](docs/API-SETUP.md) for API configuration.

### Database Migrations

All schema changes are managed through migrations. See [docs/DATABASE-MIGRATIONS.md](docs/DATABASE-MIGRATIONS.md) for migration management.

### API Keys

Optional external APIs for media metadata (TMDB, Google Books, OMDB, iTunes). See [docs/API-SETUP.md](docs/API-SETUP.md) for setup instructions.

### Security

- **Authentication**: Supabase Auth with session management
- **Database Security**: Row-Level Security (RLS) policies on all user tables
- **Admin Authorization**: Database-driven admin checks with RLS enforcement
- **Admin Protection**: Multi-layer authorization with database triggers preventing privilege escalation
- **Invite System**: Email-validated invite codes with 30-day expiration and one-time use
- **XSS Protection**: All user content rendered as plain text
- **Security Headers**: CSP, X-Frame-Options, and other protective headers

**Important**: Admin status is determined by the `role` field in the `user_profiles` table (with `is_admin` as a generated column for backward compatibility). The frontend queries the database to check admin status, and RLS policies enforce database-level access control.

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm test                 # Run tests
npm run lint             # Run ESLint
npm run db:migration:new # Create new database migration
```

### Documentation

These guides are for developers who want to self-host or contribute to the project.

- [Documentation Index](docs/README.md) - Complete documentation directory
- [Self-Hosting Guide](docs/QUICK-START.md) - Complete setup and deployment
- [API Setup](docs/API-SETUP.md) - Configure external APIs
- [Database Migrations](docs/DATABASE-MIGRATIONS.md) - Schema management
- [Invite System](docs/INVITE-SYSTEM-QUICKSTART.md) - User access control

## Roadmap

Future features under consideration. These are not currently available and plans may change based on user feedback, technical feasibility, and project priorities.

**Social:**

- Custom Profiles - Customizable profiles inspired by MySpace with custom backgrounds and music players
- In-Browser Social Game - A cozy social game built into the dashboard (think Animal Crossing meets productivity tracking)

**Scalability:**

- Discord-Style Networks - Optional user-created networks for scaling beyond small friend groups
- End-to-End Encryption - Private messaging and journaling with full E2E encryption (long-term goal requiring significant architectural changes)

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

Built by [Afton Gauntlett](https://www.aftongauntlett.com/)
