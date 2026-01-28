# 빌드 프로세스

## 개요

Finance System은 **환경에 따라 자동으로** 최적의 빌드 모드를 선택합니다.

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
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // 개발 서버 설정
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  
  // 빌드 설정
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@core/ui']
        }
      }
    }
  }
});
```

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

```javascript
#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function copyFrontend() {
  const source = path.join(__dirname, '../apps/web/dist');
  const target = path.join(__dirname, '../apps/api/public');
  
  console.log('📦 Copying frontend to backend...');
  console.log(`   From: ${source}`);
  console.log(`   To:   ${target}`);
  
  try {
    // 기존 public 폴더 제거
    await fs.remove(target);
    
    // Frontend dist를 Backend public으로 복사
    await fs.copy(source, target);
    
    console.log('✅ Frontend copied successfully!');
    
    // 파일 목록 출력
    const files = await fs.readdir(target);
    console.log(`   Files: ${files.length}`);
    
  } catch (error) {
    console.error('❌ Error copying frontend:', error);
    process.exit(1);
  }
}

copyFrontend();
```

---

## Backend 서버 구현

### apps/api/src/index.ts

```typescript
import express from 'express';
import path from 'path';
import { config } from './config/env';
import { corsMiddleware } from './middleware/cors';
import { logger } from '@core/logger';
import apiRoutes from './routes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

// API 라우트
app.use('/api', apiRoutes);

// 프론트엔드 서빙 (프로덕션 통합 모드)
if (config.isProd && config.serveFrontend) {
  setupFrontendServing(app);
}

function setupFrontendServing(app: express.Application) {
  const publicPath = path.join(__dirname, '../public');
  
  // 정적 파일 체크
  if (!fs.existsSync(publicPath)) {
    logger.error(`❌ Frontend files not found at ${publicPath}`);
    logger.error('   Please run: pnpm build');
    process.exit(1);
  }
  
  // 정적 파일 서빙
  app.use(express.static(publicPath, {
    maxAge: config.isProd ? '1y' : '0',
    etag: true,
    lastModified: true,
    index: false  // index.html은 SPA fallback에서 처리
  }));
  
  // SPA fallback (모든 non-API 요청을 index.html로)
  app.get('*', (req, res, next) => {
    // API 요청은 제외
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    res.sendFile(path.join(publicPath, 'index.html'));
  });
  
  logger.info(`
  ╔══════════════════════════════════════════╗
  ║  🌐 Frontend Serving: ENABLED           ║
  ║  📂 Static files: ${publicPath}         ║
  ║  🎯 SPA fallback: index.html            ║
  ╚══════════════════════════════════════════╝
  `);
}

// 서버 시작
app.listen(config.port, () => {
  logger.info(`
  ╔══════════════════════════════════════════╗
  ║  🚀 Finance System Server                ║
  ║  📍 Port: ${config.port}                 ║
  ║  🔧 Mode: ${config.nodeEnv}              ║
  ║  🌐 Frontend: ${config.serveFrontend ? 'Integrated' : 'Separate'} ║
  ║  🔗 URL: http://localhost:${config.port} ║
  ╚══════════════════════════════════════════╝
  `);
  
  if (!config.serveFrontend) {
    logger.info(`
  💡 Frontend is served separately.
     Make sure your frontend is running on a different port
     and CORS is properly configured.
    `);
  }
});
```

### apps/api/src/config/env.ts

```typescript
export const config = {
  // 환경
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  
  // 서버
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  
  // 프론트엔드 서빙
  serveFrontend: process.env.SERVE_FRONTEND !== 'false',
  
  // CORS
  corsOrigin: getCorsOrigin(),
  
  // 데이터베이스
  dbProvider: process.env.DB_PROVIDER || 'sqlite',
  databaseUrl: process.env.DATABASE_URL,
  
  // 인증
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
};

function getCorsOrigin() {
  if (config.isDev) {
    return 'http://localhost:5173';  // Vite dev server
  }
  
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }
  
  // 프로덕션 통합 모드에서는 CORS 불필요
  return false;
}
```

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

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // 번들 분석
    rollupOptions: {
      output: {
        manualChunks(id) {
          // node_modules를 vendor로 분리
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    
    // 압축
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // console.log 제거
        drop_debugger: true
      }
    }
  }
});
```

### 3. 이미지 최적화

```bash
# 정적 이미지 압축
pnpm add -D vite-plugin-imagemin

# vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    react(),
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: false }
        ]
      }
    })
  ]
});
```

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

```javascript
// scripts/verify-build.js

const fs = require('fs');
const path = require('path');

function verifyBuild() {
  const checks = [
    {
      name: 'Frontend build',
      path: 'apps/web/dist/index.html',
      required: true
    },
    {
      name: 'Backend build',
      path: 'apps/api/dist/index.js',
      required: true
    },
    {
      name: 'Frontend in Backend',
      path: 'apps/api/public/index.html',
      required: true
    }
  ];
  
  let failed = false;
  
  checks.forEach(check => {
    const exists = fs.existsSync(path.join(__dirname, '..', check.path));
    const status = exists ? '✅' : '❌';
    
    console.log(`${status} ${check.name}: ${check.path}`);
    
    if (check.required && !exists) {
      failed = true;
    }
  });
  
  if (failed) {
    console.error('\n❌ Build verification failed!');
    process.exit(1);
  }
  
  console.log('\n✅ Build verification passed!');
}

verifyBuild();
```

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