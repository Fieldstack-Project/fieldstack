# 공유 링크 코어 시스템 (Shared Link)

## 1. 개요

모든 모듈이 공통으로 사용할 수 있는 **공개 링크 발행 인프라**입니다.
모듈은 이 코어를 호출하기만 하면 어떤 데이터든 외부 공개 링크를 발행할 수 있습니다.

```
[모듈] → POST /core/share → 토큰 발행
[외부] → GET  /s/:token  → 토큰 검증 → 모듈 데이터 렌더링
```

---

## 2. 모듈 연동 방식

각 모듈은 공유할 데이터의 **리소스 타입과 ID**만 코어에 전달합니다.
링크 관리(발행, 만료, 접근 제어)는 전부 코어가 처리합니다.

```ts
// 모듈에서 링크 발행 요청
POST /core/share
{
  resourceType: 'invoice',      // 모듈이 정의한 리소스 타입
  resourceId: 'inv_abc123',     // 해당 리소스 ID
  expiresAt: '2026-05-01',      // 만료일 (optional)
  password: 'secret',           // 비밀번호 보호 (optional)
  maxAccessCount: 10,           // 최대 접근 횟수 (optional)
}

// 응답
{
  token: 'a1b2c3d4e5f6',
  url: 'https://your-server.com/s/a1b2c3d4e5f6'
}
```

---

## 3. DB 스키마

```sql
CREATE TABLE shared_links (
  id            TEXT PRIMARY KEY,         -- UUID
  token         TEXT UNIQUE NOT NULL,     -- 공개 URL 토큰 (랜덤 12자 이상)
  resource_type TEXT NOT NULL,            -- 모듈이 정의한 리소스 타입
  resource_id   TEXT NOT NULL,            -- 해당 리소스 ID
  password_hash TEXT,                     -- 비밀번호 해시 (없으면 NULL)
  max_access    INTEGER,                  -- 최대 접근 횟수 (없으면 무제한)
  access_count  INTEGER DEFAULT 0,        -- 현재 접근 횟수
  expires_at    DATETIME,                 -- 만료일시 (없으면 영구)
  created_by    TEXT NOT NULL,            -- 발행한 사용자 ID
  created_at    DATETIME DEFAULT NOW(),
  revoked_at    DATETIME                  -- 수동 무효화 시각 (NULL이면 유효)
);

CREATE TABLE shared_link_logs (
  id            TEXT PRIMARY KEY,
  token         TEXT NOT NULL,
  accessed_at   DATETIME DEFAULT NOW(),
  ip_address    TEXT,
  user_agent    TEXT
);
```

---

## 4. API 명세

### 링크 발행
```
POST /core/share
Authorization: Bearer <jwt>   ← 인증된 사용자만 발행 가능

Body: {
  resourceType: string
  resourceId: string
  expiresAt?: string          // ISO 8601
  password?: string
  maxAccessCount?: number
}

Response: { token: string, url: string }
```

### 링크 접근 (공개, 비인증)
```
GET /s/:token

Query: ?password=secret       ← 비밀번호 보호 링크의 경우

Response:
  200 → { resourceType, resourceId, data: <모듈이 제공하는 렌더 데이터> }
  401 → 비밀번호 필요 또는 불일치
  404 → 토큰 없음
  410 → 만료 또는 무효화됨
  429 → 접근 횟수 초과
```

### 링크 무효화
```
DELETE /core/share/:token
Authorization: Bearer <jwt>   ← 발행자 또는 관리자만 가능
```

### 내가 발행한 링크 목록
```
GET /core/share
Authorization: Bearer <jwt>
```

---

## 5. 모듈 측 구현 가이드

링크 접근 시 코어는 `resourceType`과 `resourceId`를 해당 모듈에 위임합니다.
각 모듈은 자신의 리소스 타입에 대한 **렌더 핸들러**를 등록해야 합니다.

```ts
// 모듈에서 렌더 핸들러 등록 (module.json 또는 모듈 초기화 시)
registerSharedLinkRenderer('invoice', async (resourceId, ctx) => {
  const invoice = await getInvoice(resourceId);
  return { ...invoice };  // 외부에 노출할 데이터만 반환
});
```

코어가 `/s/:token` 요청을 받으면:
1. 토큰 유효성 검증 (만료, 비밀번호, 횟수)
2. `resourceType`에 등록된 핸들러 호출
3. 핸들러가 반환한 데이터를 응답

---

## 6. 사용 가능 조건 (도메인 요구사항)

공유 링크 기능은 **도메인이 서버에 연결된 경우에만 활성화**됩니다.
IP 주소가 그대로 포함된 링크는 발행이 차단됩니다.

### 이유

- **서버 IP 노출**: IP 주소가 공개 링크에 포함되면 서버의 물리적 위치와 인프라 정보가 외부에 드러납니다.
- **HTTPS 미보장**: IP 직접 접속은 TLS 인증서 발급이 사실상 불가능하므로 링크 내용이 평문으로 전송될 수 있습니다.
- **신뢰성 부족**: 수신자가 `http://123.456.78.90/s/token` 형태의 링크를 받으면 피싱으로 오인하기 쉽습니다.

### 허용 조건

| 조건 | 설명 | 허용 여부 |
|------|------|-----------|
| Cloudflare Tunnel 연결 | 도메인 + HTTPS 자동 제공 | ✅ 허용 |
| 직접 도메인 연결 (A/CNAME) | 도메인 + TLS 인증서 설정 | ✅ 허용 |
| IP 직접 접속 (포트 포함) | 도메인 없음 | ❌ 차단 |
| `localhost` / 루프백 주소 | 외부 공유 불가 환경 | ❌ 차단 |

### 도메인 감지 방식

서버는 시작 시 `installed.lock` 또는 환경변수에서 `PUBLIC_URL`을 읽어 도메인 여부를 판단합니다.

```
PUBLIC_URL=https://myapp.example.com   → 도메인 확인됨, 공유 링크 활성화
PUBLIC_URL=http://192.168.0.10:3000    → IP 감지됨, 공유 링크 비활성화
PUBLIC_URL 미설정                       → 비활성화 (안전 우선)
```

공유 링크 기능이 비활성화된 상태에서 발행을 시도하면:

```
POST /core/share
→ 403 { error: 'SHARED_LINK_UNAVAILABLE', reason: 'Domain not configured' }
```

관리자 설정 화면에서도 현재 상태를 표시합니다:
- 도메인 미설정: "공유 링크 기능을 사용하려면 도메인을 연결하세요." 안내 배너
- 도메인 설정 완료: 기능 정상 활성화

---

## 7. 보안 고려사항

- 토큰은 최소 **16자 이상의 랜덤 문자열** (crypto.randomBytes 기반)
- 비밀번호는 평문 저장 금지 — bcrypt 해시로 저장
- 접근 로그는 IP/User-Agent 기록 (텔레메트리 동의 여부와 무관하게 내부 로그로 유지)
- 공개 링크 응답에는 **내부 ID, 사용자 정보 등 민감 데이터 포함 금지** — 모듈 핸들러가 필터링 책임
- 무효화된 링크는 삭제하지 않고 `revoked_at`만 기록 (접근 시도 감사 추적 가능)

---

## 8. 활용 예시

| 모듈 | 리소스 타입 | 외부 접속자가 보는 것 |
|------|------------|----------------------|
| 청구서 | `invoice` | 청구서 내용, 결제 링크 |
| 폼 빌더 | `form` | 응답 입력 폼 |
| 프로젝트 | `project-status` | 진행 현황 (읽기 전용) |
| 출퇴근 | `schedule` | 근무 일정 확인 |
