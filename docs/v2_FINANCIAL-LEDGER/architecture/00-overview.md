# 아키텍처 개요

> 📌 **핵심 결정 사항:**  
> → `architecture/01-decisions.md` - 모든 아키텍처 결정의 근거

**최종 업데이트:** 2025-01-29

---

## 전체 아키텍처

```
Client (Web / App)
   ↓
Core Layer
 ├ Auth (Email/Password + TOTP + Passkey + Optional OAuth)
 ├ DB Connector (Multi-provider)
 ├ Module Loader (런타임 동적 로드) ← 📖 decisions.md #1
 ├ Event Bus
 ├ AI Abstraction
 └ Common UI Components
   ↓
Modules (자동 로드)
 ├ Frontend (React Components)
 └ Backend (API Routes)
   ↓
Plugins (Optional)
```

> 📖 **Core 설계 원칙:**  
> → `architecture/02-core-principles.md`

> 📖 **디렉터리 구조:**  
> → `architecture/04-directory-structure.md`

> 📖 **탄력성 운영 아키텍처:**  
> → `architecture/03-resilience-operations.md`

---

## 배포 아키텍처

Fieldstack은 **환경을 자동으로 감지**하여 최적의 모드로 실행됩니다.

> ⚠️ **중요:**  
> 배포 모드는 `NODE_ENV`와 `SERVE_FRONTEND` 환경 변수로 자동 결정됩니다.  
> 사용자가 수동으로 선택할 필요가 없습니다.

### 📊 배포 모드 비교표

| 특징 | 홈서버 (통합) | 개발 | 분리 배포 |
|------|--------------|------|----------|
| **대상** | 일반 사용자 | 개발자 | 대규모 |
| **서버** | 1개 | 2개 | 2개+ |
| **포트** | 3000 | 5173, 3000 | 다양 |
| **복잡도** | ⭐ 낮음 | ⭐⭐ 낮음 | ⭐⭐⭐ 높음 |
| **리소스** | 512MB | 1GB | 2GB+ |
| **CORS** | ❌ 불필요 | ✅ 자동 | ⚙️ 설정 필요 |
| **배포** | Docker 1개 | pnpm dev | 복잡 |
| **확장성** | 중간 | - | 높음 |

---

### 모드 1: 홈서버 모드 (통합) - 권장 ⭐

**Proxmox/TrueNAS와 동일한 방식**

```
┌─────────────────────────────────────────────┐
│   사용자 (브라우저)                          │
│   http://192.168.0.10:3000                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   Docker Container / Node.js Process        │
│                                             │
│   ┌───────────────────────────────────┐    │
│   │   Express Server (단일 프로세스)   │    │
│   │                                   │    │
│   │   ┌─────────────────────────┐    │    │
│   │   │  /api/*                 │    │    │
│   │   │  - REST API             │    │    │
│   │   │  - WebSocket            │    │    │
│   │   │  - Module Routes        │    │    │
│   │   └─────────────────────────┘    │    │
│   │                                   │    │
│   │   ┌─────────────────────────┐    │    │
│   │   │  /* (SPA Fallback)      │    │    │
│   │   │  - Static Files         │    │    │
│   │   │  - index.html           │    │    │
│   │   │  - assets/*.js/css      │    │    │
│   │   └─────────────────────────┘    │    │
│   └───────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   Database (PostgreSQL/SQLite)              │
│   - User Data                               │
│   - Module Data                             │
│   - System Config                           │
└─────────────────────────────────────────────┘
```

#### 작동 원리

**환경 변수:**
```env
NODE_ENV=production
SERVE_FRONTEND=true  # 기본값
```

**Express 서버 구현:**

프로덕션 환경에서 SERVE_FRONTEND가 'false'가 아니면 통합 모드로 실행됩니다. API 라우트는 항상 활성화되어 /api 경로를 처리합니다.

프론트엔드 서빙은 두 단계로 구성됩니다. 첫째로 express.static 미들웨어로 public 폴더의 정적 파일을 서빙합니다. 캐시 유효기간은 1년으로 설정하고 etag도 활성화합니다. 둘째로 SPA fallback 라우트가 있어, /api로 시작하지 않는 모든 요청에 대해 index.html을 반환합니다. 이렇게 하면 React Router가 클라이언트 측에서 라우팅을 처리할 수 있습니다.

