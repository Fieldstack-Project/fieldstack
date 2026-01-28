# 아키텍처 개요

## 전체 아키텍처

```
Client (Web / App)
   ↓
Core Layer
 ├ Auth (Google OAuth + Whitelist)
 ├ DB Connector (Multi-provider)
 ├ Module Loader (자동 스캔)
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

---

## 배포 아키텍처

### 홈서버 모드 (권장)

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

**특징:**
- 단일 포트 (3000)
- 단일 프로세스
- 낮은 리소스 (512MB RAM)
- 간단한 배포

**파일 구조:**
```
/home/user/finance-system/
├── data/                  # 사용자 데이터
├── modules/              # 설치된 모듈
└── apps/api/
    ├── dist/             # Backend (JS)
    └── public/           # Frontend (Static)
```

### 개발 모드

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

**실행:**
```bash
# Terminal 1
pnpm dev:web

# Terminal 2
pnpm dev:api
```

**특징:**
- 빠른 개발
- 독립적 재시작
- 핫 리로드

### 분리 배포 모드 (고급)

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

**특징:**
- CDN 최적화
- 높은 확장성
- CORS 설정 필요

---

## Core Layer

### 역할
- 인프라 레이어 (절대 최소 변경)
- 모듈이 의존하는 공통 기능 제공
- 안정성 최우선

### 구성 요소

**Auth**
- Google OAuth 인증
- Whitelist 기반 접근 제어
- 세션 관리

**DB Connector**
- 다양한 DB Provider 지원 (PostgreSQL, SQLite, Supabase, MongoDB)
- 추상화 레이어로 모듈은 DB 종류를 신경쓰지 않음
- 자동 마이그레이션

**Module Loader**
- modules/ 폴더 자동 스캔
- module.json 기반 로드
- 활성화/비활성화 관리
- 의존성 체크

**Event Bus**
- 모듈 간 통신
- 이벤트 발행/구독 패턴
- 느슨한 결합

**AI Abstraction**
- Provider 추상화 (Gemini, OpenAI, Claude, Ollama)
- 사용자 API Key 관리
- 통일된 인터페이스

**Common UI Components**
- Button, Input, Table, Modal 등
- Layout 컴포넌트
- 공통 Hooks
- 일관된 디자인 시스템

---

## Module Layer

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
1. 모듈 스캔
2. module.json 검증
3. 의존성 체크
4. 활성화 상태 확인
5. Frontend/Backend 로드
6. 라우트 등록

---

## Plugin Layer

### 역할
- 실험적 기능
- 백그라운드 작업 (Scheduler, AI 등)
- 깨져도 Core/Module에 영향 없음

### 예시
- Scheduler: 정기 작업 실행
- AI Assistant: 백그라운드 분석
- Backup: 자동 백업

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
    DB 쿼리
         ↓
    JSON 응답 반환
```

### 3. 모듈 간 통신
```
Module A → Event Bus → Module B
```

직접 import 금지, Event Bus로만 통신

### 4. 통합 서비스 사용
```
Module → Core Integration → External API
                ↓
         (Google, Notion, etc.)
```

---

## 서버 구현 (홈서버 모드)

### Express 서버 구조

```typescript
// apps/api/src/index.ts

import express from 'express';
import path from 'path';

const app = express();
const isDev = process.env.NODE_ENV === 'development';
const serveFrontend = process.env.SERVE_FRONTEND !== 'false';

// Middleware
app.use(express.json());
app.use(corsMiddleware);

// API 라우트 (항상 활성화)
app.use('/api', apiRoutes);

// 프론트엔드 서빙 (프로덕션 통합 모드)
if (!isDev && serveFrontend) {
  const publicPath = path.join(__dirname, '../public');
  
  // 정적 파일
  app.use(express.static(publicPath, {
    maxAge: '1y',
    etag: true
  }));
  
  // SPA fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    }
  });
  
  console.log('🌐 Serving Frontend + API (Integrated)');
}

app.listen(3000);
```

