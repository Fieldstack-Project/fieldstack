# 배포 전략

## 설치 방법

### 1. Docker Compose (권장)

가장 간단하고 빠른 설치 방법입니다.

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/finance-system.git
cd finance-system

# 2. Docker Compose 실행
docker-compose up -d

# 3. 브라우저 자동 열림
# → http://localhost:3000/install
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./modules:/app/modules
    environment:
      - NODE_ENV=production
      - FIRST_RUN=true
    depends_on:
      - db
    restart: unless-stopped
  
  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=finance
      - POSTGRES_USER=finance
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped

volumes:
  postgres_data:
```

### 2. 수동 설치

더 세밀한 제어가 필요한 경우 수동으로 설치합니다.

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/finance-system.git
cd finance-system

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 4. 빌드
pnpm build

# 5. 서버 시작
pnpm start

# 6. 브라우저 자동 열림
# → http://localhost:3000/install
```

### 3. Railway 원클릭 배포

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/...)

**railway.json:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**배포 후:**
1. Railway가 제공하는 URL로 접속
2. 첫 접속 시 `/install`로 자동 리다이렉트
3. 웹 기반 설치 마법사 진행

### 4. Cloudflare Pages + Workers

**Frontend (Cloudflare Pages):**
```bash
# apps/web 빌드
cd apps/web
pnpm build

# Cloudflare Pages에 배포
npx wrangler pages deploy dist
```

**Backend (Cloudflare Workers):**
```bash
# apps/api를 Workers 형식으로 변환
cd apps/api
pnpm build:workers

# Workers 배포
npx wrangler deploy
```

**wrangler.toml:**
```toml
name = "finance-system-api"
main = "dist/worker.js"
compatibility_date = "2025-01-21"

[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "finance"
database_id = "your-database-id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "finance-uploads"
```

## 시스템 요구사항

### 최소 요구사항

- **CPU**: 1 core
- **RAM**: 512 MB
- **Storage**: 1 GB
- **OS**: Linux, macOS, Windows (WSL)
- **Node.js**: >= 20.0.0
- **pnpm**: >= 8.0.0

### 권장 사양

- **CPU**: 2+ cores
- **RAM**: 2 GB
- **Storage**: 10 GB
- **Database**: PostgreSQL 14+

### 지원 플랫폼

- ✅ Docker (Linux, macOS, Windows)
- ✅ VPS (Ubuntu, Debian, CentOS)
- ✅ Railway
- ✅ Cloudflare (Pages + Workers + D1)
- ✅ Self-hosted (온프레미스)

## 프로덕션 배포

### Nginx 리버스 프록시

```nginx
# /etc/nginx/sites-available/finance-system

server {
    listen 80;
    server_name your-domain.com;
    
    # HTTPS로 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 프록시 설정
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL 인증서 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-nginx

# 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 확인
sudo certbot renew --dry-run
```

### Systemd 서비스

```ini
# /etc/systemd/system/finance-system.service

[Unit]
Description=Finance System
After=network.target

[Service]
Type=simple
User=finance
WorkingDirectory=/opt/finance-system
Environment="NODE_ENV=production"
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**서비스 관리:**
```bash
# 서비스 시작
sudo systemctl start finance-system

# 부팅 시 자동 시작
sudo systemctl enable finance-system

# 상태 확인
sudo systemctl status finance-system

# 재시작
sudo systemctl restart finance-system
```

## 환경 변수

### .env.example

```bash
# === Server ===
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# === Database ===
DB_PROVIDER=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/finance

# 또는 Supabase
# DB_PROVIDER=supabase
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_KEY=xxx

# 또는 MongoDB
# DB_PROVIDER=mongodb
# MONGODB_URI=mongodb://localhost:27017/finance

# === Authentication ===
JWT_SECRET=your-secret-key-change-this
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# === AI (Optional) ===
AI_PROVIDER=gemini
AI_API_KEY=xxx

# === Encryption ===
ENCRYPTION_KEY=your-32-char-encryption-key

# === Admin ===
ADMIN_EMAIL=admin@example.com