#### 파일 구조

```
apps/api/
├── dist/              # Backend (컴파일된 JS)
│   ├── index.js
│   ├── routes/
│   └── services/
└── public/            # Frontend (정적 파일) ← 빌드 시 자동 복사
    ├── index.html
    └── assets/
        ├── index-[hash].js
        ├── index-[hash].css
        └── ...
```

> 📖 **빌드 프로세스 상세:**  
> → `deployment/98-build-process.md`

#### 특징

✅ **장점:**
- 단일 포트 (3000)
- 단일 프로세스
- 낮은 리소스 (512MB RAM)
- 간단한 배포
- CORS 불필요

⚠️ **제한:**
- 확장성 제한 (단일 서버)
- CDN 최적화 불가

#### 권장 대상

- 📱 개인 홈서버
- 🏠 Raspberry Pi
- 💻 NAS (Synology, TrueNAS)
- 🖥️ VPS (1-2GB RAM)
- 🔧 Proxmox LXC 컨테이너

> 📖 **홈서버 배포 가이드:**  
> → `deployment/01-installation.md § 1. Docker 버전`

---

### 모드 2: 개발 모드 (분리)

```
┌──────────────────┐          ┌──────────────────┐
│   Frontend       │          │   Backend        │
│   (Vite)         │          │   (Express)      │
│   :5173          │          │   :3000          │
│                  │   API    │                  │
│   - HMR          │──────────│   - Auto Restart │
│   - Dev Server   │          │   - TypeScript   │
└──────────────────┘          └──────────────────┘
        ↓                             ↓
    Hot Reload                  DB Connection
```

#### 작동 원리

**환경 변수:**
```env
NODE_ENV=development
# SERVE_FRONTEND은 무시됨
```

**실행:**
```bash
# Terminal 1: Frontend
pnpm dev:web
# → http://localhost:5173

# Terminal 2: Backend
pnpm dev:api
# → http://localhost:3000
```

**Vite Proxy 설정:**

Vite 개발 서버를 포트 5173에서 실행하며, /api 경로로 향하는 요청을 localhost:3000의 백엔드로 프록시합니다. changeOrigin을 true로 설정하여 Origin 헤더를 백엔드 주소로 바꾸는 것입니다.

#### 특징

✅ **장점:**
- 빠른 개발
- 독립적 재시작
- 핫 리로드 (HMR)
- CORS 자동 처리 (Vite proxy)

⚠️ **단점:**
- 2개 터미널 필요
- 프로덕션 환경 아님

#### 권장 대상

- 💻 로컬 개발 환경
- 👨‍💻 모듈 개발자
- 🐛 디버깅 작업

> 📖 **개발 환경 설정:**  
> → `modules/01-development-guide.md`

---

### 모드 3: 분리 배포 모드 (고급)

```
┌─────────────────────────────────────┐
│   Frontend (CDN)                    │
│   https://my-app.vercel.app         │
│   - Static Files                    │
│   - Global Distribution             │
└─────────────────────────────────────┘
              ↓ (CORS)
┌─────────────────────────────────────┐
│   Backend API (VPS/Railway)         │
│   https://api.my-app.com            │
│   - REST API                        │
│   - WebSocket                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Database                          │
└─────────────────────────────────────┘
```

#### 작동 원리

**Backend 환경 변수:**
```env
NODE_ENV=production
SERVE_FRONTEND=false
CORS_ORIGIN=https://my-app.vercel.app
```

**CORS 설정:**

cors 미들웨어를 사용하여 CORS_ORIGIN 환경 변수의 값만 허용된 Origin으로 설정합니다. credentials를 true로 놓아 쿠키와 인증 헤더를 포함한 요청도 허용합니다.

#### 특징

✅ **장점:**
- CDN 최적화
- 높은 확장성
- 글로벌 배포

⚠️ **단점:**
- CORS 설정 필요
- 복잡한 배포
- 2개 서비스 관리

#### 권장 대상

- 🌍 대규모 트래픽
- 🚀 글로벌 서비스
- 💼 엔터프라이즈

