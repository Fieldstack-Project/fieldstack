# 기술 스택

## Backend

### 런타임 & 언어
- **Node.js** 20+
- **TypeScript** 5.0+

### 프레임워크
- **Express** 또는 **Fastify**
  - REST API
  - Middleware 시스템
  - 라우팅
  - **정적 파일 서빙** (프로덕션)

### 데이터베이스
**다중 Provider 지원:**
- **PostgreSQL** (권장) - 고성능, 안정적
- **SQLite** - 간단한 배포, 파일 기반
- **Supabase** - 클라우드 DB, 무료 티어
- **MongoDB** - NoSQL 옵션

**ORM/쿼리 빌더:**
- **Prisma** 또는 **TypeORM**
  - 타입 안전성
  - 마이그레이션 관리
  - Multi-provider 지원

### 인증
- **Passport.js**
  - Google OAuth 2.0
  - 전략 패턴
- **JWT** - 세션 관리

### 검증
- **Zod** 또는 **Yup**
  - 스키마 검증
  - TypeScript 통합

### 스케줄링
- **node-cron**
  - Cron 표현식
  - 백그라운드 작업

### 파일 처리
- **Multer** - 파일 업로드
- **Sharp** - 이미지 처리

---

## Frontend

### 런타임 & 언어
- **React** 18+
- **TypeScript** 5.0+

### 빌드 도구
- **Vite**
  - 빠른 개발 서버
  - HMR (Hot Module Replacement)
  - 최적화된 프로덕션 빌드

### 상태 관리
- **Zustand** 또는 **React Query**
  - 간단한 API
  - TypeScript 지원
  - 서버 상태 관리

### 라우팅
- **React Router** v6
  - 선언적 라우팅
  - Nested Routes
  - Lazy Loading

### 스타일링
- **Tailwind CSS**
  - Utility-first
  - 커스터마이징 용이
  - 작은 번들 크기

### UI 컴포넌트
**자체 개발 (packages/core/ui):**
- Button, Input, Select
- Modal, Table, Card
- Form, DatePicker
- JsonViewer, RawDataViewer

### 폼 관리
- **React Hook Form**
  - 성능 최적화
  - 검증 통합
  - TypeScript 지원

### HTTP 클라이언트
- **Axios** 또는 **Fetch API**
  - Interceptors
  - 에러 핸들링

### 날짜 처리
- **date-fns** 또는 **Day.js**
  - 경량
  - 모듈화
  - i18n 지원

---

## 프로덕션 아키텍처

### 홈서버 모드 (통합)

```
┌─────────────────────────────────────┐
│   사용자 (브라우저)                  │
└─────────────────────────────────────┘
              ↓
       http://localhost:3000
              ↓
┌─────────────────────────────────────┐
│   Express Server (Node.js)          │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  /api/* → Backend Routes    │  │
│   │  - REST API                 │  │
│   │  - WebSocket                │  │
│   │  - File Upload              │  │
│   └─────────────────────────────┘  │
│                                     │
│   ┌─────────────────────────────┐  │
│   │  /* → Static Files (React)  │  │
│   │  - index.html               │  │
│   │  - /assets/*.js             │  │
│   │  - /assets/*.css            │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Database (PostgreSQL/SQLite)      │
└─────────────────────────────────────┘
```

**폴더 구조:**
```
apps/api/
├── dist/              # Backend (컴파일된 JS)
│   ├── index.js
│   ├── routes/
│   └── services/
└── public/            # Frontend (정적 파일)
    ├── index.html
    └── assets/
        ├── index-[hash].js
        └── index-[hash].css
```

**장점:**
- 단일 포트 (3000)
- 간단한 배포
- 낮은 리소스
- CORS 불필요

### 개발 모드 (분리)

```
┌────────────────┐      ┌────────────────┐
│  Frontend      │      │  Backend       │
│  (Vite)        │─────→│  (Express)     │
│  :5173         │ API  │  :3000         │
└────────────────┘      └────────────────┘
      ↓                         ↓
  Hot Reload             Auto Restart
```

