# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Status

Phase 1.95 진행 중 (2026-04-16 기준). Phase 1.9 (API 서버·DB·인증 백엔드·공유 링크) 완료. Phase 1.5 전 항목 완료. Phase 1.95.1 모드 전환 시스템 완료 (`installed.lock` / `fieldstack.config.json` 기반). Phase 1.95.2 Setup 백엔드 API 완료 (Docker/systemd/native 런타임 자동 감지·프로비저닝, SSE 스트리밍). SQLite 제공자 실제 구현 완료(`better-sqlite3`). `@fieldstack/core/browser` 브라우저 전용 엔트리 분리 완료 — 웹 앱은 반드시 이 경로로 import.

---

## Commands

```bash
# 개발 서버
pnpm dev              # web + api 병렬 실행 (설치 마법사 포함)
pnpm dev:web          # web만 (port 5173)
pnpm dev:api          # api만 (port 3000)

# 빌드 (web → api → copy-frontend.js로 api/public에 복사)
pnpm build
pnpm start            # 프로덕션 서버 (apps/api/dist/index.js)

# 테스트
pnpm test                                   # 전체
pnpm --filter api test                      # api만
pnpm --filter core test                     # core만
pnpm exec vitest run apps/api/src/loader/index.test.ts  # 단일 파일

# Storybook (controls 컴포넌트 확인)
pnpm storybook         # http://localhost:6007 (port 6006 충돌 시 6007 사용)

# 타입 체크
pnpm typecheck
```

---

## Architecture

### 패키지 구조

```
apps/
  web/     — React 19 + Vite SPA (@fieldstack/web)
  api/     — Node.js + tsx dev server (@fieldstack/api)
packages/
  core/    — 공유 타입·계약·유틸 (@fieldstack/core)
  controls/— UI 컴포넌트 (@fieldstack/controls, P0/P0.5 구현 완료)
modules/   — Phase 2 모듈 (Ledger, Subscription) 위치 예정
```

**모듈 템플릿**: `D:\5. Development\A. Project\Fieldstack-Project\module-template` (WSL: `/mnt/d/5. Development/A. Project/Fieldstack-Project/module-template`) — 프로젝트 루트 외부에 별도 존재. `module.json` 스펙 변경 시 함께 업데이트.

pnpm workspace, `node-linker=hoisted`.

### apps/web — 라우팅 & 상태

- **Hash 기반 라우팅**: `#login` `#otp` `#forgot-password` `#home` `#marketplace` `#admin` `#change-password`
- 모든 라우트 상태 머신은 `apps/web/src/main.tsx`의 `App` 컴포넌트에서 관리 (`effectiveRoute` useMemo).
- 인증 상태는 `sessionStorage`에 `fs_` 접두사 키로 저장 (`fs_auth`, `fs_admin`, `fs_pin_verified` 등).
- **AppShell** (`src/components/AppShell.tsx`): 220px 고정 사이드바 레이아웃. login/otp/forgot-password/change-password는 shell 없이 전체 화면.
- **`@fieldstack/core` import 규칙**: 웹 앱(`apps/web`)에서는 반드시 `@fieldstack/core/browser`로 import. `@fieldstack/core` 직접 import는 Node.js 전용 패키지(jsonwebtoken 등)를 끌어들여 Vite 번들링 오류 발생.

### apps/api — 모듈 로더

- `apps/api/src/loader/index.ts`: `parseModuleJson` → `scanBackendModules` → `buildBackendRouteRegistrations` → `validateModuleDependencies` 순서로 모듈을 스캔·등록.
- 각 모듈은 `module.json` 매니페스트로 식별되며 `enabled: true`인 것만 활성화.
- 프로덕션 빌드 시 `scripts/copy-frontend.js`가 `apps/web/dist`를 `apps/api/public`으로 복사해 단일 서버에서 서빙.

### packages/core

- `auth/` — TOTP, JWT, Whitelist, admin PIN, 비밀번호 복구 계약
- `db/` — DB provider 추상 인터페이스 + PostgreSQL·SQLite·Supabase·MongoDB scaffold + 마이그레이션
- `types/` — API·User·Module·Integration 공통 타입
- `utils/` — 날짜·포맷·검증·암호화

### packages/controls

TypeScript 계약(`ControlDescriptor`, `CONTROL_DESCRIPTORS`)만 선언되어 있고 실제 React 컴포넌트는 없음. P0/P0.5 Control 목록과 구현 상태는 `docs/v2_FINANCIAL-LEDGER/ui/03-control-backlog.md` 기준으로 추적. 구현 시 `apps/web` 인라인 View 스타일이 레퍼런스이며, 확정된 다크 모드 CSS 토큰 시스템 기반으로 작성.

### 스타일

- CSS 커스텀 프로퍼티 기반 다크 모드 디자인 토큰 (`apps/web/src/styles/global.css`).
- 현재 Tailwind 미적용 (계획 중). 현재는 각 View별 CSS 파일 직접 작성.

**CSS 변수명 — 반드시 `global.css` 기준을 사용할 것. `--fs-*` 접두사는 존재하지 않음.**

| 용도 | 변수명 |
|------|--------|
| 배경 (기본) | `--bg` |
| 배경 (카드/서피스) | `--bg-surface` |
| 배경 (보조/elevated) | `--bg-elevated` |
| 배경 (호버) | `--bg-hover` |
| 테두리 | `--border` |
| 테두리 (subtle) | `--border-subtle` |
| 텍스트 (기본) | `--text` |
| 텍스트 (보조) | `--text-muted` |
| 텍스트 (희미) | `--text-faint` |
| 강조색 | `--primary` / `--accent` |
| 성공 | `--ok` |
| 경고 | `--warn` |
| 오류/위험 | `--err` |

> ⚠️ `--fs-border`, `--fs-text-primary`, `--fs-bg-secondary` 등 `--fs-` 접두사 변수는 정의되어 있지 않아 항상 빈 값으로 처리됨. 절대 사용 금지.

---

## Code Conventions

- **TypeScript strict** — `any`, `@ts-ignore`, `@ts-expect-error` 사용 금지.
- **Import 순서**: 외부 라이브러리 → `@fieldstack/*` 내부 패키지 → 상대 경로. `import type` 사용.
- **Prettier**: `printWidth: 100`, `singleQuote: true`, `trailingComma: all`.
- **명명**: 컴포넌트 PascalCase, 훅 `use` + camelCase, 서비스 camelCase, 상수 UPPER_SNAKE_CASE, API 라우트 kebab-case.
- **검증**: Zod 우선.
- **모듈 간 의존성 금지**: 모듈끼리 직접 import 불가, Event Bus 경유.

---

## Key Docs

- `docs/v2_FINANCIAL-LEDGER/roadmap/01-development-plan.md` — 전체 로드맵 및 Phase별 체크리스트
- `docs/v2_FINANCIAL-LEDGER/ui/03-control-backlog.md` — Control 구현 상태 추적
- `docs/v2_FINANCIAL-LEDGER/technical/00-tech-stack.md` — 기술 스택 결정 내역
- `AGENTS.md` — 추가 코드 스타일 및 아키텍처 가이드라인