> 📖 **분리 배포 가이드:**  
> → `deployment/01-installation.md § 2. Cloudflare 버전`

---

## Core Layer

> 📌 **설계 원칙:**  
> → `architecture/02-core-principles.md § 2. Core / Module / Plugin 분리`

### 역할
- 인프라 레이어 (절대 최소 변경)
- 모듈이 의존하는 공통 기능 제공
- 안정성 최우선

### 구성 요소

#### Auth
> 📖 → `technical/02-authentication.md`

- **이메일/비밀번호 로그인** - 기본 로그인
- **TOTP 2FA** - 추가 보안(관리자 필수 권장)
- **Passkey/WebAuthn** - Passwordless 옵션
- **Google OAuth** - 선택 로그인
- **Whitelist 기반 접근 제어** - 허용된 사용자만
- **관리자 PIN** - 중요 설정 보호

> 📌 **핵심 결정:**  
> → `architecture/01-decisions.md § 결정 #2: 관리자 인증`

#### DB Connector
> 📖 → `technical/01-database.md`

- **다양한 DB Provider 지원**
  - PostgreSQL, SQLite, Supabase, MongoDB
- **Query Builder 방식** 추상화
- **자동 마이그레이션**

> 📌 **핵심 결정:**  
> → `architecture/01-decisions.md § 결정 #3: DB 추상화`

#### Module Loader
> 📖 → `modules/01-development-guide.md`

- **런타임 동적 Import** - 서버 재시작 불필요
- **VSCode 확장 방식** - 설치 후 자동 새로고침
- **Hot Reload** - 개발 모드 지원

> 📌 **핵심 결정:**  
> → `architecture/01-decisions.md § 결정 #1: Module Loader`

#### Event Bus

모듈 간 통신은 이벤트 발행/구독 패턴으로 느슨한 결합을 유지합니다. 예를 들어 Subscription 모듈에서 'subscription:payment' 이벤트를 발행하면, Ledger 모듈이 그 이벤트를 구독하여 자동으로 가계부 항목을 생성합니다.

#### AI Abstraction
> 📖 → `technical/03-ai-integration.md`

- **Provider 추상화** (Gemini, OpenAI, Claude, Ollama)
- **사용자 API Key 관리**
- **통일된 인터페이스**

#### Common UI Components
> 📖 → `ui/02-core-components.md`

- Button, Input, Table, Modal 등
- Layout 컴포넌트
- 공통 Hooks
- 일관된 디자인 시스템

---

## Module Layer

> 📖 **상세 가이드:**  
> → `modules/03-system-design.md`  
> → `modules/01-development-guide.md`

### 특징
- 실제 기능 단위
- 독립적으로 개발/배포 가능
- 폴더 단위로 추가/제거
- Core에 의존하지만 다른 모듈에는 의존하지 않음

### 구조
```
modules/[module-name]/
├── module.json          # 메타데이터
├── frontend/           # UI (React)
├── backend/            # API (Express)
└── types/              # 타입 정의
```

### 생명주기
1. 모듈 스캔 (Module Loader)
2. module.json 검증
3. 의존성 체크
4. 활성화 상태 확인
5. Frontend/Backend 로드 (런타임 동적 Import)
6. 라우트 등록
7. WebSocket으로 Frontend 알림 → 자동 새로고침

> 📌 **VSCode 방식 구현:**  
> → `architecture/01-decisions.md § 결정 #1`

---

## Plugin Layer

### 역할
- 실험적 기능
- 백그라운드 작업 (Scheduler, AI 등)
- 깨져도 Core/Module에 영향 없음

### 예시
> 📖 → `technical/04-scheduler.md`

- **Scheduler**: 정기 작업 실행
- **AI Assistant**: 백그라운드 분석
- **Backup**: 자동 백업

---

## 데이터 흐름

### 1. 사용자 요청 (홈서버 모드)

```
사용자 → http://localhost:3000/ledger
         ↓
  Express Server
         ↓
    /ledger 경로인가?
         ↓
    API 요청? (아니오)
         ↓
    정적 파일 존재? (아니오)
         ↓
    SPA Fallback → index.html 반환
         ↓
    브라우저에서 React 실행
         ↓
    React Router가 /ledger 렌더링
```

