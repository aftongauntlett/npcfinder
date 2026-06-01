# NPC Finder

[![Status](https://img.shields.io/badge/Status-In%20Development-orange)](https://github.com/aftongauntlett/npcfinder)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)

NPC Finder is a private media tracker and collaborative playlist app.

I built it to keep notes, ratings, and a timeline across movies, TV, books, music, and games. The private-by-default model helps it stay focused and useful instead of feeling like a public social feed.

This project is open source and in active development.

The app now has two focused surfaces:

- **Tracker**: private personal media diary split into genre routes (Movies & TV, Books, Music, Games) with status and note history
- **Playlists**: mixed-media thematic curation built from your tracker entries, private by default, shared with invited users (view-only)

**Live Site:** [npcfinder.com](https://npcfinder.com)  
**Docs Index:** [docs/README.md](docs/README.md)

## Product Focus

- **Primary:** Tracker (personal diary) + Playlists (curation + invite sharing)
- **Secondary:** Invite-only collaboration for trusted circles
- **Current milestone:** Tracker and playlist-first experience with role-safe sharing workflows
- **Security:** Supabase Auth + PostgreSQL RLS + invite-only onboarding
- **Legal baseline:** Public privacy + terms routes with consent ledger capture on signup

## Why It Exists

- Track what I watched, read, played, or listened to in one place
- Leave short notes and ratings to improve focus and retention
- Build a personal timeline I can revisit later
- Share curated collections with friends and exchange recommendations

For the current routed app surface, see [docs/CURRENT-APP-STATE.md](docs/CURRENT-APP-STATE.md).

## Tech Stack

- React 19 + TypeScript + Vite + Tailwind
- Supabase (PostgreSQL, Auth, RLS)
- TanStack Query + React Router
- Vitest + React Testing Library

## Quick Start (Self-Hosting)

```bash
git clone https://github.com/aftongauntlett/npcfinder.git
cd npcfinder
npm install
cp .env.example .env.local
npm run dev
```

For full setup, see [docs/QUICK-START.md](docs/QUICK-START.md).

## Common Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run test:backend-security
npm run test:backend-security:seeded
```

## Documentation

- [docs/README.md](docs/README.md) - full documentation index
- [docs/QUICK-START.md](docs/QUICK-START.md) - setup + deployment
- [docs/DATABASE-MIGRATIONS.md](docs/DATABASE-MIGRATIONS.md) - schema workflow
- [docs/BACKEND-SECURITY-TESTING-RUNBOOK.md](docs/BACKEND-SECURITY-TESTING-RUNBOOK.md) - automated backend security runbook parity tests
- [docs/PRIVACY-AND-COMPLIANCE.md](docs/PRIVACY-AND-COMPLIANCE.md) - privacy/terms routes, consent logging, and compliance baseline notes
- [docs/INVITE-SYSTEM-QUICKSTART.md](docs/INVITE-SYSTEM-QUICKSTART.md) - invite onboarding and admin flow
- [docs/ROLE-SYSTEM.md](docs/ROLE-SYSTEM.md) - roles and authorization model
- [docs/COPILOT-AGENTS-GUIDE.md](docs/COPILOT-AGENTS-GUIDE.md) - AI agent workflow and guardrails
- [docs/CURRENT-APP-STATE.md](docs/CURRENT-APP-STATE.md) - current feature and route snapshot

## License

MIT - see [LICENSE](https://opensource.org/licenses/MIT).

Built by [Afton Gauntlett](https://www.aftongauntlett.com/)