**실행:**
```bash
# Terminal 1
pnpm dev:web    # Vite → :5173

# Terminal 2
pnpm dev:api    # Express → :3000
```

**장점:**
- 빠른 개발
- 핫 리로드
- 독립적 재시작

### 분리 배포 모드 (고급)

```
┌──────────────────────────────────┐
│   CDN (Cloudflare Pages/Vercel) │
│   Frontend 정적 파일              │
└──────────────────────────────────┘
              ↓ API 요청
┌──────────────────────────────────┐
│   Backend Server (Railway/VPS)  │
│   Express API                    │
└──────────────────────────────────┘
              ↓
┌──────────────────────────────────┐
│   Database                       │
└──────────────────────────────────┘
```

**장점:**
- CDN 최적화
- 글로벌 배포
- 높은 확장성

**단점:**
- CORS 설정 필요
- 복잡한 배포

---

## Monorepo

### 패키지 매니저
- **pnpm**
  - 빠른 설치
  - 디스크 공간 절약
  - Workspace 지원

### 워크스페이스 구조
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### 빌드 도구
- **Turborepo** (선택)
  - 병렬 빌드
  - 캐싱
  - 의존성 그래프

---

## AI 통합

### 지원 Provider
- **Google Gemini**
  - gemini-pro
  - gemini-pro-vision
- **OpenAI**
  - gpt-4
  - gpt-3.5-turbo
- **Anthropic Claude**
  - claude-3-opus
  - claude-3-sonnet
- **Ollama** (로컬)
  - llama2
  - mistral

### SDK
- `@google/generative-ai`
- `openai`
- `@anthropic-ai/sdk`

---

## 외부 서비스 통합

### Google Services
- **googleapis** SDK
  - Calendar API
  - Drive API
  - Sheets API
  - Gmail API
  - Tasks API

### 기타 통합
- **@notionhq/client** - Notion
- **@slack/web-api** - Slack
- **@octokit/rest** - GitHub

---

## 배포

### 컨테이너화
- **Docker**
  - Multi-stage builds
  - 최적화된 이미지
- **Docker Compose**
  - 로컬 개발
  - 프로덕션 배포

### 플랫폼
- **Railway**
  - GitHub 연동
  - 자동 배포
  - 무료 티어
- **Cloudflare Pages**
  - 정적 사이트
  - Workers (서버리스)
  - D1 (DB), R2 (Storage)
- **Self-hosted**
  - VPS
  - 온프레미스
  - Raspberry Pi
  - Proxmox LXC

### CI/CD
- **GitHub Actions**
  - 자동 테스트
  - 자동 배포
  - 보안 스캔

---

## 개발 도구

### 코드 품질
- **ESLint**
  - 코드 스타일
  - 버그 방지
- **Prettier**
  - 코드 포맷팅
  - 일관성
- **TypeScript**
  - 타입 체크
  - 컴파일 타임 에러

### 테스팅
- **Vitest**
  - 단위 테스트
  - Vite 통합
- **React Testing Library**
  - 컴포넌트 테스트
  - 사용자 중심
- **Playwright** (선택)
  - E2E 테스트
  - 크로스 브라우저

### Git Hooks
- **Husky**
  - Pre-commit hooks
  - 코드 품질 보장

### 버전 관리
- **Semantic Versioning**
  - MAJOR.MINOR.PATCH
  - 명확한 변경 사항

---

## 보안

### 암호화
- **bcrypt** - 비밀번호 해싱
- **crypto** (Node.js 내장) - 토큰 암호화

### 환경 변수
- **dotenv**
  - .env 파일 관리
  - 민감 정보 분리

### CORS
- **cors** middleware
  - Origin 제어
  - 보안 헤더
  - **자동 설정** (통합 모드에서는 비활성화)

### Rate Limiting
- **express-rate-limit**
  - API 요청 제한
  - DDoS 방지

---

## 모니터링 & 로깅

### 로깅
- **Winston** 또는 **Pino**
  - 구조화된 로그
  - 다양한 Transport
  - 로그 레벨

### 에러 추적
- **Sentry** (선택)
  - 실시간 에러 모니터링
  - 스택 트레이스
  - 릴리즈 추적