### 2. API 요청

```
사용자 → fetch('/api/ledger/entries')
         ↓
    Express Server
         ↓
    /api/ledger/entries 라우트 매칭
         ↓
    Backend Service 실행
         ↓
    DB 쿼리 (Query Builder)
         ↓
    JSON 응답 반환
```

### 3. 모듈 간 통신
```
Module A → Event Bus → Module B
```

직접 import 금지, Event Bus로만 통신

### 4. 통합 서비스 사용
> 📖 → `modules/02-integrations.md`

```
Module → Core Integration → External API
                ↓
         (Google, Notion, etc.)
```

---

## 확장성

### 수평 확장
- 모듈 추가로 기능 확장
- 기존 코드 수정 불필요

### 수직 확장
- Core 업그레이드
- 모든 모듈이 자동으로 혜택

### 부하 분산 (선택)

```
┌─────────────┐
│   Nginx     │
│  (LB)       │
└─────────────┘
    ↓  ↓  ↓
┌───┐┌───┐┌───┐
│ 1 ││ 2 ││ 3 │  ← Fieldstack 인스턴스
└───┘└───┘└───┘
    ↓
┌─────────────┐
│   Database  │
└─────────────┘
```

---

## 보안 모델

> 📖 **상세 보안 정책:**  
> → `technical/02-authentication.md § 보안 고려사항`

### 계층별 보안

**Core Layer**
- 인증/인가 처리 (로컬 로그인 + 선택 OAuth + 관리자 PIN)
- API Key 암호화
- 세션 관리

**Module Layer**
- Permissions 체크
- 사용자 본인 데이터만 접근
- DB 테이블 격리

**Plugin Layer**
- Sandbox 실행
- 제한된 권한

### 네트워크 보안 (홈서버)

```
인터넷
  ↓
방화벽 (포트 제한)
  ↓
리버스 프록시 (HTTPS)
  ↓
Fieldstack (:3000)
  ↓
내부 DB (외부 접근 차단)
```

---

## 성능 고려사항

### 모듈 로딩
- **Lazy Loading** - 필요한 모듈만 로드
- **런타임 동적 Import** - 서버 재시작 불필요
- **Hot Reload** - 개발 시 빠른 피드백

### 정적 파일 캐싱 (홈서버 모드)

express.static 미들웨어로 public 폴더을 서빙합니다. 캐시 유효기간은 1년으로 설정하고, etag과 lastModified를 활성화하여 조건부 요청을 지원합니다. immutable 옵션도 켜서 해시가 포함된 파일명의 캐시를 더 효과적으로 활용합니다.

### DB 최적화
> 📖 → `technical/01-database.md § 성능 최적화`

- Connection Pooling
- 쿼리 최적화
- 인덱싱

### 메모리 관리

PM2 클러스터 모드로 실행합니다. 앱 이름은 'finance-system'이고, CPU 코어 수만큼 인스턴스를 생성합니다. 클러스터 실행 모드로 설정하고, 단일 프로세스의 메모리가 1GB를 초과하면 자동으로 재시작합니다.

---

## 에러 처리

### 계층별 에러 처리

**Core**
- 치명적 에러 → 전체 중단
- 복구 불가능

**Module**
- 모듈 에러 → 해당 모듈만 비활성화
- 다른 모듈에 영향 없음

**Plugin**
- 플러그인 에러 → 무시 또는 재시도
- 시스템에 영향 없음

### 에러 응답 (홈서버 모드)

에러 핸들러 미들웨어가 요청 경로를 확인합니다. /api로 시작하는 요청이면 500 상태로 JSON 에러 응답을 반환합니다. 그 외의 요청은 프론트엔드 요청으로 간주하여 index.html을 반환합니다.

---

## 업데이트 전략

> 📖 **상세 가이드:**  
> → `deployment/04-updates.md`

### Core 업데이트
- 하위 호환성 유지
- 주요 변경 시 마이그레이션 가이드

### Module 업데이트
- 독립적으로 업데이트
- 버전 관리

### 자동 업데이트 (홈서버)

