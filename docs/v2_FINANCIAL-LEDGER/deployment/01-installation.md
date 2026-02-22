# 설치 가이드

Fieldstack은 **00-overview.md**에서 정의된 4가지 실행 모델을 지원합니다.
사용 환경에 맞는 방법을 선택하여 설치하세요.

---

## 📋 목차

1. [Docker 버전 (권장)](#1-docker-버전-권장) - 가장 표준적이고 쉬운 방법
2. [Cloudflare 버전](#2-cloudflare-버전) - Cloudflare 클라우드(Pages + Workers + D1) 배포
3. [OS Native 버전](#3-os-native-버전) - Linux 서버 운영자용 (Systemd)
4. [Native (CLI) 버전](#4-native-cli-버전) - Docker 미사용 환경 (PM2)
5. [기타 플랫폼](#5-기타-플랫폼) - Railway 등
6. [공통 설정](#6-공통-설정) - 환경 변수, 리버스 프록시
7. [[초안/미확정] Cloudflare Tunnel — 홈서버 외부 공개](#7-초안미확정-cloudflare-tunnel--홈서버-외부-공개) - 집 IP 노출 없이 지인 공유

---

## 1. Docker 버전 (권장)

가장 권장되는 표준 설치 방법입니다. 홈서버, NAS, VPS 등 대부분의 환경에서 동일하게 동작합니다.

### 1.1 설치 순서

```bash
# 1. 저장소 클론
git clone https://github.com/fieldstack-project/fieldstack.git
cd fieldstack

# 2. Docker Compose 실행
docker-compose up -d

# 3. 브라우저 접속 (자동으로 설치 마법사 시작)
# → http://localhost:3000/install
```

### 1.2 docker-compose.yml 구성

```yaml
version: '3.8'

services:
  app:
    image: fieldstack/core:latest # 또는 build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./modules:/app/modules
    environment:
      - NODE_ENV=production
      - SERVE_FRONTEND=true
      - FIRST_RUN=true
    restart: unless-stopped
```

---

## 2. Cloudflare 버전

Cloudflare의 인프라를 활용하여 **포트 포워딩 없이** 외부에서 안전하게 접속하고 싶은 경우 사용합니다.

### 2.1 구성 요소
- **Frontend**: Cloudflare Pages
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite 호환)

### 2.2 설치 순서

```bash
# 1. Frontend 배포
cd apps/web
pnpm build
npx wrangler pages deploy dist --project-name fieldstack-web

# 2. Backend 배포
cd ../api
pnpm build:workers
npx wrangler deploy
```

### 2.3 wrangler.toml 설정

```toml
name = "fieldstack-api"
main = "dist/worker.js"
compatibility_date = "2025-01-21"

[vars]
SERVE_FRONTEND = "false"
CORS_ORIGIN = "https://your-project.pages.dev"

[[d1_databases]]
binding = "DB"
database_name = "fieldstack-db"
database_id = "your-database-id"
```

---

## 3. OS Native 버전

**Linux 서버 운영자**를 위한 방식입니다. Docker 오버헤드 없이 네이티브 성능을 활용하며, Systemd로 프로세스를 관리합니다.
(Ubuntu/Debian 기준)

### 3.1 필수 요구사항
- Node.js 20+
- pnpm

### 3.2 설치 순서

```bash
# 1. 소스 코드 준비
git clone https://github.com/fieldstack-project/fieldstack.git
cd fieldstack
pnpm install
pnpm build

# 2. 실행 테스트
cd apps/api
node dist/index.js
```

### 3.3 Systemd 서비스 등록

`/etc/systemd/system/fieldstack.service` 파일을 생성합니다.

```ini
[Unit]
Description=Fieldstack Service
After=network.target

[Service]
Type=simple
User=fieldstack
WorkingDirectory=/opt/fieldstack/apps/api
Environment="NODE_ENV=production"
Environment="SERVE_FRONTEND=true"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 활성화 및 시작
sudo systemctl enable fieldstack
sudo systemctl start fieldstack
```

> 참고: systemd는 단일 프로세스 상시 구동에 적합합니다.
> 멀티코어 활용이 필요하면 PM2(클러스터)나 Node.js 클러스터 방식을 고려하세요.

---

## 4. Native (CLI) 버전

Docker를 사용할 수 없는 환경(저사양 기기, 호스팅 제약 등)에서 **PM2**를 사용하여 백그라운드 프로세스로 실행하는 방식입니다.

> 참고: PM2는 멀티프로세스/클러스터 관리에 유리합니다.

### 4.1 설치 및 실행

```bash
# 1. PM2 설치
npm install -g pm2

# 2. 앱 실행
cd apps/api
pm2 start dist/index.js --name "fieldstack"

# 3. 재부팅 시 자동 실행 설정
pm2 startup
pm2 save
```

### 4.2 ecosystem.config.js (PM2 설정)

```javascript
module.exports = {
  apps: [{
    name: 'fieldstack',
    script: 'dist/index.js',
    cwd: './apps/api',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

---

## 5. 기타 플랫폼

### 5.1 Railway (원클릭 배포)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/...)

- Railway 템플릿을 통해 5분 내 배포 가능(Docker Image)
- PostgreSQL 플러그인 자동 연결

---

## 6. 공통 설정

어떤 배포 방식을 선택하든 적용되는 공통 설정입니다.

### 6.1 환경 변수 (.env)

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

### 6.2 Nginx 리버스 프록시 (선택)

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

### 6.3 SSL 인증서 (Certbot)

```bash
sudo certbot --nginx -d your-domain.com
```

---

## 7. [초안/미확정] Cloudflare Tunnel — 홈서버 외부 공개

> **⚠️ 초안/미확정:** 아이디어 검토 단계이며, 정식 기능으로 확정되지 않았습니다.

### 개요

Fieldstack은 어떤 방식(Docker, PM2, systemd)으로 실행하든 기본적으로 **로컬(집 내부 네트워크)에서만 접근 가능**합니다.

지인에게 공유하거나 외부에서 접근하고 싶을 경우, 가장 단순한 방법은 집 IP를 직접 알려주는 것이지만 **보안상 바람직하지 않습니다.** Cloudflare Tunnel(`cloudflared`)을 사용하면 집 IP를 노출하지 않고도 `fieldstack.내도메인.com` 형태로 안전하게 외부 공개가 가능합니다.

다만 이 기능을 사용하려면 자신이 소유한 도메인이 있어야 합니다.<br>
또한 해당 도메인이 **Cloudflare에서 관리**되고 있어야 합니다. 
- Cloudflare에서 직접 구매한 도메인, 또는
- 타사에서 구매 후 네임서버를 Cloudflare로 변경한 도메인

> **주의:** 이 섹션은 [2. Cloudflare 버전](#2-cloudflare-버전)(Cloudflare 클라우드 배포)과 **전혀 다른 개념**입니다.
> - **2번 Cloudflare 버전**: Fieldstack 자체를 Cloudflare 클라우드(Pages + Workers + D1)에 올려서 운영하는 방식
> - **이 섹션(7번)**: Fieldstack은 집/로컬 서버에서 그대로 실행하되, Tunnel을 통해 외부 접근 통로만 안전하게 여는 방식

| 구분 | IP 직접 공유 | Cloudflare Tunnel |
|------|------------|-------------------|
| 공유 주소 | `집IP:3000` | `fieldstack.내도메인.com` |
| 집 IP 노출 | ✅ 노출됨 | ❌ 완전 숨김 |
| 포트포워딩 | 필요 | 불필요 |
| 고정 IP | 필요 | 불필요 |
| SSL/HTTPS | 직접 설정 | 자동 무료 |
| 유동 IP 대응 | DDNS 필요 | 자동 처리 |

---

### 실행 방식별 적용 방법

#### Docker로 실행 중인 경우

`docker-compose.yml`에 `cloudflared` 서비스 하나만 추가하면 됩니다.

```yaml
version: '3.8'

services:
  app:
    image: fieldstack/core:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./modules:/app/modules
    environment:
      - NODE_ENV=production
      - SERVE_FRONTEND=true
    restart: unless-stopped

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
```

```bash
docker-compose up -d
```

---

#### PM2로 실행 중인 경우

`cloudflared`는 Fieldstack과 완전히 독립적으로 동작합니다. PM2로 Fieldstack을 실행 중이라면 `cloudflared`만 별도로 설치해서 실행하면 됩니다.

```bash
# cloudflared 설치 (Linux)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# 터널 실행
cloudflared tunnel run --token your-tunnel-token-here

# PM2로 상시 실행 등록
pm2 start "cloudflared tunnel run --token your-tunnel-token-here" --name "cloudflared"
pm2 save
```

---

#### systemd로 실행 중인 경우

`cloudflared`를 별도 systemd 서비스로 등록합니다.

`/etc/systemd/system/cloudflared.service` 파일 생성:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel run --token your-tunnel-token-here
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

### 터널 토큰 발급 방법

1. [Cloudflare Zero Trust 대시보드](https://one.dash.cloudflare.com/) 접속
2. `Networks → Tunnels → Create a tunnel`
3. `Cloudflared` 선택 후 터널 이름 입력
4. 토큰 복사
5. `Public Hostname` 설정: `fieldstack.내도메인.com` → `http://localhost:3000`