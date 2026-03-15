# NPC Finder

[![Status](https://img.shields.io/badge/Status-In%20Development-orange)](https://github.com/aftongauntlett/npcfinder)
[![License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)

NPC Finder is an invite-only app for trusted friends to **archive and share media collections**.

You can curate mixed collections (movies, TV, books, music, games), share with your circle, and manage access with role-based permissions.

**Live Site:** [npcfinder.com](https://npcfinder.com)  
**Docs Index:** [docs/README.md](docs/README.md)

## Product Focus

- **Primary:** Media collections + trusted social sharing
- **Secondary:** Personal tools (`/app/tasks`, currently labeled `Labs` in-app)
- **Milestone:** In-app game route (`/app/game`) with Phase 1 launch-token scaffold complete
- **Security:** Supabase Auth + PostgreSQL RLS + invite-only onboarding

See [docs/APP-PURPOSE-AND-DIRECTION.md](docs/APP-PURPOSE-AND-DIRECTION.md) for full direction and roadmap guidance.

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
- [docs/API-SETUP.md](docs/API-SETUP.md) - media API keys
- [docs/DATABASE-MIGRATIONS.md](docs/DATABASE-MIGRATIONS.md) - schema workflow
- [docs/ROLE-SYSTEM.md](docs/ROLE-SYSTEM.md) - roles and authorization model
- [docs/COPILOT-AGENTS-GUIDE.md](docs/COPILOT-AGENTS-GUIDE.md) - AI agent workflow and guardrails
- [docs/APP-PURPOSE-AND-DIRECTION.md](docs/APP-PURPOSE-AND-DIRECTION.md) - product direction review
- [docs/TRAYCER-PROMPTS.md](docs/TRAYCER-PROMPTS.md) - deep review prompt pack
- [docs/BROWSER-GAME-INTEGRATION.md](docs/BROWSER-GAME-INTEGRATION.md) - browser game integration + token handoff setup
- [docs/prds/README.md](docs/prds/README.md) - product PRDs

## License

MIT - see [LICENSE](https://opensource.org/licenses/MIT).

Built by [Afton Gauntlett](https://www.aftongauntlett.com/)
