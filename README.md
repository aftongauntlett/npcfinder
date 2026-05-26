# NPC Finder

[![Status](https://img.shields.io/badge/Status-In%20Development-orange)](https://github.com/aftongauntlett/npcfinder)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)

NPC Finder is an invite-only app for trusted friends to **archive and share media collections**.

You can curate mixed collections (movies, TV, books, music), share with your circle, and manage access with role-based permissions.

**Live Site:** [npcfinder.com](https://npcfinder.com)  
**Docs Index:** [docs/README.md](docs/README.md)

## Product Focus

- **Primary:** Media collections + trusted social sharing
- **Secondary:** Personal tools (`/app/tasks`)
- **Current milestone:** Invite-only collaboration and role-safe sharing workflows
- **Security:** Supabase Auth + PostgreSQL RLS + invite-only onboarding

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
```

## Documentation

- [docs/README.md](docs/README.md) - full documentation index
- [docs/QUICK-START.md](docs/QUICK-START.md) - setup + deployment
- [docs/DATABASE-MIGRATIONS.md](docs/DATABASE-MIGRATIONS.md) - schema workflow
- [docs/INVITE-SYSTEM-QUICKSTART.md](docs/INVITE-SYSTEM-QUICKSTART.md) - invite onboarding and admin flow
- [docs/ROLE-SYSTEM.md](docs/ROLE-SYSTEM.md) - roles and authorization model
- [docs/COPILOT-AGENTS-GUIDE.md](docs/COPILOT-AGENTS-GUIDE.md) - AI agent workflow and guardrails
- [docs/CURRENT-APP-STATE.md](docs/CURRENT-APP-STATE.md) - current feature and route snapshot

## License

MIT - see [LICENSE](https://opensource.org/licenses/MIT).

Built by [Afton Gauntlett](https://www.aftongauntlett.com/)