```
1. 설정된 시간 (예: 새벽 3시)
   ↓
2. 새 버전 확인
   ↓
3. 활성 사용자 확인
   ↓
4. 백업 생성
   ↓
5. Git pull
   ↓
6. pnpm build
   ↓
7. 서버 재시작
   ↓
8. Health check
```

### 롤백
- Git tag 기반
- DB 백업/복원
- 자동 롤백 지원

---

## 실제 배포 예시

### Raspberry Pi 4 (홈서버)

```bash
# 1. Docker 설치
curl -fsSL https://get.docker.com | sh

# 2. Fieldstack 실행
docker-compose up -d

# 3. 접속
http://raspberrypi.local:3000
```

**리소스 사용:**
- CPU: 15%
- RAM: 450MB
- Storage: 2GB

### VPS (2GB RAM)

```bash
# 1. 수동 설치
git clone https://github.com/Fieldstack-Project/Fieldstack.git
cd finance-system
pnpm install && pnpm build

# 2. PM2로 실행
pm2 start ecosystem.config.js

# 3. 부팅 시 자동 시작
pm2 startup
pm2 save
```

**리소스 사용:**
- CPU: 10%
- RAM: 800MB
- Storage: 5GB

### Proxmox LXC Container

```bash
# LXC 컨테이너 생성 (Ubuntu 22.04)
# 메모리: 2GB
# 스토리지: 10GB

# 컨테이너 내부에서:
apt update && apt install -y nodejs npm git
npm install -g pnpm
git clone https://github.com/Fieldstack-Project/Fieldstack.git
cd finance-system
pnpm install && pnpm build
cd apps/api
node dist/index.js
```

---

## 모니터링 & 헬스 체크

### Health Check Endpoint

GET /health 엔드포인트는 시스템 상태를 조회합니다. 응답에는 전체 상태, 현재 배포 모드(통합 또는 api-only), 서버 업타임, 프로세스 메모리 사용량, 데이터베이스 연결 상태, 로드된 모듈 상태가 포함됩니다.

### 모니터링 (선택)

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

---

## 백업 전략

> 📖 **상세 가이드:**  
> → `deployment/01-installation.md`

### 홈서버 백업

```bash
#!/bin/bash
# 매일 새벽 2시 실행

# 1. DB 백업
pg_dump finance | gzip > backup_$(date +%Y%m%d).sql.gz

# 2. 파일 백업
tar -czf backup_$(date +%Y%m%d).tar.gz \
  ./data \
  ./modules \
  ./.env

# 3. Google Drive 업로드 (선택)
rclone copy backup_$(date +%Y%m%d).tar.gz gdrive:backups/
```

---

## 📚 관련 문서

### 아키텍처
- 📌 `architecture/01-decisions.md` - 핵심 결정 사항
- 📖 `architecture/02-core-principles.md` - 설계 원칙
- 📖 `architecture/03-resilience-operations.md` - 장애 대응/복구 운영
- 📖 `architecture/04-directory-structure.md` - 폴더 구조

### 기술
- 📖 `technical/00-tech-stack.md` - 기술 스택
- 📖 `technical/01-database.md` - DB 추상화
- 📖 `technical/02-authentication.md` - 인증 시스템
- 📖 `technical/04-scheduler.md` - Scheduler

### 배포
- 📖 `deployment/01-installation.md` - 설치 가이드
- 📖 `deployment/98-build-process.md` - 빌드 프로세스
- 📖 `deployment/04-updates.md` - 자동 업데이트

### 모듈
- 📖 `modules/03-system-design.md` - 모듈 시스템
- 📖 `modules/01-development-guide.md` - 개발 가이드

---

## 결론

Fieldstack은 **환경에 따라 자동으로 최적화**되는 유연한 아키텍처를 가지고 있습니다:

- **홈서버**: Proxmox처럼 단일 서버로 간단하게 ⭐
- **개발**: 빠른 개발을 위해 분리 실행
- **프로덕션**: 필요에 따라 통합 또는 분리 배포

사용자는 복잡한 설정 없이 **Docker 한 줄**로 시작할 수 있으며, 필요에 따라 고급 설정을 적용할 수 있습니다.

> 💡 **추천:**  
> 처음 시작하시는 분은 **홈서버 모드**로 시작하세요!  
> → `deployment/01-installation.md § 1. Docker 버전`
