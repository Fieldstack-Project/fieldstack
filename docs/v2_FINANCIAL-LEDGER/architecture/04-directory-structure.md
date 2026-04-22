# 디렉터리 구조

## 전체 구조

```
fieldstack/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── .env.example
├── README.md
│
├── packages/                    # 공유 코드
│   └── core/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── auth/           # 인증
│           ├── db/             # DB 추상화
│           ├── types/          # 공통 타입
│           ├── utils/          # 유틸리티
│           ├── ui/             # UI 컴포넌트
│           └── integrations/   # 통합 서비스
│
├── apps/                        # 애플리케이션
│   ├── api/                    # Backend API Server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config/
│   │       ├── middleware/
│   │       ├── loader/         # 모듈 로더
│   │       └── plugins/        # 백엔드 플러그인
│   │
│   └── web/                    # Frontend React App
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── router/
│           ├── loader/         # 모듈 로더
│           ├── layouts/
│           └── pages/
│
├── modules/                     # 기능 모듈
│   ├── default/                # 내장 튜토리얼
│   │   ├── module.json
│   │   └── frontend/
│   │
│   ├── ledger/                 # 가계부
│   │   ├── module.json
│   │   ├── README.md
│   │   ├── frontend/
│   │   │   ├── index.tsx
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── backend/
│   │   │   ├── index.ts
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   └── schema.ts
│   │   └── types/
│   │
│   └── subscription/           # 구독 관리
│       ├── module.json
│       ├── README.md
│       ├── frontend/
│       ├── backend/
│       └── types/
│
└── docs/                        # 문서
    ├── README.md
    ├── architecture/
    ├── technical/
    ├── modules/
    ├── ui/
    ├── marketplace/
    ├── deployment/
    ├── community/
    └── roadmap/
```

---

## packages/core

Core 레이어: 모든 모듈이 의존하는 공통 기능

### packages/core/auth
```
auth/
├── index.ts              # Export
├── oauth.ts              # Google OAuth
├── session.ts            # 세션 관리
├── whitelist.ts          # 접근 제어
└── types.ts              # 타입 정의
```

**역할:**
- Google OAuth 인증
- Whitelist 기반 접근 제어
- 세션 관리

### packages/core/db
```
db/
├── index.ts              # DB 추상화 인터페이스
├── providers/
│   ├── postgres.ts       # PostgreSQL
│   ├── sqlite.ts         # SQLite
│   ├── supabase.ts       # Supabase
│   └── mongodb.ts        # MongoDB
├── migrations/           # 마이그레이션
└── types.ts
```

**역할:**
- 다양한 DB Provider 지원
- 통일된 인터페이스 제공
- 자동 마이그레이션

### packages/core/types
```
types/
├── api.ts                # API 타입
├── user.ts               # 사용자 타입
├── module.ts             # 모듈 타입
├── integration.ts        # 통합 서비스 타입
└── index.ts              # Export
```

**역할:**
- 공통 타입 정의
- Frontend/Backend 공유

### packages/core/utils
```
utils/
├── date.ts               # 날짜 유틸
├── format.ts             # 포맷팅
├── validation.ts         # 검증
├── encryption.ts         # 암호화
└── index.ts
```

**역할:**
- 공통 유틸리티 함수
- 재사용 가능한 로직

### packages/core/ui
```
ui/
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── Card.tsx
│   ├── Tabs.tsx
│   ├── Form.tsx
│   ├── DatePicker.tsx
│   ├── JsonViewer.tsx
│   └── RawDataViewer.tsx
├── layouts/
│   ├── PageLayout.tsx
│   ├── FormLayout.tsx
│   └── ListLayout.tsx
├── hooks/
│   ├── useForm.ts
│   ├── useModal.ts
│   └── useTable.ts
└── index.ts
```

**역할:**
- 공통 UI 컴포넌트
- 일관된 디자인 시스템
- 모듈에서 재사용

### packages/core/integrations
```
integrations/
├── base.ts               # 통합 기본 클래스
├── security.ts           # 토큰 암호화
├── google/
│   ├── calendar.ts
│   ├── drive.ts
│   ├── sheets.ts
│   └── gmail.ts
├── notion/
│   └── index.ts
├── slack/
│   └── index.ts
└── webhook.ts            # 커스텀 Webhook
```

**역할:**
- 외부 서비스 통합
- Provider 추상화
- API Key 관리

---

## apps/api

Backend API Server

### apps/api/src
```
src/
├── index.ts              # 메인 서버
├── config/
│   ├── env.ts           # 환경 변수
│   └── settings.ts      # 설정 관리
├── middleware/
│   ├── auth.ts          # 인증 미들웨어
│   ├── error.ts         # 에러 핸들러
│   └── maintenance.ts   # 유지보수 모드
├── loader/
│   └── index.ts         # 모듈 로더
├── routes/
│   ├── install.ts       # 설치 마법사 API
│   ├── modules.ts       # 모듈 관리 API
│   └── settings.ts      # 설정 API
└── plugins/
    ├── scheduler/       # 스케줄러
    └── ai/              # AI 서비스
```

