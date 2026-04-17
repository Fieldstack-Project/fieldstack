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

- **일반 다운로드**: URL 입력 → yt-dlp로 영상 다운로드 (YouTube, Twitch VOD 등)
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

### 백엔드

```
modules/downloader/
  module.json
  backend/
    index.ts       ← createRouter() — API 라우트 등록
    queue.ts       ← 다운로드 큐 관리 + node-cron 예약 스케줄러
    runner.ts      ← streamlink / yt-dlp 프로세스 스폰 + stdout 파싱
    storage.ts     ← 저장 경로 검증 + 파일 시스템 헬퍼
```

**런타임 의존성 (서버에 설치 필요):**
- `streamlink` — 라이브 스트림 캡처
- `yt-dlp` — 일반 영상 다운로드 (YouTube, Twitch VOD 등)
- 설치 여부는 모듈 초기화 시 `which streamlink` / `which yt-dlp`로 감지, UI에 표시

### API 설계 (안)

| 메서드 | 경로 | 설명 |
|---|---|---|
| `GET` | `/api/downloader/status` | streamlink/yt-dlp 설치 여부 확인 |
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
  title        TEXT,                    -- yt-dlp로 미리 조회한 제목
  type         TEXT NOT NULL,           -- 'vod' | 'live' | 'batch'
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

- **hitomi_downloader 통합**: Python 기반이라 별도 환경 필요. yt-dlp로 커버 안 되는 사이트 대상으로 검토.
- **동시 다운로드 수 제한**: 서버 리소스 보호를 위한 최대 동시 작업 수 설정.
- **알림**: 다운로드 완료/실패 시 알림 (Phase 3.x SMTP 또는 웹훅 연동).
- **스트림 품질 선택**: Streamlink 스트림 품질(`best`, `720p` 등) 옵션 UI.
- **ffmpeg 의존**: 일부 포맷 병합에 ffmpeg 필요 — 설치 감지 항목에 추가.