### 환경 감지

```typescript
// apps/api/src/config/env.ts

export const config = {
  // 환경
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  
  // 프론트엔드 서빙 여부
  serveFrontend: process.env.SERVE_FRONTEND !== 'false',
  
  // CORS (개발 환경 또는 분리 배포 시)
  corsOrigin: process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173'
    : process.env.CORS_ORIGIN || false,
};
```

**자동 판단:**
- `NODE_ENV=development` → 분리 모드 (CORS 활성화)
- `NODE_ENV=production` → 통합 모드 (Frontend 서빙)
- `SERVE_FRONTEND=false` → 강제 분리 모드

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
│ 1 ││ 2 ││ 3 │  ← Finance System 인스턴스
└───┘└───┘└───┘
    ↓
┌─────────────┐
│   Database  │
└─────────────┘
```

---

## 보안 모델

### 계층별 보안

**Core Layer**
- 인증/인가 처리
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
Finance System (:3000)
  ↓
내부 DB (외부 접근 차단)
```

---

## 성능 고려사항

### 모듈 로딩
- Lazy Loading
- 사용하지 않는 모듈은 로드하지 않음

### 정적 파일 캐싱 (홈서버 모드)

```typescript
app.use(express.static('public', {
  maxAge: '1y',           // 1년 캐시
  etag: true,
  lastModified: true,
  immutable: true
}));
```

### DB 최적화
- Connection Pooling
- 쿼리 최적화
- 인덱싱

### 메모리 관리

```typescript
// PM2 클러스터 모드
module.exports = {
  apps: [{
    name: 'finance-system',
    script: 'dist/index.js',
    instances: 'max',      // CPU 코어 수만큼
    exec_mode: 'cluster',
    max_memory_restart: '1G'
  }]
};
```

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

```typescript
// API 에러
app.use((err, req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(500).json({ error: err.message });
  } else {
    // Frontend 요청은 index.html로
    res.sendFile('public/index.html');
  }
});
```

---

## 업데이트 전략

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

## 배포 시나리오별 비교

| 특징 | 홈서버 | 개발 | 분리 배포 |
|------|--------|------|----------|
| **서버** | 1개 | 2개 | 2개+ |
| **포트** | 3000 | 5173, 3000 | 다양 |
| **복잡도** | 낮음 | 낮음 | 높음 |
| **리소스** | 512MB | 1GB | 2GB+ |
| **CORS** | 불필요 | 자동 | 설정 필요 |
| **배포** | Docker 1개 | pnpm dev | 복잡 |
| **확장성** | 중간 | - | 높음 |
| **권장 대상** | 홈서버 | 개발자 | 대규모 |

---

## 실제 배포 예시

### Raspberry Pi 4 (홈서버)

```bash
# 1. Docker 설치
curl -fsSL https://get.docker.com | sh

# 2. Finance System 실행
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
git clone https://github.com/your-org/finance-system.git
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
git clone https://github.com/your-org/finance-system.git
cd finance-system
pnpm install && pnpm build
cd apps/api
node dist/index.js
```

---

## 모니터링 & 헬스 체크

### Health Check Endpoint

```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    mode: config.serveFrontend ? 'integrated' : 'api-only',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabase(),
    modules: await checkModules()
  };
  
  res.json(health);
});
```

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

## 결론

Finance System은 **환경에 따라 자동으로 최적화**되는 유연한 아키텍처를 가지고 있습니다:

- **홈서버**: Proxmox처럼 단일 서버로 간단하게
- **개발**: 빠른 개발을 위해 분리 실행
- **프로덕션**: 필요에 따라 통합 또는 분리 배포

사용자는 복잡한 설정 없이 **Docker 한 줄**로 시작할 수 있으며, 필요에 따라 고급 설정을 적용할 수 있습니다.