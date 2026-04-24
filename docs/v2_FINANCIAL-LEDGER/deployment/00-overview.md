# Fieldstack 실행 및 배포 전략 정리

## 개요
Fieldstack는 **셀프호스트 가능한 SaaS형 플랫폼**을 목표로 한다.
홈서버, 클라우드, NAS 등 **어디서 실행되든 동일한 사용자 경험(GUI 중심)**을 제공하며,
실행 환경 차이는 *배포/운영 방식*으로만 흡수한다.

---

## 핵심 설계 원칙

1. **Core 단일화** — 모든 버전은 동일한 Fieldstack Core를 사용한다. 기능 분기 없음.
2. **GUI(Web) 우선** — 모든 설정과 사용은 웹 GUI를 기본으로 한다. CLI는 예외적 복구 도구.
3. **배포 방식 분리, 경험 통일** — 환경이 달라도 사용자 경험은 동일하게 유지한다.

---

## 공식 지원 실행 모델

### ⭐ 1순위 — Docker AIO (All-In-One)
**표준 권장 실행 모델**

Nextcloud AIO와 동일한 방식. 단일 Docker 이미지로 앱·DB를 모두 포함하여 제공한다.
홈서버, NAS(TrueNAS SCALE, Synology), VPS, Railway 등 Docker가 지원되는 모든 환경에서 동작한다.

```bash
docker-compose up -d
# → http://localhost:3000 접속 → 설치 마법사 시작
```

- SQLite: 컨테이너 하나로 완결 (별도 DB 불필요)
- PostgreSQL: docker-compose에 postgres 서비스가 자동으로 함께 구성됨

Cloudflare Tunnel 연동은 Docker 버전의 확장 옵션으로 제공한다 (`cloudflared` 서비스 추가).
nginx, Apache, Traefik 등 리버스 프록시를 통한 외부 노출도 지원할 예정이다 (문서 및 예제 설정 제공 계획).

---

### 2순위 — PM2
**Docker 불가 환경용**

Docker를 설치할 수 없거나 사용하지 않는 환경(공유 호스팅, 저사양 기기 등)을 위한 옵션.
AIO 이미지 대신 소스 빌드 후 PM2로 실행한다.

```bash
pnpm build
pm2 start apps/api/dist/index.js --name fieldstack
```

DB는 SQLite(기본) 또는 사용자가 직접 설치한 PostgreSQL에 연결한다.

---

### 참고 — Native / systemd (비공식)
**공식 지원 아님 — 고급 사용자용**

`git clone` 후 직접 빌드하여 사용할 수 있으나 공식적으로 지원하지 않는다.
Docker AIO 이미지를 제공받지 못하며, 업데이트 편의성이 낮다.
systemd 서비스 등록은 문서에 힌트만 제공하며, 안정성은 보장하지 않는다.

> Proxmox, TrueNAS CORE 등 Docker를 지원하지 않는 환경이라면 PM2 방식을 권장한다.

---

## 지원 수준 요약

| 구분 | Docker AIO | PM2 | Cloudflare | Native/systemd |
|------|:---:|:---:|:---:|:---:|
| 공식 지원 | ✅ | ✅ | ✅ | ❌ (참고 문서만) |
| AIO 이미지 제공 | ✅ | ❌ | ❌ | ❌ |
| DB 자동 구성 | ✅ | ❌ (수동) | ✅ (D1) | ❌ (수동) |
| Cloudflare Tunnel | ✅ (확장 옵션) | 별도 설치 | 해당 없음 | 별도 설치 |
| 리버스 프록시 (nginx 등) | ✅ (예정) | ✅ (예정) | 해당 없음 | ✅ (예정) |
| 업데이트 편의 | ✅ 이미지 pull | 보통 | 느림 (별도 배포) | 낮음 |
| 권장도 | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⚠️ |

---

## 개발 우선순위

1. **Docker AIO** — 메인 타깃. 모든 문서·테스트의 기준.
2. **PM2** — 보조. Docker AIO와 빌드 결과물 공유.
3. **Cloudflare Workers/Pages** — Docker/PM2 이후. Workers 런타임 별도 대응 필요, 업데이트 배포 주기가 PM2보다 느림. 공식 지원으로 분류되지만 Docker AIO 기준 릴리즈보다 한두 버전 뒤처질 수 있으며, 사실상 준(準)지원에 가깝다.
4. **Native/systemd** — 별도 구현 없음. 참고 문서만 유지.

---

## 한 문장 정의

> **Fieldstack는 Docker AIO 이미지를 기본으로 제공하는 셀프호스트 플랫폼이며,
> 모든 설정과 사용은 웹 GUI를 기본으로 한다.**
