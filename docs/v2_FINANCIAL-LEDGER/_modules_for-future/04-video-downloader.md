# 영상 다운로더 모듈

## 개요

Streamlink / yt-dlp 기반의 영상 다운로드 관리 모듈.  
라이브 스트림 녹화, 예약 다운로드, 일반 다운로드를 지원하며  
저장 위치를 자유롭게 지정할 수 있다 (로컬 PC, NAS 마운트 경로 등).

> **개발 시점:** Phase 2 이후 검토  
> **참고 도구:** [Streamlink](https://streamlink.github.io/), [yt-dlp](https://github.com/yt-dlp/yt-dlp), [hitomi_downloader](https://github.com/KurtBestor/Hitomi-Downloader)

---

## 주요 기능 (검토 중)

### 1. 다운로드 유형

- **일반 다운로드**: URL 입력 → yt-dlp / 커스텀 추출기로 영상 다운로드
- **라이브 스트림 녹화**: Streamlink 기반 실시간 스트림 캡처 및 저장
- **예약 다운로드**: 지정 시각에 자동 시작 (방송 시작 시간 예약 등)
- **배치 다운로드**: URL 목록을 한 번에 등록, 순차 또는 병렬 처리

### 2. 저장 경로 설정

- 기본 저장 경로 지정 (모듈 설정에서 관리)
- 다운로드 추가 시 개별 경로 오버라이드 가능
- 경로 예시:
  - 로컬: `/home/user/downloads/videos`
  - NAS: `/mnt/nas/media/downloads` (OS 레벨 마운트 포인트 그대로 사용)
- 경로 존재 여부 및 쓰기 권한 사전 검증

### 3. 진행 상황 모니터링

- SSE(Server-Sent Events)로 실시간 진행률 스트리밍
  - 다운로드 속도, 진행 %, 예상 남은 시간
- 큐 목록에서 전체 작업 상태 확인 (대기 / 진행 중 / 완료 / 실패)
- 실패 시 에러 메시지 + 재시도 버튼

### 4. 이력 관리

- 완료된 다운로드 이력 보관
- 파일 경로, 크기, 소요 시간 기록
- 이력 삭제 (파일 삭제는 선택 옵션)

---

## 기술 구조 (설계안)

### 다운로드 엔진 분류

URL이 들어오면 `runner.ts`가 사이트를 판별하여 적절한 엔진으로 라우팅한다.

| 엔진 | 처리 대상 | 비고 |
|---|---|---|
| **yt-dlp** | YouTube, Twitch VOD, NicoNico, Bilibili 등 메이저 사이트 | standalone 바이너리 번들 |
| **streamlink** | Twitch 라이브, SOOP(구 AfreecaTV) 등 라이브 스트림 | standalone 바이너리 번들 |
| **ffmpeg** | m3u8/HLS/DASH URL을 직접 노출하는 사이트 | ffmpeg-static npm 패키지 |
| **커스텀 TS 추출기** | 위 세 엔진으로 커버 안 되는 사이트 | 모듈 내 TypeScript로 직접 구현 |
| **capture** | yt-dlp/streamlink가 막히는 DRM 라이브 스트림 (최후 수단) | Puppeteer `--disable-gpu` + FFmpeg 화면 캡처 |

ffmpeg는 HLS/DASH 스트림 URL만 알면 직접 녹화·저장이 가능하므로,  
커버 범위가 생각보다 넓다 (`ffmpeg -i "https://...m3u8" -c copy output.mp4`).

**엔진 우선순위 (동일 URL에 대해):**
```
yt-dlp (쿠키 포함) → streamlink → ffmpeg → 커스텀 추출기 → capture
```
capture는 위 모든 엔진이 실패한 경우의 최후 수단. 실시간 재생 속도로만 캡처 가능하므로 라이브 공연 등 1회성 방송 녹화 용도에 한해 사용.

**Abema 등 지역 제한 + DRM 사이트 처리 흐름:**
1. VPN은 사용자가 서버 네트워크 레벨에서 미리 설정
2. yt-dlp + 브라우저 쿠키로 스트림 직접 추출 시도 (yt-dlp에 Abema 추출기 내장)
3. 라이브 DRM으로 yt-dlp가 막히면 capture 엔진으로 폴백
   - Puppeteer `--disable-gpu` 플래그로 하드웨어 가속 OFF
   - CPU 소프트웨어 렌더링으로 프레임이 시스템 메모리를 경유
   - FFmpeg(`x11grab`/`gdigrab`)로 가상 디스플레이 캡처

### 커스텀 TS 추출기

Hitomi Downloader의 Python 추출기(`.py`)를 **로직 참고용**으로 활용하되,  
실제 구현은 TypeScript로 새로 작성한다.

**이유:**
- Python 런타임 / PyInstaller 빌드 파이프라인 불필요
- Hitomi 원본은 PyQt UI(`cw`)와 자체 유틸에 강하게 결합되어 있어 재사용 어려움
- 원본 이슈 트래커에 사이트 정책 변경에 따른 버그가 다수 존재 → 직접 관리가 유지보수에 유리

**추출기 구조 (안):**
```
backend/
  extractors/
    base.ts          ← 추출기 인터페이스 (canHandle(url), extract(url) → StreamUrl)
    niconico.ts      ← NicoNico 전용 HTML 파싱 + API 호출
    pixiv.ts
    ...
```

각 추출기는 "페이지 HTML/API 파싱 → 실제 스트림 URL 추출"만 담당하고,  
URL을 얻은 뒤 실제 다운로드는 ffmpeg 또는 yt-dlp에 위임한다.

### SNI/DPI 차단 우회

ISP가 SNI 검사로 특정 도메인을 차단하는 경우, 패킷 조작으로 우회한다.  
목적과 원리는 동일하며 **패킷을 가로채기 위해 OS에서 어떤 훅을 쓰는지**만 다르다.

**공통 원리:**  
TLS ClientHello 패킷의 SNI 필드를 DPI 장비가 읽지 못하도록 조작한다.  
주요 기법: 패킷 분할(fragmentation), TTL 조작, TCP 역순 전송 — 셋 다 동일한 기법을 조합해 사용.

| 도구 | 플랫폼 | OS 훅 방식 | 비고 |
|---|---|---|---|
| **GoodbyeDPI** | Windows | WinDivert 드라이버로 패킷 가로채기 | 오픈소스, 설정 자유도 높음 |
| **유니콘 HTTPS** | Windows / Android | 동일 (WinDivert) | 한국산, 한국 통신사 차단 패턴에 맞게 튜닝 |
| **zapret** | **Linux** / macOS | nftables/iptables NFQUEUE | Linux 표준, GoodbyeDPI와 동일 원리 |

**모듈 적용:**  
서버가 Linux에서 동작하므로 **zapret**을 사용.  
GoodbyeDPI / 유니콘 HTTPS는 Windows 전용이므로 제외.

```
SNI 차단 사이트 접근 시:
  zapret 활성화 여부 확인
    → 활성  : 그대로 다운로드 진행
    → 비활성 : UI에 "SNI 차단 우회 비활성 — 설정에서 zapret 활성화" 안내
```

**권한:**  
zapret은 Linux 커널 netfilter를 사용하므로 `CAP_NET_ADMIN` 권한 필요.  
- Docker: `--cap-add NET_ADMIN`  
- systemd: `AmbientCapabilities=CAP_NET_ADMIN`  
권한이 없으면 zapret 기능만 비활성, 나머지 엔진은 정상 동작.

> **참고:** VPN(IP 변경)과는 별개. zapret은 ISP 차단 우회 용도이며, Abema 같은 지역 제한(일본 IP 필요)은 VPN으로 별도 처리해야 한다.

### VPN 통합

다운로드 프로세스만 VPN을 통과시키고 웹 서버(UI)는 기존 네트워크를 그대로 사용한다.  
**SOCKS5 프록시 경유** 방식으로 격리한다.

```
WireGuard / OpenVPN 터널
        ↓
microsocks (127.0.0.1:1080, SOCKS5)
        ↓
yt-dlp --proxy socks5://127.0.0.1:1080 ...
streamlink --http-proxy socks5://127.0.0.1:1080 ...
ffmpeg -http_proxy socks5://127.0.0.1:1080 ...
```

웹 UI(Node.js)는 프록시를 사용하지 않으므로 VPN과 완전히 분리된다.

**설정 파일 자동 감지:**

| 프로토콜 | 파일 | 판별 키워드 |
|---|---|---|
| WireGuard | `.conf` | `[Interface]` + `[Peer]` |
| OpenVPN | `.ovpn` | `dev tun` / `client` |

사용자가 VPN 제공업체에서 받은 설정 파일을 업로드하면 형식을 자동 감지하여 적절한 바이너리로 처리한다.

**주요 제공업체 지원 현황:**

| 제공업체 | WireGuard | OpenVPN | 설정 파일 위치 |
|---|---|---|---|
| Surfshark | ✓ | ✓ | 대시보드 → VPN → Manual Setup |
| Mullvad | ✓ | ✓ | 계정 페이지 → WireGuard config |
| ProtonVPN | ✓ | ✓ | 계정 페이지 → Downloads |
| NordVPN | ✓ | ✓ | 서버 도구 페이지 |

**번들 바이너리:**
- `wg-quick` — WireGuard 인터페이스 관리 (Linux 커널 5.6+ 내장, 유저스페이스 툴만 번들)
- `openvpn` — OpenVPN 클라이언트
- `microsocks` — 경량 SOCKS5 프록시 서버

**권한:** WireGuard/OpenVPN 모두 네트워크 인터페이스 생성에 `CAP_NET_ADMIN` 필요. zapret과 동일 권한이므로 추가 설정 불필요.

> **참고:** VPN은 IP 변경(지역 제한 우회)용. SNI 차단 우회는 zapret이 담당하며 둘은 독립적으로 동작한다. 필요 시 zapret + VPN 동시 사용 가능.

### 바이너리 번들링

yt-dlp / streamlink는 공식 GitHub Releases에서 플랫폼별 standalone 실행파일을 배포한다.  
모듈 첫 로드 시 `bin-manager.ts`가 자동으로 다운로드하여 `bin/`에 저장한다.

```
modules/downloader/
  bin/                      ← .gitignore 처리, 런타임에 자동 채워짐
    yt-dlp                  ← GitHub Releases 자동 다운로드
    streamlink              ← GitHub Releases 자동 다운로드
    ffmpeg                  ← ffmpeg-static npm 패키지 경로 참조
    zapret                  ← GitHub Releases 자동 다운로드 (CAP_NET_ADMIN 필요)
    wg-quick                ← WireGuard 유저스페이스 툴
    openvpn                 ← OpenVPN 클라이언트
    microsocks              ← SOCKS5 프록시 서버 (VPN ↔ 다운로드 엔진 중계)
  backend/
    index.ts
    bin-manager.ts          ← 플랫폼 감지 → 바이너리 유무 확인 → 자동 다운로드
    runner.ts               ← URL → 엔진 라우팅 → spawn + stdout 파싱
    queue.ts                ← 큐 관리 + node-cron 예약 스케줄러
    storage.ts              ← 저장 경로 검증 + 파일 시스템 헬퍼
    extractors/             ← 커스텀 TS 추출기
  package.json              ← ffmpeg-static, puppeteer 의존성
```

### API 설계 (안)

| 메서드 | 경로 | 설명 |
|---|---|---|
| `GET` | `/api/downloader/status` | 바이너리 준비 상태 확인 (버전 포함) |
| `POST` | `/api/downloader/add` | 다운로드 추가 (URL, 저장 경로, 예약 시각) |
| `GET` | `/api/downloader/queue` | 큐 + 이력 목록 조회 |
| `GET` | `/api/downloader/:id/progress` | SSE 실시간 진행률 |
| `POST` | `/api/downloader/:id/cancel` | 진행 중 작업 취소 |
| `POST` | `/api/downloader/:id/retry` | 실패한 작업 재시도 |
| `DELETE` | `/api/downloader/:id` | 이력 삭제 |
| `GET` | `/api/downloader/settings` | 저장 경로 등 설정 조회 |
| `PUT` | `/api/downloader/settings` | 설정 저장 |

### DB 테이블 (안)

```sql
-- 다운로드 작업 테이블
CREATE TABLE downloader_jobs (
  id           UUID PRIMARY KEY,
  url          TEXT NOT NULL,
  title        TEXT,                    -- 추출기가 미리 조회한 제목
  type         TEXT NOT NULL,           -- 'vod' | 'live' | 'batch'
  engine       TEXT,                    -- 'ytdlp' | 'streamlink' | 'ffmpeg' | 'extractor'
  status       TEXT NOT NULL,           -- 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
  save_path    TEXT NOT NULL,
  file_size    BIGINT,
  error_msg    TEXT,
  scheduled_at TEXT,                    -- 예약 시각 (NULL이면 즉시)
  started_at   TEXT,
  finished_at  TEXT,
  created_by   TEXT NOT NULL REFERENCES users(id),
  created_at   TEXT DEFAULT (NOW())
);
```

---

## 미결 사항

- **커스텀 추출기 우선순위**: yt-dlp가 이미 지원하는 사이트는 중복 구현하지 않고 yt-dlp에 위임.  
  커스텀 추출기는 yt-dlp/streamlink 미지원 사이트에만 작성.
- **쿠키 관리**: 사이트별 로그인 세션 쿠키를 모듈 설정에서 관리 (Abema, onsen.ag 등 로그인 필요 사이트 대응).  
  브라우저에서 쿠키를 내보내거나(`--cookies-from-browser`) Netscape 형식 파일로 업로드하는 방식 검토.
- **capture 엔진 제약**: 실시간 재생 속도 캡처만 가능 (2시간 라이브 = 2시간 소요). Linux 서버는 `xvfb` 가상 디스플레이 필요.
- **바이너리 업데이트**: 번들된 yt-dlp/streamlink 버전 업데이트 주기 및 자동 업데이트 여부.
- **동시 다운로드 수 제한**: 서버 리소스 보호를 위한 최대 동시 작업 수 설정.
- **알림**: 다운로드 완료/실패 시 알림 (Phase 3.x SMTP 또는 웹훅 연동).
- **스트림 품질 선택**: 엔진별 품질 옵션 UI (yt-dlp `-f`, streamlink `best/720p` 등).
