# Fieldstack

> Personal modular productivity framework

[![한국어](https://img.shields.io/badge/README-한국어-blue)](README_ko.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Org](https://img.shields.io/badge/GitHub-fieldstack--project-181717?logo=github)](https://github.com/fieldstack-project)

---

## About

Fieldstack is an open-source, self-hosted modular framework for personal productivity and finance management.

**Developed and maintained by** [PSquare DIVISION](https://github.com/psquare-division)

### Core Values
- ✅ **Completely Free** - No feature restrictions
- ✅ **Self-hosted** - Your data, your control
- ✅ **Modular** - Install only what you need
- ✅ **Open Source** - MIT License
- ✅ **Community-driven** - Built together

---

## Development Status

Current phase: **Development in progress (Roadmap Phase 1.5)**

- ✅ Planning and documentation are complete
- ✅ Roadmap Phase 1 (Core foundation) is complete
- ✅ Roadmap Phase 1.9 (API server, DB, auth backend, shared links) is complete
- 🚧 Roadmap Phase 1.5 (Core Control Plane UI/UX) is nearing completion
- 🎯 Target timeline remains **2026-2027**

### Phase Progress

| Phase | Scope (Roadmap) | Status | Progress |
| ------- | ----------- | ------- | ------- |
| Phase 1 | Core foundation setup | Completed ✅ | 100% |
| Phase 1.5 | Core Control Plane UI/UX | In progress ⏳ | 90% |
| Phase 1.9 | API server · DB · auth backend · shared links | Completed ✅ | 100% |
| Phase 1.95 | Setup install wizard (mode switch · backend API · UI) | In progress ⏳ | 0% |
| Phase 2 | Core module development (Ledger, Subscription) | Not started 🚧 | 0% |
| Phase 3 | Marketplace and website | Not started 🚧 | 0% |
| Phase 4 | Deployment optimization | Not started 🚧 | 0% |
| Phase 5 | Expansion and ecosystem | Not started 🚧 | 0% |
| Phase 6 | Community growth (continuous) | Not started 🚧 | 0% |

#### Phase 1.5 Snapshot (2026-04-15)

| Sub-phase | Scope | Status |
| --------- | ----- | ------ |
| 1.5.1 | Control UI components (P0/P0.5 implemented, `ready: true`) | Done ✅ |
| 1.5.2 | Install wizard dev bypass (`dev:bypass`) | Done ✅ |
| 1.5.3 | Login UX (failure/lock/session expiry, password recovery, mock accounts) | Done ✅ |
| 1.5.4 | Main Home (sidebar, deep link routing, mobile drawer, onboarding banner) | Done ✅ |
| 1.5.5 | Admin dashboard / general settings (PIN step-up, audit log, dirty-state save) | Done ✅ |
| 1.5.6 | UX quality baseline (responsive breakpoints, QA checklist, a11y, tone guide) | Done ✅ |
| Gate | Accessibility / responsive / E2E pass · UI contract freeze | Pending ⏳ |

> Note: This phase table follows `docs/v2_FINANCIAL-LEDGER/roadmap/01-development-plan.md` and is updated as implementation progresses.

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 19, Vite, TypeScript (strict) |
| Backend | Node.js, Express 5, tsx |
| Database | PostgreSQL (primary) · SQLite (planned) |
| Auth | JWT, TOTP 2FA, Argon2id |
| Monorepo | pnpm workspaces |
| Testing | Vitest |
| UI Components | `@fieldstack/controls` (internal), Storybook |
| Styling | CSS custom properties (design token system) |

---

## Getting Started

> **Production deployment guide will be published when the Setup install wizard (Phase 1.95) is complete.**
> Until then, you can run the project locally in development mode.

### Local Development

```bash
git clone https://github.com/fieldstack-project/fieldstack.git
cd fieldstack
pnpm install

# Start PostgreSQL (Docker required)
docker-compose up -d

# Run dev server (web + api in parallel)
pnpm dev:bypass       # skip install wizard
# → Web:  http://localhost:5173
# → API:  http://localhost:3000

# Storybook (UI components)
pnpm storybook        # http://localhost:6007
```

**Dev mock accounts**

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `admin@fieldstack.dev` | `Admin1234!` |
| User | `user@fieldstack.dev` | `User1234!` |

---

## Documentation

📚 [Official Documentation](https://docs.fieldstack.dev)<br>
🏪 [Marketplace](https://marketplace.fieldstack.dev)<br>
💬 [Community Discord](https://discord.gg/5m4aHKmWgg)

---

## License

MIT License - see [LICENSE](LICENSE) for details

**Copyright © 2026 Fieldstack Project Contributors**<br>
**Developed and maintained by PSquare DIVISION**
