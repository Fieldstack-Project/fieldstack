## 디렉터리 구조

my-finance-system/
├── .gitignore
├── .env.example
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json              # 루트 TypeScript 설정
├── docker-compose.yml         # 배포 참고용
├── README.md
│
├── packages/                  # 공유 코드
│   └── core/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── auth/         # Google OAuth, Whitelist
│       │   │   ├── index.ts
│       │   │   └── types.ts
│       │   ├── db/           # DB 추상화 레이어
│       │   │   ├── index.ts
│       │   │   ├── providers/
│       │   │   │   ├── postgres.ts
│       │   │   │   ├── supabase.ts
│       │   │   │   └── mongodb.ts
│       │   │   └── types.ts
│       │   ├── types/        # 공통 타입 정의
│       │   │   ├── api.ts
│       │   │   ├── user.ts
│       │   │   └── module.ts
│       │   ├── utils/        # 공통 유틸
│       │   │   ├── date.ts
│       │   │   └── format.ts
│       │   └── ui/           # 공통 UI 컴포넌트
│       │       ├── Button.tsx
│       │       ├── Modal.tsx
│       │       ├── Layout.tsx
│       │       ├── Table.tsx
│       │       └── index.ts
│       └── index.ts          # 전체 export
│
├── apps/
│   ├── api/                  # Backend API Server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts      # 메인 서버 (모듈 자동 로드)
│   │   │   ├── config/
│   │   │   │   └── env.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── error.ts
│   │   │   ├── loader/       # 모듈 자동 로더
│   │   │   │   └── index.ts
│   │   │   └── plugins/      # 백엔드 플러그인
│   │   │       ├── scheduler/
│   │   │       │   └── index.ts
│   │   │       └── ai/
│   │   │           └── index.ts
│   │   └── .env.example
│   │
│   └── web/                  # Frontend React App
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── router/
│       │   │   └── index.tsx
│       │   ├── loader/       # 프론트 모듈 로더
│       │   │   └── index.ts
│       │   ├── layouts/
│       │   │   └── MainLayout.tsx
│       │   └── pages/
│       │       ├── Home.tsx
│       │       └── Login.tsx
│       └── .env.example
│
├── modules/                  # 기능 모듈들
│   ├── ledger/              # 가계부 모듈
│   │   ├── module.json      # 모듈 메타데이터
│   │   ├── README.md
│   │   ├── frontend/
│   │   │   ├── index.tsx    # 모듈 진입점
│   │   │   ├── pages/
│   │   │   │   ├── LedgerList.tsx
│   │   │   │   └── LedgerForm.tsx
│   │   │   ├── components/
│   │   │   │   ├── LedgerCard.tsx
│   │   │   │   └── CategorySelect.tsx
│   │   │   └── hooks/
│   │   │       └── useLedger.ts
│   │   ├── backend/
│   │   │   ├── index.ts     # API 라우트
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   ├── schema.ts    # DB 스키마
│   │   │   └── validation.ts
│   │   └── types/
│   │       └── index.ts     # 모듈 전용 타입
│   │
│   ├── subscription/        # 구독 관리 모듈
│   │   ├── module.json
│   │   ├── README.md
│   │   ├── frontend/
│   │   │   ├── index.tsx
│   │   │   ├── pages/
│   │   │   │   ├── SubList.tsx
│   │   │   │   └── SubForm.tsx
│   │   │   └── components/
│   │   │       └── SubCard.tsx
│   │   ├── backend/
│   │   │   ├── index.ts
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   ├── calendar.ts  # Google Calendar 연동
│   │   │   └── schema.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   └── example/             # 모듈 개발 템플릿
│       ├── module.json
│       ├── README.md
│       ├── frontend/
│       ├── backend/
│       └── types/
│
└── docs/                    # 문서
    ├── architecture.md
    ├── module-guide.md      # 모듈 개발 가이드
    └── deployment.md        # 배포 가이드