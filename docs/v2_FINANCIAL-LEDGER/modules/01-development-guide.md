# 모듈 개발 가이드

**최종 업데이트:** 2026-04-18  
**참조 구현:** `modules/ledger/`

> 상세 패턴 및 예제 코드는 `docs/local/module-template/README.md` 참조.

---

## 모듈 시스템 개요

Fieldstack 모듈은 `modules/{name}/` 디렉터리에 위치하며, 서버 시작 시 `module-registry.ts`가 `module.json`을 스캔하여 자동으로 로드·등록한다.

```
modules/{name}/
├── module.json          ← 필수. 모듈 매니페스트
├── backend/
│   ├── index.ts         ← createRouter() export
│   ├── routes.ts
│   ├── service.ts
│   ├── validation.ts
│   └── migrations/
│       └── 001_initial.sql
└── frontend/
    ├── {Name}View.tsx
    └── {name}.css
```

---

## 모듈 매니페스트 (module.json)

```json
{
  "name": "my-module",
  "version": "1.0.0",
  "displayName": "내 모듈",
  "description": "모듈 설명",
  "enabled": true,
  "dependencies": [],
  "routes": {
    "frontend": "/my-module",
    "api": "/api/my-module"
  },
  "repository": "https://github.com/author/module-my-module",
  "author": {
    "name": "작성자 이름",
    "email": "author@example.com",
    "url": "https://example.com"
  }
}
```

- `displayName` → 사이드바에 자동 표시 (API 경유)
- `enabled: false` → 서버 시작 시 완전히 무시
- `routes.api` → Express 라우터 마운트 경로
- `repository` → 마켓플레이스 상세 페이지에서 GitHub README 표시에 사용 (선택)
- `author` → npm `package.json` 관례. `string` 또는 `{ name, email, url }` 객체 모두 허용 (선택)

---

## 백엔드 계약

### createRouter 함수

`backend/index.ts`는 반드시 `createRouter(services)` named export를 가져야 한다.

```typescript
export function createRouter(services: ModuleServices): Router { ... }
```

**⚠️ `@fieldstack/core` 값 import 금지**  
`modules/` 위치에서 `@fieldstack/core` 런타임 import는 경로 해석 실패.  
- `getDb()`, `FileMigrationRunner` → `module-registry.ts`가 처리 (`services.db`로 주입)
- `JwtSessionManagerImpl` 타입 → 로컬 duck-type으로 대체

### 마이그레이션

`backend/migrations/*.sql` 파일을 작성하면 `module-registry.ts`가 모듈 로드 시 자동 실행.  
모듈 코드에서 직접 호출하지 않는다.

SQL 작성 시 크로스-DB 토큰 사용:
- `{{UUID_PRIMARY_KEY}}`, `{{BOOLEAN_FALSE}}`, `{{NOW}}`

### 인증

`services.jwtManager.verifyAccessToken(token)` → `{ userId, email }` 반환.  
라우터 내부에서 duck-type으로 인라인 auth 미들웨어 구현 (`routes.ts` 패턴 참조).

### HTTP 규칙

| 메서드 | 성공 응답 | 본문 |
|--------|---------|------|
| GET | 200 | `{ success: true, data: { ... } }` |
| POST | 201 | `{ success: true, data: { ... } }` |
| PUT | 200 | `{ success: true, data: { ... } }` |
| DELETE | **204** | 없음 (빈 본문) |

---

## 프론트엔드 계약

### 파일 위치

`modules/{name}/frontend/` 에 위치. `apps/web/src/` 안에 두지 않는다.

### 패키지 접근

`@fieldstack/controls`, `@fieldstack/core/browser`는 `apps/web/vite.config.ts`의 alias로 등록되어 있어 `modules/` 위치에서도 정상 import 가능.  
새 `@fieldstack/*` 패키지가 필요하면 `vite.config.ts` alias에 추가.

### API 호출 패턴

```typescript
async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("fs_token") ?? ""}`,
      ...(opts?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!text) return undefined as T;           // 204 등 빈 응답 처리
  const json = JSON.parse(text) as { success: boolean; data?: T; error?: unknown };
  if (!json.success) throw new Error(String(json.error ?? "API 오류"));
  return json.data as T;
}
```

- 토큰 키: `fs_token` (`fs_auth` 아님)
- `res.json()` 대신 `res.text()` 후 파싱 → 빈 응답(204) 안전 처리

### 앱 연결

`apps/web/src/main.tsx`에서 3곳 수정:
1. import 추가
2. `MODULE_ROUTES` 배열에 모듈 이름 추가
3. `effectiveRoute` 분기에 렌더 추가

사이드바는 `/core/modules/me` API 응답으로 자동 구성 → `AppShell.tsx` 수정 불필요.

---

## 모듈 간 통신

직접 import 금지. 향후 Event Bus 경유 예정 (미구현).

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `apps/api/src/module-registry.ts` | 모듈 스캔, 마이그레이션, 라우터 등록 |
| `apps/api/src/loader/index.ts` | `ModuleManifest` 파싱 |
| `apps/api/src/routes/core.ts` | `/core/modules/me` API |
| `apps/web/src/main.tsx` | 모듈 뷰 라우팅 |
| `apps/web/vite.config.ts` | `@fieldstack/*` alias |
| `apps/web/src/components/AppShell.tsx` | 사이드바 자동 구성 |
