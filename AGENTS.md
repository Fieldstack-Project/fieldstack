# AGENTS.md - Fieldstack Development Guide

> **Project Status**: Planning/Documentation Phase (Implementation: 2026-2027)  
> This repository currently contains design documents and specifications for the Fieldstack modular productivity framework.

---

## 📋 Project Overview

**Fieldstack** is an open-source, self-hosted modular framework for personal productivity and finance management.

- **Tech Stack (Planned)**:
  - **Backend**: TypeScript + Node.js (MVP/Initial) → Go (Release)
  - **Frontend**: React 18+ + TypeScript + Vite
  - **Database**: PostgreSQL (default) / SQLite / Supabase / MongoDB
  - **Monorepo**: pnpm workspace
  - **Deployment**: Docker / Railway / Cloudflare

- **Repository Type**: Monorepo with modular architecture
- **License**: MIT

---

## 🏗️ Project Structure

```
fieldstack/
├── docs/                           # All documentation
│   ├── v2_FINANCIAL-LEDGER/       # Main design docs
│   │   ├── README.md              # Project overview (Korean)
│   │   ├── architecture/          # Architecture decisions & design
│   │   ├── technical/             # Tech stack, database, AI, auth
│   │   ├── modules/               # Module system & development guide
│   │   ├── ui/                    # Design system & components
│   │   ├── marketplace/           # Module marketplace specs
│   │   ├── deployment/            # Installation & deployment
│   │   ├── community/             # Contributing & philosophy
│   │   ├── roadmap/               # Development plans
│   │   └── drafts/                # Work-in-progress specs
│   └── legacy_archive/            # Archived legacy docs
├── .git/                          # Git repository
├── README.md                      # Public-facing README (English)
├── README_ko.md                   # Korean README (empty)
├── TODO.md                        # Project TODOs (empty)
├── LICENSE                        # MIT License
└── .env.example                   # Environment variables template
```

**Note**: There is **NO source code** in this repository yet. Implementation will follow these specifications.

---

## 🚀 Build/Lint/Test Commands

**Current State**: No build system implemented yet.

**Planned Commands** (from tech-stack.md):

```bash
# Development (when implemented)
pnpm dev:web        # Vite dev server (port 5173)
pnpm dev:api        # Express backend (port 3000)

# Production build
pnpm build          # Build all packages
pnpm start          # Start production server

# Testing (planned: Vitest + React Testing Library)
pnpm test                 # Run all tests
pnpm test:unit           # Unit tests only
pnpm test:e2e            # E2E tests (Playwright)
pnpm test:watch          # Watch mode

# Linting (planned: ESLint + Prettier)
pnpm lint                # Lint all code
pnpm lint:fix            # Auto-fix issues
pnpm format              # Format with Prettier

# Type checking
pnpm typecheck           # TypeScript type checking
```

---

## 📚 Documentation Language

- **Primary Language**: Korean (한국어)
  - All design documents in `/docs/v2_FINANCIAL-LEDGER/` are in Korean
  - Internal development standards and specifications are in Korean
- **Secondary Language**: English
  - Public-facing README files
  - Community-contributed documentation

**For AI Agents**: When reading documentation, expect Korean content. Context should be clear from technical terms and code examples.

---

## 🎯 Core Architecture Principles

### 1. Modular Design (WordPress/VSCode Extension Model)

**Core / Module / Plugin Separation**:
- **Core**: Minimal, stable, rarely changes. System infrastructure only.
- **Module**: Independent features (ledger, subscription, TODO, projects)
- **Plugin**: Experimental extensions

**Key Rule**: Modules are **completely self-contained**:
```
modules/my-module/
├── module.json          # Metadata
├── frontend/            # React components
├── backend/             # Express routes + services
├── types/               # Shared TypeScript types
└── README.md
```

- ✅ DO: Keep all module code in one folder (frontend + backend together)
- ❌ DON'T: Split by layer (apps/api/features/, apps/web/pages/)

### 2. Privacy-First & Self-Hosted

- **NO SaaS**: This is a framework, not a service
- **NO Data Collection**: User data stays on user's infrastructure
- **NO Telemetry**: No usage statistics, no API key collection
- **User Controls Everything**: Database, API keys, OAuth, integrations

### 3. Completely Free & Open Source

- ❌ NO Premium Features
- ❌ NO Paid Modules
- ❌ NO Usage Limits
- ❌ NO Ads
- ✅ MIT License for everything

### 4. File Upload Handling Policy

**Core** only recognizes and forwards file uploads. It does NOT:
- Interpret file meaning
- Parse file contents directly
- Take responsibility for processing results

**Modules** are responsible for:
- Validation, parsing, storage, and processing of uploaded files
- All file-related business logic

---

## 💻 Code Style Guidelines (Planned)

### TypeScript

