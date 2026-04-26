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

Current phase: **Phase 2.2 — Subscription module in progress**

- Phase 1 · 1.5 · 1.9 · 1.95 — all complete
- Phase 2 pre-work (ModuleRegistry, module management API, per-user activation) — complete
- Phase 2.1 Ledger (backend + frontend, CSV import/export, budgets, receipt attachments) — complete
- Phase 2.x core infrastructure (i18n, Event Bus, Core Scheduler, exchange rates) — mostly complete
- Phase 2.2 Subscription — core features complete, remaining: Google Calendar, calendar view, timezone strategy
- Target timeline: **2026–2027**

### Phase Progress

| Phase | Scope | Status | Progress |
| ----- | ----- | ------ | -------- |
| Phase 1 | Core foundation setup | Completed ✅ | 100% |
| Phase 1.5 | Core Control Plane UI/UX | Completed ✅ | 100% |
| Phase 1.9 | API server · DB · auth backend · shared links | Completed ✅ | 100% |
| Phase 1.95 | Setup install wizard (mode switch · backend API · UI · reset) | Completed ✅ | 100% |
| Phase 2 Pre | ModuleRegistry · module management API · per-user activation | Completed ✅ | 100% |
| Phase 2.1 | Ledger module (backend + frontend) | Completed ✅ | 100% |
| Phase 2.x | Core systems (i18n · Event Bus · Scheduler · exchange rates) | Mostly complete ⏳ | ~80% |
| Phase 2.2 | Subscription module | In progress ⏳ | ~70% |
| Phase 3 | Marketplace and website | Not started 🚧 | 0% |
| Phase 4 | Deployment optimization | Not started 🚧 | 0% |
| Phase 5 | Expansion and ecosystem | Not started 🚧 | 0% |
| Phase 6 | Community growth (continuous) | Not started 🚧 | 0% |

#### Phase 2.2 Subscription — Remaining

| Item | Status |
| ---- | ------ |
| Core features (CRUD · price history · stats · notes · scheduler · Event Bus) | Done ✅ |
| Cumulative stats with status history (pause/resume periods excluded) | Done ✅ |
| Payment calendar view | Pending ⏳ |
| Ledger auto-sync (`subscription:payment` event receiver) | Pending ⏳ |
| Timezone strategy (display vs. billing calculation separation) | Pending ⏳ |
| Google Calendar integration | Pending ⏳ |

> Note: This table follows `docs/v2_FINANCIAL-LEDGER/roadmap/01-development-plan.md` and is updated as implementation progresses.

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 19, Vite, TypeScript (strict) |
| Backend | Node.js, Express 5, tsx |
| Database | PostgreSQL (primary) · SQLite via `better-sqlite3` |
| Auth | JWT, TOTP 2FA, Argon2id |
| i18n | i18next · react-i18next (ko / en) |
| Scheduler | node-cron (Core Scheduler with DB logging) |
| Exchange rates | Frankfurter API (DB-cached) |
| Monorepo | pnpm workspaces |
| Testing | Vitest |
| UI Components | `@fieldstack/controls` (internal), Storybook |
| Styling | CSS custom properties (design token system) |
| Tunneling | Cloudflare Tunnel (Quick / Named) |

---

## Getting Started

> **Production deployment guide will be published when Phase 2 is complete.**<br>
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
