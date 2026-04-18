# 설치 가이드

Fieldstack의 공식 설치 방법입니다. 환경에 맞는 방법을 선택하세요.

---

## 📋 목차

1. [Docker AIO (권장)](#1-docker-aio-권장) - 표준, 가장 쉬운 방법
2. [PM2 (Docker 불가 환경)](#2-pm2-docker-불가-환경) - Docker 없이 실행
3. [공통 설정](#3-공통-설정) - 환경 변수, 리버스 프록시
4. [Cloudflare Tunnel 연동](#4-cloudflare-tunnel-연동) - 외부 접속 (IP 노출 없이)
5. [Native/systemd (비공식)](#5-nativesystemd-비공식) - git clone 직접 실행

> **Cloudflare Workers/Pages 배포**는 별도 문서(`02-setup-wizard.md`)를 참고하세요.
> Docker AIO 기준 릴리즈보다 업데이트가 늦을 수 있으며, 준(準)지원으로 분류됩니다.

---

## 1. Docker AIO (권장)

홈서버, NAS(TrueNAS SCALE, Synology), VPS 등 Docker가 지원되는 모든 환경에서 동작합니다.
단일 이미지로 앱과 DB를 모두 포함하는 AIO(All-In-One) 방식입니다.

### 설치 순서

```bash
# docker-compose.yml 다운로드
curl -O https://raw.githubusercontent.com/fieldstack-project/fieldstack/main/docker-compose.yml

# 실행
docker-compose up -d

# 브라우저 접속 → 설치 마법사 자동 시작
# http://localhost:3000
```

### docker-compose.yml (SQLite — 기본)

```yaml
services:
  app:
    image: fieldstack/fieldstack:latest
    ports:
      - "3000:3000"
    volumes:
      - fieldstack_data:/app/data
      - fieldstack_modules:/app/modules
    environment:
      - NODE_ENV=production
      - DB_PROVIDER=sqlite
    restart: unless-stopped

volumes:
  fieldstack_data:
  fieldstack_modules:
```

### docker-compose.yml (PostgreSQL — 선택)

```yaml
services:
  app:
    image: fieldstack/fieldstack:latest
    ports:
      - "3000:3000"
    volumes:
      - fieldstack_modules:/app/modules
    environment:
      - NODE_ENV=production
      - DB_PROVIDER=postgres
      - DATABASE_URL=postgresql://fieldstack:password@db:5432/fieldstack
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=fieldstack
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=fieldstack
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fieldstack"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  fieldstack_modules:
  postgres_data:
```

---

## 2. PM2 (Docker 불가 환경)

Docker를 설치할 수 없는 환경(공유 호스팅, 저사양 기기 등)을 위한 방법입니다.

### 설치 순서

```bash
# 1. 소스 준비
git clone https://github.com/fieldstack-project/fieldstack.git
cd fieldstack
pnpm install
pnpm build

# 2. PM2 설치 (전역)
npm install -g pm2

# 3. 실행
pm2 start apps/api/dist/index.js --name fieldstack

# 4. 재부팅 시 자동 실행 등록
pm2 startup
pm2 save
```

### ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'fieldstack',
    script: 'dist/index.js',
    cwd: './apps/api',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_PROVIDER: 'sqlite',   // 또는 'postgres'
    }
  }]
};
```

> DB는 SQLite(기본) 또는 별도 설치한 PostgreSQL의 연결 URL을 환경 변수로 지정한다.

---

## 3. 공통 설정

어떤 배포 방식을 선택하든 적용되는 공통 설정입니다.

### 환경 변수 (.env)

```bash
# 기본 설정
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 배포 모드 (통합/분리)
SERVE_FRONTEND=true

# 데이터베이스 (기본: SQLite)
DB_PROVIDER=sqlite
# DB_PROVIDER=postgres
# DATABASE_URL=postgresql://user:pass@localhost:5432/db

# 인증
JWT_SECRET=your-secure-secret
```

### Nginx 리버스 프록시 (선택)

외부 접속을 위해 Nginx를 앞단에 두는 경우의 설정 예시입니다.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### SSL 인증서 (Certbot)

```bash
sudo certbot --nginx -d your-domain.com
```

---

## 4. Cloudflare Tunnel 연동

집 서버를 외부에 공개할 때 IP 노출 없이 안전하게 접속하는 방법입니다.
자신이 소유하고 Cloudflare에서 관리되는 도메인이 필요합니다.

| 구분 | IP 직접 공유 | Cloudflare Tunnel |
|------|------------|-------------------|
| 공유 주소 | `집IP:3000` | `fieldstack.내도메인.com` |
| 집 IP 노출 | 노출됨 | 숨김 |
| 포트포워딩 | 필요 | 불필요 |
| SSL/HTTPS | 직접 설정 | 자동 무료 |

### Docker AIO + Cloudflare Tunnel

기존 `docker-compose.yml`에 `cloudflared` 서비스만 추가합니다.

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    environment:
      - CLOUDFLARE_TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    restart: unless-stopped
    depends_on:
      - app
```

`.env`에 토큰 추가 후 재실행:
```bash
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token-here
docker-compose up -d
```

### PM2 + Cloudflare Tunnel

```bash
# cloudflared 설치 (Linux)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

# PM2로 상시 실행 등록
pm2 start "cloudflared tunnel run --token your-token" --name cloudflared
pm2 save
```

### 터널 토큰 발급

1. [Cloudflare Zero Trust 대시보드](https://one.dash.cloudflare.com/) 접속
2. `Networks → Tunnels → Create a tunnel`
3. `Cloudflared` 선택 → 터널 이름 입력 → 토큰 복사
4. `Public Hostname`: `fieldstack.내도메인.com` → `http://localhost:3000`

---

## 5. Native/systemd (비공식)

> **공식 지원 아님.** 안정성 보장 없음. AIO 이미지 제공 없음.

직접 빌드해서 실행하는 방식으로, Docker나 PM2를 사용할 수 없는 환경에서 참고용으로 제공합니다.

```bash
git clone https://github.com/fieldstack-project/fieldstack.git
cd fieldstack
pnpm install && pnpm build
node apps/api/dist/index.js
```

systemd 서비스로 등록하려면 `/etc/systemd/system/fieldstack.service`를 직접 작성하세요. 업데이트 및 유지보수는 전적으로 사용자 책임입니다.