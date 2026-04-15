# 09. 앱 내부 시스템 모니터링

> **구현 대상 Phase:** 3.7 (Phase 3 완료 후)
> **관련 로드맵:** `roadmap/01-development-plan.md` — Phase 3.7

---

## 1. 개요

### 목적

Fieldstack 인스턴스를 운영하는 관리자가 **앱 안에서 직접** 시스템 상태를 확인할 수 있는 모니터링 페이지.

### 외부 모니터링(Uptime Kuma)과의 역할 분리

| 도구 | 대상 | 확인 항목 |
|------|------|-----------|
| **Uptime Kuma** (외부) | 마켓플레이스 서버, 공유 링크 서버 등 공용 인프라 | HTTP 200 여부, 응답 시간, SSL 만료 |
| **앱 내부 모니터링** (Phase 3.7) | Fieldstack 인스턴스 자체 | CPU·메모리·디스크, DB 연결, 모듈 상태 |

Uptime Kuma는 **"서버가 살아있는가"**를 외부에서 보는 것이고,
앱 내부 모니터링은 **"서버 안이 어떤 상태인가"**를 관리자가 내부에서 보는 것이다.

---

## 2. 수집 항목 설계

### 2.1 시스템 리소스

| 항목 | 수집 방법 | 단위 |
|------|----------|------|
| CPU 사용률 | `os.cpus()` + 샘플링 (100ms 간격 2회 측정 평균) | % |
| 메모리 사용량 | `os.totalmem()` / `os.freemem()` | MB, % |
| 프로세스 메모리 | `process.memoryUsage().heapUsed` | MB |
| 디스크 사용량 | `fs.statfs()` (Node 19+) 또는 `df -k` 파싱 | GB, % |
| OS / 플랫폼 | `os.type()`, `os.release()`, `os.arch()` | 문자열 |

> **CPU 샘플링 주의:** `os.cpus()`는 부팅 이후 누적값이므로 단순 호출로는 현재 사용률을 알 수 없다.
> 100ms 간격으로 두 번 측정한 idle/total 델타로 계산해야 한다. 아래 구현 예시 참고.

```typescript
function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const start = os.cpus();
    setTimeout(() => {
      const end = os.cpus();
      let idle = 0, total = 0;
      for (let i = 0; i < start.length; i++) {
        const s = start[i].times, e = end[i].times;
        idle  += e.idle  - s.idle;
        total += (e.user + e.nice + e.sys + e.idle + e.irq)
               - (s.user + s.nice + s.sys + s.idle + s.irq);
      }
      resolve(Math.round((1 - idle / total) * 100));
    }, 100);
  });
}
```

### 2.2 서버 정보

| 항목 | 수집 방법 |
|------|----------|
| 프로세스 업타임 | `process.uptime()` (초) → "X일 X시간 X분" 포맷 |
| Node.js 버전 | `process.version` |
| Fieldstack 버전 | `apps/api/package.json`의 `version` 필드 |
| 실행 환경 | `process.env.NODE_ENV` |
| PID | `process.pid` |

### 2.3 데이터베이스

| 항목 | 수집 방법 |
|------|----------|
| 연결 상태 | `db.query('SELECT 1')` 성공/실패 |
| 응답 속도 | 위 쿼리 실행 전후 `Date.now()` 차이 (ms) |
| Provider 종류 | `db.name` (`'postgres'` or `'sqlite'`) |
| 마이그레이션 상태 | `_migrations` 테이블 최신 항목 조회 |

### 2.4 설치 상태

| 항목 | 수집 방법 |
|------|----------|
| `installed.lock` 존재 | `fs.existsSync(LOCK_FILE)` |
| `fieldstack.config.json` 존재 | `fs.existsSync(CONFIG_FILE)` |
| Config DB provider | `readConfig()?.db.provider` |

### 2.5 모듈 상태

Phase 2 사전 작업(ModuleRegistry)이 완성된 이후에 연동.

| 항목 | 수집 방법 |
|------|----------|
| 활성 모듈 목록 | `ModuleRegistry.list()` |
| 각 모듈 상태 | `enabled: true/false`, 로드 성공 여부 |

