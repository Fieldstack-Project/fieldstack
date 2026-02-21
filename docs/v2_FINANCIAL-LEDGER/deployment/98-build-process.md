# 빌드 프로세스

## 개요

Fieldstack은 **환경에 따라 자동으로** 최적의 빌드 모드를 선택합니다.

---

## 빌드 모드

### 1. 개발 모드 (Development)

**특징:**
- Frontend와 Backend 분리 실행
- 핫 리로드 (Hot Module Replacement)
- 소스맵 포함
- 빠른 빌드

**실행:**
```bash
pnpm dev
```

**구조:**
```
Terminal 1: apps/web (Vite Dev Server)
http://localhost:5173
  - HMR 활성화
  - 소스맵 포함
  - 번들 최적화 안 함

Terminal 2: apps/api (TypeScript + ts-node)
http://localhost:3000
  - 자동 재시작 (nodemon)
  - TypeScript 직접 실행
```

### 2. 프로덕션 통합 모드 (Production Integrated)

**특징:**
- Frontend와 Backend 통합
- 단일 서버
- 최적화된 번들
- 압축 및 캐싱

**빌드:**
```bash
pnpm build
```

**구조:**
```
apps/api/
├── dist/              # Backend (컴파일된 JS)
│   ├── index.js
│   └── ...
└── public/            # Frontend (정적 파일)
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── ...
```

### 3. 프로덕션 분리 모드 (Production Separated)

**특징:**
- Frontend와 Backend 별도 빌드
- CDN 배포 가능
- CORS 설정 필요

**빌드:**
```bash
# Frontend만
pnpm build:web

# Backend만
pnpm build:api
```

---

## 빌드 스크립트

### package.json (루트)