# === First Run ===
FIRST_RUN=true
```

## 백업 전략

### 데이터베이스 백업

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="finance"

# PostgreSQL 백업
pg_dump -U finance $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 오래된 백업 삭제 (30일 이상)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

**Cron 설정 (매일 새벽 2시):**
```bash
crontab -e

0 2 * * * /opt/finance-system/backup.sh
```

### 파일 백업

```bash
#!/bin/bash
# backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# modules, data 폴더 백업
tar -czf $BACKUP_DIR/files_$DATE.tar.gz \
    /opt/finance-system/modules \
    /opt/finance-system/data

# 오래된 백업 삭제
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +30 -delete

echo "Files backup completed: files_$DATE.tar.gz"
```

### Google Drive 자동 백업 (선택)

```typescript
// apps/api/src/plugins/backup/drive-backup.ts

import { google } from 'googleapis';
import { scheduler } from '@core/scheduler';

scheduler.register({
  name: 'backup-to-drive',
  schedule: '0 3 * * *',  // 매일 새벽 3시
  handler: async () => {
    // 1. DB 백업 생성
    const backupFile = await createDatabaseBackup();
    
    // 2. Google Drive에 업로드
    const drive = google.drive('v3');
    await drive.files.create({
      requestBody: {
        name: `backup_${Date.now()}.sql.gz`,
        parents: ['backup-folder-id']
      },
      media: {
        body: fs.createReadStream(backupFile)
      }
    });
    
    // 3. 로컬 백업 파일 삭제
    await fs.unlink(backupFile);
  }
});
```

## 모니터링

### Health Check

```typescript
// apps/api/src/routes/health.ts

router.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    
    database: await checkDatabase(),
    modules: await checkModules(),
    disk: await checkDiskSpace(),
    memory: process.memoryUsage()
  };
  
  const isHealthy = checks.database.connected && 
                    checks.disk.available > 1000;
  
  res.status(isHealthy ? 200 : 503).json(checks);
});
```

### 로그 관리

```typescript
// packages/core/logger.ts

import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Uptime 모니터링 (선택)

```yaml
# docker-compose.monitoring.yml

services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma:/app/data
    restart: unless-stopped

volumes:
  uptime-kuma:
```

## 성능 최적화

### Node.js 프로덕션 설정

```bash
# PM2 사용 (프로세스 관리)
npm install -g pm2

# PM2로 실행
pm2 start npm --name "finance-system" -- start

# 클러스터 모드 (멀티 코어 활용)
pm2 start npm --name "finance-system" -i max -- start

# 부팅 시 자동 시작
pm2 startup
pm2 save
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'finance-system',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 데이터베이스 최적화

```sql
-- 인덱스 생성
CREATE INDEX idx_ledger_user_date ON ledger_entries(user_id, date DESC);
CREATE INDEX idx_subscription_user ON subscriptions(user_id);

-- VACUUM (PostgreSQL)
VACUUM ANALYZE;

-- 연결 풀 설정
-- max_connections = 100
-- shared_buffers = 256MB
```

## 보안 체크리스트

- [ ] 환경 변수로 민감 정보 관리
- [ ] HTTPS/SSL 인증서 설정
- [ ] 방화벽 설정 (포트 제한)
- [ ] 정기적인 백업 설정
- [ ] 최신 버전 유지 (보안 패치)
- [ ] Rate limiting 활성화
- [ ] CORS 설정
- [ ] 강력한 JWT_SECRET 사용
- [ ] 데이터베이스 암호 설정
- [ ] Admin 계정 비밀번호 강화

## 트러블슈팅

### 일반적인 문제

**1. 포트 충돌**
```bash
# 포트 사용 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

**2. 데이터베이스 연결 실패**
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U finance -d finance -h localhost
```

**3. 모듈 로드 실패**
```bash
# 로그 확인
tail -f logs/combined.log

# 모듈 재설치
rm -rf modules/problem-module
git clone <repository> modules/problem-module
```

**4. 메모리 부족**
```bash
# 메모리 사용량 확인
free -h

# Node.js 메모리 제한 증가
NODE_OPTIONS="--max-old-space-size=2048" npm start
```