**주요 파일:**

**index.ts** - 서버 진입점입니다. Express 앱을 생성하고 미들웨어를 등록한 후, 모듈을 로드합니다. 그 다음 라우트를 등록하고 서버를 시작합니다.

**loader/index.ts** - 모듈 자동 로딩을 담당합니다. modules/ 폴더를 스캔하여 각 모듈의 module.json을 파싱합니다. 활성화 상태를 확인한 후, 활성화된 모듈의 Backend를 로드하고 API 라우트를 등록합니다.

---

## apps/web

Frontend React App

### apps/web/src
```
src/
├── main.tsx             # React 진입점
├── App.tsx              # 메인 앱
├── router/
│   └── index.tsx        # 라우팅
├── loader/
│   └── index.ts         # 모듈 로더
├── layouts/
│   ├── MainLayout.tsx   # 메인 레이아웃
│   └── AuthLayout.tsx   # 인증 레이아웃
├── pages/
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Install/         # 설치 마법사
│   │   ├── Welcome.tsx
│   │   ├── Configuration.tsx
│   │   ├── Progress.tsx
│   │   └── Complete.tsx
│   └── settings/
│       ├── AISettings.tsx
│       ├── DatabaseSettings.tsx
│       └── Updates.tsx
└── services/
    ├── api.ts           # API 클라이언트
    └── marketplace.ts   # 마켓플레이스 API
```

**주요 파일:**

**loader/index.ts** - 프론트엔드 모듈 자동 로딩을 담당합니다. modules/ 폴더를 스캔하여 각 모듈의 Frontend 컴포넌트를 로드합니다. 로드된 컴포넌트로 라우트와 네비게이션 메뉄를 자동으로 생성합니다.

---

## modules/

기능 모듈들

### 모듈 구조 (표준)
```
modules/[module-name]/
├── module.json          # 모듈 메타데이터
├── README.md            # 모듈 설명
├── frontend/
│   ├── index.tsx       # Frontend 진입점
│   ├── pages/          # 페이지 컴포넌트
│   ├── components/     # 재사용 컴포넌트
│   └── hooks/          # 커스텀 Hooks
├── backend/
│   ├── index.ts        # Backend 진입점
│   ├── routes.ts       # API 라우트
│   ├── service.ts      # 비즈니스 로직
│   ├── schema.ts       # DB 스키마
│   └── validation.ts   # 검증 로직
└── types/
    └── index.ts        # 타입 정의
```

### module.json
```json
{
  "name": "ledger",
  "version": "1.0.0",
  "displayName": "가계부",
  "description": "수입/지출 관리",
  "enabled": true,
  "dependencies": [],
  "routes": {
    "frontend": "/ledger",
    "api": "/api/ledger"
  },
  "repository": "https://github.com/author/module-ledger",
  "author": {
    "name": "작성자 이름",
    "email": "author@example.com",
    "url": "https://example.com"
  }
}
```

---

## docs/

문서 폴더

```
docs/
├── README.md                     # 문서 인덱스
├── architecture/                 # 아키텍처 문서
│   ├── 00-overview.md
│   ├── 01-decisions.md
│   ├── 02-core-principles.md
│   ├── 03-resilience-operations.md
│   └── 04-directory-structure.md
├── technical/                    # 기술 문서
│   ├── 00-tech-stack.md
│   ├── 01-database.md
│   └── 03-ai-integration.md
├── modules/                      # 모듈 문서
│   ├── 03-system-design.md
│   └── 01-development-guide.md
├── deployment/                   # 배포 문서
│   ├── 01-installation.md
│   └── 02-setup-wizard.md
└── community/                    # 커뮤니티 문서
    ├── 00-philosophy.md
    └── 01-contributing.md
```

---

## 설정 파일

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### package.json (루트)
```json
{
  "name": "my-finance-system",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel dev",
    "dev:api": "pnpm --filter api dev",
    "dev:web": "pnpm --filter web dev",
    "build": "pnpm --recursive build"
  }
}
```

### docker-compose.yml
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - FIRST_RUN=true
```

---

## 파일 명명 규칙

### TypeScript/JavaScript
- **컴포넌트**: PascalCase (Button.tsx, UserProfile.tsx)
- **함수/유틸**: camelCase (formatDate.ts, validateEmail.ts)
- **타입/인터페이스**: PascalCase (User.ts, ApiResponse.ts)
- **상수**: UPPER_SNAKE_CASE (MAX_LENGTH, API_URL)

### 폴더
- **kebab-case**: module-name, user-settings
- **camelCase**: 예외적으로 React 컴포넌트 폴더

### 모듈
- **kebab-case**: ledger, subscription, crypto-tracker
