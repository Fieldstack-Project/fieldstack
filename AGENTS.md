# AGENTS.md - Fieldstack Agent Guide

This file provides high-signal, repo-specific guidance for AI agents working in the Fieldstack repository. Read this before taking action to avoid architectural mistakes.

## Project Status & Environment
- **Current Phase**: Phase 1.5 in progress. Core UI Shell is running but mostly mocked. Backend API endpoints are largely unimplemented.
- **Workspace**: `pnpm` workspace with `node-linker=hoisted`.
- **References**: Check `CLAUDE.md` and `docs/v2_FINANCIAL-LEDGER/` for phase-specific checklists and design tokens.

## Developer Commands

### Development Servers
- `pnpm dev` — Runs web + api in parallel (includes setup wizard).
- `pnpm dev:bypass` — **(Crucial)** Runs web + api but skips the installation wizard via `INSTALL_MODE=bypass`. Use this to test core UI directly.
- `pnpm dev:web` / `pnpm dev:api` — Run frontend or backend individually.
- `pnpm storybook` — Runs Storybook for `@fieldstack/controls` on **port 6007**.

### Testing & Verification
- `pnpm test` — Runs all tests recursively using Vitest.
- `pnpm --filter <package> test` — Run tests for a specific workspace package (e.g., `api`, `core`).
- `pnpm exec vitest run <path/to/test.ts>` — Run a single test file.
- `pnpm lint` — Run ESLint across all workspace packages.
- `pnpm typecheck` — Run TypeScript compiler checks.
- `pnpm build` — Builds web, builds api, then copies web build to `apps/api/public` via `scripts/copy-frontend.js`.

## Architecture Quirks

### Frontend (`apps/web`)
- **Hash Routing**: Uses Hash-based routing (`#login`, `#home`, `#admin`) managed by a custom state machine in `apps/web/src/main.tsx` (`effectiveRoute`).
- **Auth State**: Authentication and session state are persisted in `sessionStorage` using the `fs_` prefix (e.g., `fs_auth`, `fs_admin`).
- **Dev Mocks**: When testing auth UI locally, use `otp1234` for the OTP flow and `temp1234` for the force-password-change flow.

### Backend (`apps/api`)
- **Dynamic Module Loading**: Backend modules are dynamically scanned and loaded via `apps/api/src/loader/index.ts`.
- **Module Requirements**: A backend module will only be loaded if it has a valid `module.json` manifest with `"enabled": true`.

### Shared & UI Packages
- **`packages/controls`**: All P0/P0.5 components are fully implemented (`ready: true`). Styled with `fs-` prefixed CSS classes and design tokens. Use `@fieldstack/controls` in `apps/web` — do not write inline component styles in views.
- **Inter-module Communication**: Direct module-to-module imports are strictly forbidden. All cross-module communication must use the Event Bus.

## Strict Code Rules

- **TypeScript Strictness**: **NEVER** use `any`, `@ts-ignore`, or `@ts-expect-error`. If types are wrong, fix the types.
- **Imports**: 
  1. External libraries (`react`, `express`)
  2. Internal workspace packages (`@fieldstack/core`, `@fieldstack/controls`)
  3. Relative imports (`./`, `../`)
  - Always use `import type` when importing types/interfaces.
- **Naming Conventions**:
  - Components / Types / Interfaces: `PascalCase`
  - Hooks: `useCamelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files / API Routes: `kebab-case`
- **Validation**: Use Zod for schema and input validation.
- **Error Handling**: Never leave empty `catch` blocks. Frontend should present user-friendly errors; backend should throw explicit HTTP statuses. Never log sensitive tokens.