---

## 문서화

### API 문서
- **OpenAPI (Swagger)**
  - REST API 스펙
  - 자동 생성

### 사이트 생성
- **Docusaurus**
  - React 기반
  - MDX 지원
  - 버전 관리
  - 검색 기능

---

## 성능 최적화

### 캐싱
- **node-cache** - 메모리 캐시
- **Redis** (선택) - 분산 캐시

### 압축
- **compression** middleware
  - Gzip/Brotli
  - 대역폭 절약

### 번들 최적화
- **Vite**
  - Tree shaking
  - Code splitting
  - Lazy loading
  - **Asset hashing** (캐시 버스팅)

### 정적 파일 캐싱
```typescript
// Express 설정
app.use(express.static('public', {
  maxAge: '1y',           // 1년 캐시
  etag: true,
  lastModified: true,
  immutable: true
}));
```

---

## 배포 환경별 설정

### 개발 환경 (.env.development)

```env
NODE_ENV=development
PORT=3000
SERVE_FRONTEND=false

# Frontend는 Vite가 별도로 서빙
# Backend는 API만 제공
```

### 프로덕션 통합 (.env.production)

```env
NODE_ENV=production
PORT=3000
SERVE_FRONTEND=true

# Backend가 Frontend + API 모두 서빙
# 단일 포트
```

### 프로덕션 분리 (.env.production.separated)

```env
NODE_ENV=production
PORT=3000
SERVE_FRONTEND=false
CORS_ORIGIN=https://my-frontend.vercel.app

# Backend는 API만
# Frontend는 별도 CDN
```

---

## 의존성 정책

### Core 의존성
**최소화 원칙:**
- 필수 라이브러리만 포함
- 검증된 라이브러리 사용
- 정기적인 보안 업데이트

### 모듈 의존성
**자유로운 선택:**
- 모듈별 독립적 관리
- 필요한 라이브러리 자유롭게 추가

---

## 버전 요구사항

### 필수
- Node.js: >=20.0.0
- pnpm: >=8.0.0
- TypeScript: >=5.0.0
- React: >=18.0.0

### 권장
- PostgreSQL: >=14.0
- Docker: >=24.0

---

## 리소스 사용량

### 최소 요구사항
- **CPU**: 1 core
- **RAM**: 512 MB
- **Storage**: 1 GB

### 권장 사양
- **CPU**: 2+ cores
- **RAM**: 2 GB
- **Storage**: 10 GB

### 벤치마크 (통합 모드)

| 환경 | 메모리 | CPU | 동시 접속 |
|------|--------|-----|-----------|
| Raspberry Pi 4 (4GB) | 450MB | 15% | 10명 |
| VPS (2GB) | 800MB | 10% | 50명 |
| Dedicated (8GB) | 1.5GB | 5% | 200명+ |

---

## 라이선스

### 프로젝트
- **MIT License**
  - 상업적 이용 가능
  - 수정/재배포 자유

### 의존성
- MIT, Apache 2.0 호환 라이선스만 사용
- GPL 계열 의존성 제외 (전염성 방지)

---

## 기술 선택 이유

### Express vs Fastify
**Express 선택:**
- 안정성 (더 오래된 프로젝트)
- 풍부한 플러그인 생태계
- 정적 파일 서빙 내장

### TypeScript
- 타입 안전성
- IDE 자동완성
- 리팩토링 용이

### Vite
- 빠른 개발 서버
- 최적화된 프로덕션 빌드
- React와 완벽한 통합

### Tailwind CSS
- Utility-first 접근
- 작은 번들 크기
- 커스터마이징 용이

### pnpm
- 빠른 설치 속도
- 디스크 공간 절약
- Workspace 지원

---

## 향후 고려사항

### 성능
- [ ] Redis 캐싱
- [ ] CDN 통합
- [ ] HTTP/2 지원

### 기능
- [ ] WebSocket 실시간 통신
- [ ] Progressive Web App (PWA)
- [ ] 오프라인 지원

### 인프라
- [ ] Kubernetes 지원
- [ ] 분산 데이터베이스
- [ ] 로드 밸런싱