---

## 3. API 설계

### `GET /core/monitor`

- **인증:** 필수 (JWT Bearer)
- **권한:** 관리자 전용 (`requireAuth` + PIN 검증 세션 확인)
- **캐시:** 서버 측 5초 캐싱 (너무 자주 호출 시 부하 방지)

#### 응답 스키마

```typescript
interface MonitorResponse {
  timestamp: string;          // ISO 8601
  system: {
    cpu: {
      usage: number;          // 0~100 (%)
      cores: number;
    };
    memory: {
      total: number;          // MB
      used: number;           // MB
      free: number;           // MB
      percentage: number;     // 0~100
    };
    process: {
      heapUsed: number;       // MB
      heapTotal: number;      // MB
    };
    disk: {
      total: number;          // GB
      used: number;           // GB
      free: number;           // GB
      percentage: number;     // 0~100
      path: string;           // 측정 기준 경로 (e.g. "/")
    };
    os: {
      type: string;           // "Linux" | "Darwin" | "Windows_NT"
      release: string;
      arch: string;
    };
  };
  server: {
    uptime: number;           // 초
    uptimeFormatted: string;  // "3일 4시간 12분"
    nodeVersion: string;      // "v20.11.0"
    appVersion: string;       // "0.1.0"
    env: string;              // "production" | "development"
    pid: number;
  };
  database: {
    status: 'connected' | 'error';
    provider: 'postgres' | 'sqlite';
    responseTimeMs: number | null;
    lastMigration: string | null;   // 마지막 적용된 마이그레이션 파일명
    error?: string;
  };
  setup: {
    installed: boolean;
    configExists: boolean;
    dbProvider: string | null;
  };
  modules: Array<{
    name: string;
    enabled: boolean;
    apiBasePath: string | null;
  }>;
}
```

#### 응답 예시

```json
{
  "timestamp": "2026-04-16T12:34:56.789Z",
  "system": {
    "cpu": { "usage": 8, "cores": 4 },
    "memory": { "total": 8192, "used": 2048, "free": 6144, "percentage": 25 },
    "process": { "heapUsed": 64, "heapTotal": 128 },
    "disk": { "total": 200, "used": 50, "free": 150, "percentage": 25, "path": "/" },
    "os": { "type": "Linux", "release": "6.6.87", "arch": "x64" }
  },
  "server": {
    "uptime": 86400,
    "uptimeFormatted": "1일 0시간 0분",
    "nodeVersion": "v20.11.0",
    "appVersion": "0.1.0",
    "env": "production",
    "pid": 1234
  },
  "database": {
    "status": "connected",
    "provider": "postgres",
    "responseTimeMs": 4,
    "lastMigration": "002_shared_links.sql"
  },
  "setup": {
    "installed": true,
    "configExists": true,
    "dbProvider": "postgres"
  },
  "modules": [
    { "name": "ledger", "enabled": true, "apiBasePath": "/api/ledger" },
    { "name": "subscription", "enabled": true, "apiBasePath": "/api/subscription" }
  ]
}
```

---

## 4. 프론트엔드 UI 설계

### 4.1 진입점

- Admin 패널 사이드바 또는 master-detail 패널에 **"시스템 상태"** 항목 추가
- 관리자 PIN 인증 세션 필요 (기존 AdminView 흐름과 동일)

### 4.2 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  시스템 상태          마지막 갱신: 12:34:56  [새로고침]  [●]  │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   CPU        │   메모리      │   디스크      │   데이터베이스  │
│    8%        │  25% (2/8GB) │  25% (50/200)│   ● 연결됨     │
│   ████░░░░  │  ████░░░░░░ │  ████░░░░░░ │   응답 4ms     │
├──────────────┴──────────────┴──────────────┴────────────────┤
│  서버 정보                                                    │
│  업타임: 1일 0시간    Node.js: v20.11.0    버전: 0.1.0       │
├─────────────────────────────────────────────────────────────┤
│  활성 모듈 (2)                                               │
│  ● Ledger /api/ledger       ● Subscription /api/subscription │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 상태 색상 기준

