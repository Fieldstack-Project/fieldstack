# AGENTS.md - Fieldstack Agent Guide

> Project Status: Planning/Documentation phase (implementation planned 2026-2027)
> This repo currently contains specifications and design docs. No source code yet.

---

## Repository Orientation

- Primary docs: `docs/v2_FINANCIAL-LEDGER/` (mostly Korean).
- Public overview: `README.md`.
- Treat commands and conventions as planned until implementation lands.

---

## Build / Lint / Test Commands

**Current State**: No build system implemented yet. Commands below are planned.

**Planned Dev/Build/Test/Lint (from docs)**:

```bash
# Development (when implemented)
pnpm dev            # Run dev workflow (see 98-build-process.md)
pnpm dev:web        # Vite dev server (port 5173)
pnpm dev:api        # Express backend (port 3000)

# Production build
pnpm build          # Build all packages (integrated mode)
pnpm build:web      # Frontend only
pnpm build:api      # Backend only
pnpm start          # Start production server

# Testing (planned: Vitest + React Testing Library)
pnpm test           # Run all tests
pnpm test:unit      # Unit tests only
pnpm test:e2e       # E2E tests (Playwright)
pnpm test:watch     # Watch mode

# Linting (planned: ESLint + Prettier)
pnpm lint           # Lint all code
pnpm lint:fix       # Auto-fix issues
pnpm format         # Format with Prettier

# Type checking
pnpm typecheck      # TypeScript type checking
```

**Single Test Runs**:
- No single-test command is documented yet.
- Once scripts exist, prefer project-defined commands in `package.json`.

---

## Build Process Details (Docs)

Reference: `docs/v2_FINANCIAL-LEDGER/deployment/98-build-process.md`

**Root scripts (planned)**:

```json
{
  "scripts": {
    "dev": "pnpm --parallel dev",
    "dev:api": "pnpm --filter api dev",
    "dev:web": "pnpm --filter web dev",
    "build": "pnpm build:web && pnpm build:api && pnpm postbuild",
    "build:web": "pnpm --filter web build",
    "build:api": "pnpm --filter api build",
    "postbuild": "node scripts/copy-frontend.js",
    "start": "cd apps/api && node dist/index.js",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint"
  }
}
```

**Build verification (planned)**:

```bash
ls -la apps/web/dist
ls -la apps/api/dist
ls -la apps/api/public
du -sh apps/web/dist
du -sh apps/api/dist
du -sh apps/api/public
cd apps/api
node dist/index.js
```

---

## Code Style & Conventions (Planned)

### TypeScript Strictness

- Use strict TS settings (planned in `tsconfig.json`).
- Never use `any`, `@ts-ignore`, or `@ts-expect-error`.

### Type Definitions

- Prefer `interface` for object shapes.
- Use `type` for unions, intersections, utilities.
- Define module types in `types/index.ts`.

### Imports

Order (planned ESLint rule):
1. External libraries (`react`, `express`)
2. Internal packages (`@fieldstack/core`, `@fieldstack/ui`)
3. Relative imports (`./`, `../`)

Use `import type` for types.

### Naming Conventions

| Item | Convention | Example |
| --- | --- | --- |
| Components | PascalCase | `MyComponent.tsx` |
| Hooks | `use` + camelCase | `useLedger.ts` |
| Services | camelCase | `ledgerService.ts` |
| Types/Interfaces | PascalCase | `LedgerItem` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Files | kebab-case or PascalCase | `ledger-list.tsx` |
| API routes | kebab-case | `/api/ledger-items` |

### Error Handling

- Backend: explicit try/catch with meaningful status + message.
- Frontend: user-friendly error messages; rethrow when caller needs it.
- Never leave empty catch blocks.
- Never log sensitive data (tokens, passwords).

### Validation

- Zod is preferred for input validation.
- Yup is listed as an alternative, but use Zod unless module docs require otherwise.

---

## UI/UX Guidelines (Planned)

- UI is fully separated from core/module business logic.
- Prefer `@fieldstack/ui` components for consistency.
- Tailwind CSS is the planned styling approach.
- Users can override UI with `apps/web/src/custom-ui/`.

Design tokens (from `docs/v2_FINANCIAL-LEDGER/ui/design-system.md`):
- Primary color: blue scale (500 = `#3B82F6`).
- Semantic colors: success `#10B981`, warning `#F59E0B`, danger `#EF4444`.
- Fonts: Inter (text), JetBrains Mono (code).
- Breakpoints: `sm <= 640`, `md >= 768`, `lg >= 1024`.

---

## Module Rules (Planned)

- Modules are self-contained (no cross-module imports).
- Keep `frontend/`, `backend/`, `types/` within each module.
- Use Event Bus for inter-module communication.
- Core only forwards file uploads; modules validate/parse/process.
- Privacy-first: no telemetry, no SaaS, no data collection.

---

## Testing Guidelines (Planned)

- Backend: Vitest
- Frontend: React Testing Library
- E2E: Playwright (optional)
- Write tests for critical paths

---

## Tooling & Infra (Planned)

- Package manager: pnpm (workspace)
- Node.js: >= 20
- TypeScript: >= 5
- React: >= 18
- Backend: Express (or Fastify)

---

## Cursor / Copilot Rules

- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.

---

## Key References

- `docs/v2_FINANCIAL-LEDGER/technical/tech-stack.md`
- `docs/v2_FINANCIAL-LEDGER/deployment/98-build-process.md`
- `docs/v2_FINANCIAL-LEDGER/ui/design-system.md`
- `docs/v2_FINANCIAL-LEDGER/ui/core-components.md`
- `README.md`

---

Last Updated: 2026-02-03