**Strictness**:
```typescript
// tsconfig.json (planned)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Type Definitions**:
- ✅ Prefer `interface` for object shapes (extensible)
- ✅ Use `type` for unions, intersections, utilities
- ❌ NEVER use `any`, `@ts-ignore`, `@ts-expect-error`
- ✅ Define types in `types/index.ts` within each module

**Example**:
```typescript
// types/index.ts
export interface MyModuleItem {
  id: string
  userId: string
  name: string
  description?: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateMyModuleItemDto {
  name: string
  description?: string
  amount: number
}

export type UpdateMyModuleItemDto = Partial<CreateMyModuleItemDto>
```

### Imports

**Order** (enforced by ESLint):
1. External libraries (React, Express, etc.)
2. Internal packages (`@fieldstack/core`, `@fieldstack/ui`)
3. Relative imports (./components, ../hooks)

**Style**:
```typescript
// ✅ Good
import { useState, useEffect } from 'react'
import { Router } from 'express'
import { db, eventBus } from '@fieldstack/core'
import { Button, Input } from '@fieldstack/ui'
import { useMyModule } from '../hooks/useMyModule'
import type { MyModuleItem } from '../types'

// ❌ Bad - mixed order
import { useMyModule } from '../hooks/useMyModule'
import { useState } from 'react'
import { db } from '@fieldstack/core'
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `MyComponent.tsx` |
| **Hooks** | camelCase with `use` prefix | `useMyModule.ts` |
| **Services** | camelCase | `myService.ts` |
| **Types/Interfaces** | PascalCase | `MyModuleItem` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| **Files** | kebab-case or PascalCase | `my-component.tsx` or `MyComponent.tsx` |
| **API Routes** | kebab-case | `/api/my-module` |

### Error Handling

**Backend**:
```typescript
// ✅ Good - explicit error handling
router.get('/', async (req, res) => {
  try {
    const items = await service.list(req.user.id)
    res.json(items)
  } catch (error) {
    logger.error('Failed to fetch items:', error)
    res.status(500).json({ error: 'Failed to fetch items' })
  }
})

// ❌ Bad - empty catch block
router.get('/', async (req, res) => {
  try {
    const items = await service.list(req.user.id)
    res.json(items)
  } catch (e) {
    // Silent failure
  }
})
```

**Frontend**:
```typescript
// ✅ Good - user-friendly error messages
const createItem = async (data: CreateDto) => {
  try {
    const response = await axios.post('/api/my-module', data)
    showNotification({ type: 'success', message: '생성되었습니다' })
    return response.data
  } catch (error) {
    showNotification({ type: 'error', message: '생성에 실패했습니다' })
    throw error
  }
}
```

### Validation

**Use Zod** for all input validation:
```typescript
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  amount: z.number().positive()
})

export const validateCreate = (req, res, next) => {
  try {
    createSchema.parse(req.body)
    next()
  } catch (error) {
    res.status(400).json({ error: error.errors })
  }
}
```

---

## 🧩 Module Development Pattern

### Backend Structure

```typescript
// backend/index.ts - Entry point
import router from './routes'

export default router

export const initialize = async () => {
  // Run DB migrations
  await db.migrate('./migrations')
  
  // Register scheduled tasks
  scheduler.register('my-module-daily-task', '0 0 * * *', async () => {
    // Daily task logic
  })
  
  // Subscribe to events
  eventBus.on('user:created', handleNewUser)
}

export const shutdown = async () => {
  eventBus.off('user:created', handleNewUser)
}
```

### Frontend Structure

```typescript
// frontend/index.tsx - Entry point
import { Routes, Route } from 'react-router-dom'
import List from './pages/List'
import Detail from './pages/Detail'
import Create from './pages/Create'

export default function MyModuleApp() {
  return (
    <Routes>
      <Route path="/" element={<List />} />
      <Route path="/:id" element={<Detail />} />
      <Route path="/create" element={<Create />} />
    </Routes>
  )
}

// Navigation metadata
export const navigation = {
  label: '내 모듈',
  icon: '🎯',
  path: '/my-module'
}
```

### State Management

**Planned**: Zustand or React Query

```typescript
// hooks/useMyModule.ts
import { useState, useEffect } from 'react'
import axios from 'axios'

export const useMyModule = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/my-module')
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  return { items, loading, refresh: fetchItems }
}
```

---

## 🎨 UI/UX Guidelines

### Use Core Components

**From `@fieldstack/ui`** (to be implemented):
- `<Button>`, `<Input>`, `<Select>`, `<Modal>`
- `<DataTable>`, `<Card>`, `<PageLayout>`, `<FormLayout>`
- `<JsonViewer>`, `<RawDataViewer>`

**Styling**: Tailwind CSS utility-first approach

```tsx
// ✅ Good - use core components
import { Button, Input, PageLayout } from '@fieldstack/ui'

export default function MyPage() {
  return (
    <PageLayout title="내 모듈">
      <Input label="이름" required />
      <Button variant="primary">저장</Button>
    </PageLayout>
  )
}

// ❌ Bad - custom styled components without reason
import styled from 'styled-components'

const CustomButton = styled.button`
  background: blue;
  // ...custom styles
`
```

---

## 🔒 Security & Best Practices

### Authentication

- **Planned**: Passport.js + JWT
- **Google OAuth 2.0** for user login
- User ID should be passed to all service functions

```typescript
// ✅ Good - always scope to user
const items = await service.list(req.user.id)

// ❌ Bad - global query (security risk)
const items = await db.query('SELECT * FROM items')
```

### Environment Variables

Use `.env` files (never commit them):
```bash
# .env.example (committed)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/fieldstack
JWT_SECRET=your-secret-here
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Rate Limiting

**Planned**: `express-rate-limit` for API protection

---

## 🧪 Testing Guidelines

### Backend Tests (Vitest)

```typescript
// backend/__tests__/service.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import * as service from '../service'

describe('MyModule Service', () => {
  beforeEach(async () => {
    // Initialize test DB
  })

  it('should create item', async () => {
    const item = await service.create('user-id', {
      name: 'Test',
      amount: 1000
    })
    
    expect(item.name).toBe('Test')
    expect(item.amount).toBe(1000)
  })
})
```

### Frontend Tests (React Testing Library)

```typescript
// frontend/__tests__/List.test.tsx
import { render, screen } from '@testing-library/react'
import List from '../pages/List'

it('should render list page', () => {
  render(<List />)
  expect(screen.getByText('내 모듈')).toBeInTheDocument()
})
```

---

## 📦 Module Best Practices

### ✅ DO

- Use Core UI components from `@fieldstack/ui`
- Define clear TypeScript types in `types/index.ts`
- Handle errors explicitly (never silent failures)
- Only access data scoped to the current user
- Use Event Bus for inter-module communication
- Write tests for critical paths
- Keep modules self-contained

### ❌ DON'T

- Import other modules directly (use Event Bus)
- Pollute global state
- Hard-code values (use config/env variables)
- Access other modules' database tables
- Log sensitive information (passwords, tokens)
- Use `any`, `@ts-ignore`, `@ts-expect-error`

---

## 🔄 Git Workflow

**Conventional Commits** (planned):
```bash
feat: add CSV import for ledger module
fix: resolve date parsing issue in subscription
docs: update module development guide
chore: upgrade dependencies
refactor: simplify authentication flow
```

**Branch Strategy**:
- `main` - stable releases
- `develop` - integration branch
- `feature/xyz` - new features
- `fix/xyz` - bug fixes

---

## 📖 Key Documentation Files

### Must-Read Before Development

1. **Architecture**:
   - `docs/v2_FINANCIAL-LEDGER/architecture/core-principles.md` - Core design philosophy
   - `docs/v2_FINANCIAL-LEDGER/architecture/decisions.md` - Architecture decisions
   - `docs/v2_FINANCIAL-LEDGER/architecture/directory-structure.md` - Project structure

2. **Technical**:
   - `docs/v2_FINANCIAL-LEDGER/technical/tech-stack.md` - Full tech stack details
   - `docs/v2_FINANCIAL-LEDGER/technical/database.md` - Database abstraction layer
   - `docs/v2_FINANCIAL-LEDGER/technical/authentication.md` - Auth implementation

3. **Module Development**:
   - `docs/v2_FINANCIAL-LEDGER/modules/development-guide.md` - Complete module dev guide
   - `docs/v2_FINANCIAL-LEDGER/modules/system-design.md` - Module system design

4. **UI/UX**:
   - `docs/v2_FINANCIAL-LEDGER/ui/core-components.md` - UI component library
   - `docs/v2_FINANCIAL-LEDGER/ui/design-system.md` - Design system specs

---

## 🚨 Important Reminders for AI Agents

1. **No Implementation Yet**: This repository contains only documentation and specifications. When asked to implement features, refer to the design docs first.

2. **Language**: Most documentation is in Korean. When generating code or documentation, follow the existing language patterns.

3. **Module-First Thinking**: Always consider if a feature belongs in Core or a Module. Default to Module unless it's absolutely system-critical.

4. **Privacy is Non-Negotiable**: Never suggest features that collect user data, phone home, or require central servers.

5. **Refer to Docs**: When uncertain about architecture decisions, check `docs/v2_FINANCIAL-LEDGER/architecture/decisions.md` first.

6. **Self-Contained Modules**: Each module must work independently. No cross-module imports.

---

## 🔗 Resources

- **GitHub**: https://github.com/fieldstack-project/fieldstack
- **Discord**: https://discord.gg/5m4aHKmWgg
- **Docs** (planned): https://docs.fieldstack.dev
- **Marketplace** (planned): https://marketplace.fieldstack.dev

---

**Last Updated**: 2026-02-03  
**Document Version**: 1.0.0  
**Project Phase**: Planning/Documentation