| 상태 | 색상 | 조건 예시 |
|------|------|----------|
| 정상 (●) | `--color-success` (`#10B981`) | CPU < 80%, 메모리 < 85%, DB 연결됨 |
| 경고 (●) | `--color-warning` (`#F59E0B`) | CPU 80~95%, 메모리 85~95%, DB 응답 > 500ms |
| 위험 (●) | `--color-danger` (`#EF4444`) | CPU > 95%, 메모리 > 95%, DB 연결 실패, 디스크 > 90% |

### 4.4 자동 갱신

- 30초마다 `GET /core/monitor` 폴링
- 페이지 포커스 복귀 시 즉시 갱신 (`document.visibilitychange` 이벤트)
- 로딩 중에는 마지막 성공 데이터 유지 + 상단에 "갱신 중..." 표시
- 연속 3회 실패 시 경고 배너 표시

---

## 5. 구현 시 고려사항

### 5.1 디스크 사용량 수집

`fs.statfs()`는 Node.js 19+에서만 사용 가능. 하위 버전 대응:

```typescript
async function getDiskUsage(targetPath = '/') {
  // Node 19+
  if (typeof (fs as any).statfs === 'function') {
    const stat = await fs.promises.statfs(targetPath);
    const total = stat.blocks * stat.bsize;
    const free  = stat.bfree  * stat.bsize;
    return { total, free, used: total - free };
  }
  // 폴백: df 명령어 (Unix)
  const { stdout } = await execFile('df', ['-k', targetPath]);
  const [, line] = stdout.split('\n');
  const [, blocks, used, avail] = line.trim().split(/\s+/);
  return {
    total: Number(blocks) * 1024,
    used:  Number(used)   * 1024,
    free:  Number(avail)  * 1024,
  };
}
```

### 5.2 응답 캐싱

`GET /core/monitor`는 CPU 샘플링(100ms 대기)이 포함되므로 매 요청마다 실행하면 부하가 생길 수 있다.
서버 측에서 **5초 인메모리 캐시**를 적용한다.

```typescript
let cachedResult: MonitorResponse | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000;

async function getMonitorData(db: DbProvider): Promise<MonitorResponse> {
  if (cachedResult && Date.now() - cacheTime < CACHE_TTL) {
    return cachedResult;
  }
  cachedResult = await collectAll(db);
  cacheTime = Date.now();
  return cachedResult;
}
```

### 5.3 보안

- `requireAuth` 미들웨어 필수 (JWT 검증)
- 관리자 PIN 세션 확인: `req.auth.isPinVerified` 또는 세션 테이블 검증
- 시스템 정보(PID, 경로 등)는 민감 정보일 수 있으므로 외부 공개 금지
- 프로덕션에서 CORS 제한 확인

### 5.4 모듈 연동 (Phase 2 사전 작업 이후)

`ModuleRegistry`가 구현된 후 `modules` 필드를 실제 데이터로 채운다.
그 전까지는 빈 배열 `[]` 반환.

---

## 6. 파일 구조 (구현 시 생성할 파일)

```
apps/api/src/
  routes/
    monitor.ts          — GET /core/monitor 라우터
  services/
    monitor-service.ts  — 지표 수집 로직 (CPU, 메모리, 디스크, DB 핑)

apps/web/src/
  views/
    SystemMonitorView.tsx   — 모니터링 페이지 컴포넌트
    system-monitor.css      — 스타일
```

---

## 7. 미래 확장 가능성

현재 스펙에서 제외했지만 나중에 추가할 수 있는 항목:

- **요청 통계**: 총 요청 수, 평균 응답 시간, 에러율 (Express 미들웨어로 수집)
- **로그 스트리밍**: 최근 API 에러 로그 실시간 표시
- **알림**: 임계값 초과 시 SMTP/Webhook 알림 (SMTP 연동 후)
- **히스토리 차트**: 시계열 데이터 저장 후 시각화 (recharts)
- **모듈별 상태**: 각 모듈이 자체 `healthCheck()` 메서드를 등록해 응답