```json
{
  "name": "finance-system",
  "private": true,
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

### Frontend 빌드 (apps/web)

```json
{
  "name": "web",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**vite.config.ts:**

Vite 설정 파일입니다. 플러그인으로 React를 등록합니다. 개발 서버는 포트 5173에서 실행되며, `/api` 경로의 요청은 `http://localhost:3000`으로 프록시됩니다. 빌드 설정에서는 출력 디렉터리를 `dist`로 지정하고, 소스맵은 비활성화합니다. 압축은 terser를 사용하며, rollupOptions의 manualChunks를 통해 `react`, `react-dom`, `react-router-dom`은 `react-vendor`로, `@core/ui`는 `ui-vendor`로 청크를 분리합니다.

### Backend 빌드 (apps/api)

```json
{
  "name": "api",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 빌드 후 처리

### scripts/copy-frontend.js

빌드 후 실행되는 스크립트입니다. `apps/web/dist`(Frontend 빌드 결과물)를 `apps/api/public`로 복사하여 통합 모드에서 Backend가 Frontend 정적 파일을 서빙할 수 있도록 합니다. 복사 전에 기존 `public` 폴더를 먼저 제거하고, `fs-extra`의 `copy`로 복사 후 파일 수를 출력합니다. 복사 중 오류가 발생하면 프로세스를 종료합니다.

---

## Backend 서버 구현

### apps/api/src/index.ts

Express 앱을 생성하고 JSON, URL-encoded 본문 파싱과 CORS 미들웨어를 적용합니다. `/api` 경로에 API 라우트를 등록합니다.

프로덕션 통일 모드에서는 `setupFrontendServing` 함수를 호출하여 Frontend를 서빙합니다. 이 함수는 먼저 `public` 폴더가 존재하는지 확인하고, 없으면 빌드를 안내하며 프로세스를 종료합니다. 존재하면 `express.static`으로 정적 파일을 서빙하며, 프로덕션에서는 캐시 유효기간을 1년으로 설정합니다. `index.html`은 별도의 SPA fallback에서 처리하기 위해 `index: false`로 지정합니다. SPA fallback은 `app.get('*')`로 등록되어, `/api`가 아닌 모든 요청을 `index.html`로 보냅니다.

서버 시작 시 포트, 모드, Frontend 통합 여부와 접속 URL을 로그로 출력합니다. Frontend가 분리 모드인 경우 CORS 설정 필요 안내도 출력합니다.

### apps/api/src/config/env.ts

환경 변수를 읽어 설정 객체로 구성합니다. `NODE_ENV`로부터 개발/프로덕션 여부를 판단하고, `PORT`와 `HOST`를 설정합니다. `SERVE_FRONTEND`가 `'false'`가 아니면 Frontend 서빙을 활성화합니다. CORS origin은 `getCorsOrigin` 함수로 결정되며, 개발 모드에서는 Vite dev server URL(`http://localhost:5173`)을 반환하고, `CORS_ORIGIN` 환경 변수가 있으면 그 값을 사용합니다. 프로덕션 통합 모드에서는 CORS가 불필요하므로 `false`를 반환합니다. 이 외에도 데이터베이스 provider와 URL, JWT secret, Google OAuth 클라이언트 정보도 포함합니다.

---

## Docker 빌드

### Dockerfile (통합 모드)

```dockerfile
# Stage 1: 빌드
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 의존성 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/

# 의존성 설치
RUN pnpm install --frozen-lockfile

# 소스 복사
COPY . .

# 빌드
RUN pnpm build

# Stage 2: 실행
FROM node:20-alpine

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN npm install -g pnpm && \
    pnpm install --prod --frozen-lockfile

# 빌드 결과물 복사
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/public ./apps/api/public
COPY --from=builder /app/packages ./packages

# 환경 변수
ENV NODE_ENV=production
ENV SERVE_FRONTEND=true
ENV PORT=3000

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Dockerfile (분리 모드 - Backend만)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/core/package.json ./packages/core/

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages

RUN pnpm --filter api build

FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN npm install -g pnpm && \
    pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/api/dist ./apps/api/dist

ENV NODE_ENV=production
ENV SERVE_FRONTEND=false
ENV PORT=3000

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

---

## 빌드 최적화

### 1. 캐싱 전략

**.dockerignore:**
```
node_modules
dist
.git
.env
*.log

# 빌드 캐시 유지를 위해 package.json은 제외하지 않음
```

### 2. 번들 크기 최적화

Vite 빌드 설정에서 rollupOptions의 manualChunks 함수를 사용하여 `node_modules`에 포함된 패키지를 모두 `vendor` 청크로 분리합니다. 압축은 terser를 사용하며, terserOptions의 compress 옵션에서 `drop_console: true`로 프로덕션 빌드 시 `console.log`를 제거하고, `drop_debugger: true`로 debugger 문도 제거합니다.

### 3. 이미지 최적화

```bash
# 정적 이미지 압축
pnpm add -D vite-plugin-imagemin
```

Vite 설정에서 `vite-plugin-imagemin`을 플러그인으로 등록합니다. GIF는 gifsicle로 최적화 레벨 7, PNG는 optipng으로 최적화 레벨 7, JPEG는 mozjpeg로 품질 80까지 압축합니다. SVG는 svgo를 사용하며, `removeViewBox`와 `removeEmptyAttrs`는 비활성화하여 호환성을 유지합니다.

---

## CI/CD 빌드

### GitHub Actions

```yaml
# .github/workflows/build.yml

name: Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Test
        run: pnpm test
      
      - name: Build
        run: pnpm build
      
      - name: Check build artifacts
        run: |
          ls -la apps/api/dist
          ls -la apps/api/public
      
      - name: Build Docker image
        run: docker build -t finance-system:${{ github.sha }} .
```

---

## 빌드 검증

### 체크리스트

```bash
# 1. Frontend 빌드 확인
ls -la apps/web/dist
# index.html, assets/ 폴더 존재해야 함

# 2. Backend 빌드 확인
ls -la apps/api/dist
# index.js 등 파일 존재해야 함

# 3. Frontend가 Backend로 복사됐는지 확인
ls -la apps/api/public
# Frontend 파일들이 있어야 함

# 4. 빌드 크기 확인
du -sh apps/web/dist
du -sh apps/api/dist
du -sh apps/api/public

# 5. 실행 테스트
cd apps/api
node dist/index.js
# 에러 없이 시작되어야 함
```

### 자동 검증 스크립트

`scripts/verify-build.js`는 빌드 결과물이 올바르게 생성되었는지 검증합니다. 검증 대상은 세 가지입니다: Frontend 빌드 결과물인 `apps/web/dist/index.html`, Backend 빌드 결과물인 `apps/api/dist/index.js`, 그리고 Frontend가 Backend로 복사된 `apps/api/public/index.html`입니다. 각 경로에 대해 `fs.existsSync`로 파일 존재 여부를 확인하고, 존재하면 ✅, 아니면 ❌로 출력합니다. 세 항목 모두 `required: true`이므로, 하나라도 누락되면 검증 실패로 판단하여 프로세스를 종료합니다.

---

## 트러블슈팅

### Frontend가 표시되지 않음

```bash
# 1. public 폴더 확인
ls -la apps/api/public

# 없으면 다시 빌드
pnpm build

# 2. 환경 변수 확인
echo $SERVE_FRONTEND  # true여야 함
echo $NODE_ENV        # production이어야 함

# 3. 로그 확인
# "Frontend Serving: ENABLED" 메시지가 있어야 함
```

### 빌드 실패

```bash
# 1. 캐시 제거
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm pnpm-lock.yaml

# 2. 재설치
pnpm install

# 3. 다시 빌드
pnpm build
```

### 메모리 부족

```bash
# Node.js 메모리 제한 증가
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```