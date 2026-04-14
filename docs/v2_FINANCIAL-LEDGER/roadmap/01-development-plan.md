# 단계별 개발 계획

> 📌 **프로젝트 상태:** 2026-04-12 기준 **Phase 1.5 진행 중**.
> - 아키텍처, 기술 스택, 모듈 시스템, UI/UX 등 모든 핵심 설계가 문서화되었습니다.
> - Monorepo 구조 및 초기 설정(Phase 1.1)이 완료되었습니다.
> - Core UI Shell(로그인/홈/설정/관리자) React 구현 및 1차 UI/UX 전면 개편 완료.

## 개요

Fieldstack은 점진적으로 개발되며, 각 단계는 독립적으로 완성도가 높아야 합니다.

## Phase 1: Core 기반 구축 (3개월)

### 목표
안정적인 Core 레이어와 기본 인프라 구축

### 주요 작업

#### 1.1 프로젝트 세팅
**예상 기간: 2주**

- [x] Monorepo 구조 설정 (pnpm workspace)
- [x] TypeScript 설정
- [x] ESLint/Prettier 설정
- [x] Git 저장소 생성
- [x] CI/CD 파이프라인 (GitHub Actions)

**결과물:**
```
Fieldstack/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

#### 1.2 Core Layer 개발
**예상 기간: 6주**

**Auth (인증):**
- [x] 이메일 + 비밀번호 로그인 (기본) (설계 완료)
- [x] TOTP 2FA (Google Authenticator 등) (설계 완료)
- [ ] Passkey(WebAuthn) 로그인 (선택) (설계 완료)
- [ ] Google OAuth 2.0 통합 (선택) (설계 완료)
- [x] Whitelist 시스템 (설계 완료)
- [x] JWT 세션 관리 (설계 완료)
- [x] 관리자 PIN 시스템 (설계 완료)
- [x] 비밀번호 분실 복구 (SMTP self-service + Admin-assisted) (설계 완료)
- [x] Mode 1 Local CLI reset 명령 (설계 완료)

**Database (DB 추상화):**
- [x] Provider 인터페이스 정의 (설계 완료)
- [x] PostgreSQL Provider (설계 완료)
- [x] SQLite Provider (설계 완료)
- [x] Supabase Provider (설계 완료)
- [x] MongoDB Provider (선택) (설계 완료)
- [x] 마이그레이션 시스템 (설계 완료)

**Types (공통 타입):**
- [x] API 타입 정의 (설계 완료)
- [x] User 타입 (설계 완료)
- [x] Module 타입 (설계 완료)
- [x] Integration 타입 (설계 완료)

**Utils (유틸리티):**
- [x] 날짜 처리 함수 (설계 완료)
- [x] 포맷팅 함수 (설계 완료)
- [x] 검증 함수 (설계 완료)
- [x] 암호화 함수 (설계 완료)

**UI Components (Core UI):**
- [x] Button, Input, Select (설계 완료)
- [x] Modal, Card, Table (설계 완료)
- [x] Form, DatePicker (설계 완료)
- [x] Layout 컴포넌트 (설계 완료)
- [x] Hooks (useForm, useModal, useTable) (설계 완료)

#### 1.3 Module Loader
**예상 기간: 2주**

- [x] Backend 모듈 자동 스캔 (설계 완료)
- [x] Frontend 모듈 자동 로드 (설계 완료)
- [x] module.json 파싱 (설계 완료)
- [x] 라우트 자동 등록 (설계 완료)
- [x] 의존성 체크 (설계 완료)

#### 1.4 테스트 & 문서
**예상 기간: 2주**

- [x] 단위 테스트 (Vitest)
- [x] 통합 테스트
- [x] API 문서 (OpenAPI) (설계 완료)
- [x] 개발자 가이드
- [x] README 작성

### 마일스톤 1 완료 기준
- ✅ Core 레이어 완성
- ✅ Module Loader 작동
- ✅ 테스트 커버리지 > 70%
- ✅ 문서 완성

---

## Phase 1.5: UI/UX (Core Control Plane)

### 목표
모듈 화면 개발(Phase 2) 전에, Core 기반 컨트롤 UI/UX를 먼저 완성하여
"설치 -> 로그인 -> 홈 -> 설정" 기본 흐름을 단독으로 동작 가능하게 만든다.

이 Phase는 작업 순서에 영향을 주지 않지만 Phase 2 작업 이전에 작업을 해두는 것을 권장

### 범위 명시
- [ ] Phase 1.5는 Core Control Plane에 한정
- [ ] Ledger/Subscription 등 모듈 화면 구현은 제외 (Phase 2에서 진행)
- [ ] 모듈이 0개여도 앱이 제품처럼 동작하는 기본 UX 확보

### 주요 작업

#### 1.5.1 Control UI Components (버튼/선택/토글 등 기본 Control)
**예상 기간: 1주**

> 원칙: "모든 Control 선제 구현"이 아니라, Core 흐름에 필요한 Control MVP를 먼저 고정하고,
> 추가 Control은 Phase 2 모듈 개발/커뮤니티 요청 기반으로 점진 확장한다.

> **현재 상태:** P0/P0.5 Control은 규격·계약 정의만 완료된 상태이며, `packages/controls` 실제 구현은 미착수입니다.
> `apps/web` 각 View에 인라인으로 작성된 UI가 현재 동작 레퍼런스이고,
> 2026-04-12 확정된 다크 모드 디자인 토큰 시스템을 기반으로 `packages/controls` 구현을 진행하면 됩니다.
> 상세 구현 상태는 `docs/v2_FINANCIAL-LEDGER/ui/03-control-backlog.md` 기준으로 추적합니다.

Control 전체 목록과 상태 관리는 별도 문서에서 관리:
- `docs/v2_FINANCIAL-LEDGER/ui/03-control-backlog.md` (P0 -> P0.5 -> P1)

**규격 확정 (완료):**
- [x] Button 규격 확정 (Primary/Secondary/Danger/Ghost, size, loading, disabled)
- [x] Toggle/Switch 규격 확정 (on/off 상태, 라벨 결합, 키보드 조작)
- [x] ComboBox/Select 규격 확정 (단일/다중 선택, 검색, 빈 상태)
- [x] Checkbox/Radio 규격 확정 (단일/그룹 선택, indeterminate 포함)
- [x] Input 계열 공통 규칙 확정 (text/email/password/number/search/tel/url, validation/error/help text)
- [x] Control 우선순위 분류 (P0: Core 필수 / P0.5: 반복 사용 / P1/P2: 요청 기반)
- [x] 신규 Control 추가 정책 확정 (요청 -> RFC/이슈 -> 디자인/접근성 검토 -> 릴리스)

**packages/controls 실제 구현:**
- [x] P0 Control 구현 — Button / Input / Select / Checkbox / Radio / Switch / Modal / Form Field / Alert / Progress
- [x] P0.5 Control 구현 — Textarea / Password Input / OTP Input / Search Input / Spinner / Toast / EmptyState / Skeleton
- [x] `global.css` 토큰 라이트/다크 분리 (`[data-theme]` + `prefers-color-scheme`)
- [x] `controls.css` 작성 (fs- 접두사, CSS 변수 기반, 라이트/다크 공통)
- [ ] Control 접근성 기준 체크 (focus ring, 명도 대비, aria role/label, tab 순서)
- [x] `apps/web` View에서 `@fieldstack/controls` Control로 교체 검증

#### 1.5.2 설치 마법사 (개발용 bypass)

> Setup 설치 시스템은 **Phase 1.95**에서 별도 Phase로 독립 개발됩니다.
> UX 방향은 Synology DSM 초기 설정 또는 Windows 설치 마법사 스타일을 참고.
> Phase 1.5에서는 개발 편의를 위한 bypass 모드만 제공합니다.

- [x] 개발용 bypass 실행 모드 제공 (`dev:bypass`, `dev:web:bypass`, `dev:api:bypass`)

#### 1.5.3 로그인 (Auth & Access)
**예상 기간: 3일**

- [x] 이메일/비밀번호 로그인 화면 구현 (React shell/mock)
- [x] 2FA OTP 입력 화면 구현 (활성 계정 대상)

  > `#otp` 라우트 제거, `LoginView` 내부 `step('credentials'|'otp')` 전환으로 구현 완료.
  > 상단 레이블 "Sign in" → "2FA OTP" 전환. `OtpView.tsx`, `otp.css` 삭제.
- [ ] 로그인 실패/잠금/세션 만료 UX 정의
- [x] 로그인 성공 후 Home 리다이렉트 규칙 확정 (mock)
- [x] 임시 비밀번호 첫 로그인 시 강제 변경 화면 구현 (정책 체크리스트 포함)
- [ ] 비밀번호 복구 UI 구현 (SMTP self-service / 관리자 토큰 복구 안내)
- [ ] OAuth/Passkey 로그인 진입 UI 정책 정의 (활성화된 경우에만 노출)
- [ ] 인증 실패 메시지 규칙 통일 (계정 존재 여부 비노출, 재시도 안내)

#### 1.5.4 Main Home
**예상 기간: 3일**

- [x] Home 화면 정보 구조 확정 (요약 영역, 빠른 액션, 최근 활동) - shell
- [x] 모듈 0개 상태 Empty UX 구현 (안내 + 다음 행동 CTA)
- [ ] 관리자/일반 사용자 홈 표시 정책 분리
- [x] 글로벌 네비게이션 진입점 확정 (설정, 모듈 관리, 로그아웃) - shell
- [x] 글로벌 네비게이션 Marketplace 진입점 추가 (사이드바 Workspace 섹션)
- [ ] 글로벌 네비게이션 상세 규격 확정 (메뉴 순서, 아이콘, 모바일 Drawer, 키보드 탐색)
- [x] 사이드바(LNB) 고정 레이아웃 구현 (모듈 간 즉시 이동 및 딥 링크 지원)
- [ ] 딥 링크(Deep Link) 라우팅 검증 (URL 직접 진입 시 해당 모듈 즉시 로드)
- [x] Home 공통 상태 정의 (Loading, Empty, Error, Unauthorized) - mock 상태 전환 기준 반영
- [ ] 첫 로그인 사용자용 온보딩 진입 UX 정의 (튜토리얼/다음 행동 안내)

#### 1.5.5 관리자 대시보드 / 일반 설정
**예상 기간: 4일**

- [x] 일반 설정 화면 뼈대 구현 (프로필/언어/테마) - shell
- [ ] 개인화 설정: 로그인 후 첫 화면(Home vs 특정 모듈) 선택 옵션 구현
- [x] 관리자 전용 영역 라우트 분리 - shell
- [x] 관리자 PIN Step-up 모달 흐름 구현 (isAdmin/isPinVerified 분리, 비관리자 진입점 숨김)
- [x] Protected Route 정책 구현 (권한 부족 시 리다이렉트) - shell
- [ ] 관리자 PIN 관리 UI 구현 (최초 설정/변경/오류 처리)
- [ ] 관리자 세션 만료 UX 구현 (30분 만료 시 재인증 모달)
- [ ] 일반 설정 저장 UX 보강 (저장 성공/실패, 미저장 변경 경고)
- [ ] 관리자 활동/감사 로그 화면 진입점 정의 (PIN 실패/주요 설정 변경 확인)

#### 1.5.6 UX 품질 기준
**예상 기간: 2일**

- [ ] 데스크톱/모바일 반응형 기준 확인
- [ ] 에러/빈 상태/권한 거부 상태 일관성 점검
- [ ] 핵심 플로우 QA 체크리스트 작성
- [ ] "설치 -> 로그인 -> 홈 -> 설정" E2E 시나리오 정의
- [ ] 접근성 QA 체크리스트 작성 (focus order, aria label/role, 대비, 키보드 전용 조작)
- [ ] 텍스트/피드백 톤 가이드 통일 (성공/실패/경고 문구 일관성)
- [ ] E2E 확장 시나리오 정의 (설치 실패 복구, 비밀번호 복구, 관리자 PIN 만료 재인증)

### 마일스톤 1.5 완료 기준
- ✅ 모듈 없이도 Core UI Shell이 정상 동작
- ✅ 로그인/권한/관리자 PIN 흐름이 일관되게 작동
- ✅ 설치 마법사 4단계(Welcome/Config/Progress/Complete) 동작
- ✅ 일반 설정 진입 및 저장 플로우 검증 완료
- ✅ Phase 2 모듈 UI를 붙일 수 있는 라우팅/레이아웃 기반 확보

### Phase 2 진입 게이트 (권장)
- [x] Control 패키지 MVP 완료 (P0/P0.5 구현 완료 — `packages/controls` 반영 + `ready: true`)
- [x] Auth/Install/Home/Settings/Admin 흐름에서 공통 Control 재사용 검증
- [ ] 접근성/반응형/상태 처리(Loading/Empty/Error/Unauthorized) 기준 통과
- [ ] 핵심 E2E 통과 (설치 -> 로그인 -> 홈 -> 설정/관리자)
- [ ] UI 계약 동결 (Phase 2에서는 신규 Control 추가보다 모듈 기능 구현 우선)
- [ ] 신규 Control은 예외적으로 수요 기반 추가 (모듈 요구사항/커뮤니티 제안 시 배치 처리)

---

## Phase 1.9: 백엔드 기반 구축 (Phase 2 선행 필수)

> **Phase 2 진입 전 반드시 완료해야 하는 작업입니다.**
> Ledger/Subscription 모듈 개발은 실제로 동작하는 API 서버와 DB 연결 없이는 불가능합니다.
> UI Shell(Phase 1.5)이 완료된 후, Phase 2 착수 전에 이 구간을 반드시 작업하고 넘어갑니다.

### 목표
모든 시스템의 공통 기반이 되는 API 서버와 DB 레이어를 실제로 동작하는 상태로 만든다.

### 주요 작업

#### 1.9.1 API 서버 부트스트랩
**예상 기간: 3일**

- [x] HTTP 서버 프레임워크 세팅 (Express 5 — `apps/api/src/index.ts` + `app.ts` 팩토리 분리)
- [x] 라우터 구조 설계 및 기본 미들웨어 등록 (CORS, JSON 파싱, 에러 핸들러)
- [ ] 모듈 로더와 HTTP 서버 연결 (스캔된 모듈 라우트를 실제 서버에 마운트 — Phase 1.9.2 DB 완료 후)
- [x] 헬스체크 엔드포인트 (`GET /health`)
- [x] 환경변수 스키마 검증 (Zod 기반, 시작 시 필수값 누락 시 즉시 실패)

#### 1.9.2 DB 레이어 구현
**예상 기간: 1주**

> **DB 우선순위 결정 (2026-04-14):**
> PostgreSQL을 1순위로 구현한다. 재무 데이터 특성(ACID, decimal 정확도), 멀티 유저 동시 write,
> Phase 2 복잡 쿼리를 고려하면 PostgreSQL이 더 적합하다.
> SQLite는 경량 단독 인스턴스용으로 2순위 구현 대상으로 유지한다.
> 개발 환경은 Docker Compose로 PostgreSQL을 띄우는 방식을 기본으로 한다.

- [ ] Docker Compose 개발 환경 세팅 (PostgreSQL 컨테이너)
- [ ] PostgreSQL Provider 실제 구현 (`packages/core/src/db/providers/postgres.ts`)
- [ ] DB 연결 초기화 및 연결 실패 처리
- [ ] 마이그레이션 러너 실제 동작 구현 (`packages/core/src/db/migrations/`) — `06-migrations.md` 설계 기준
- [ ] DB 프로바이더 추상화 검증 (SQLite 전환 시 코드 변경 최소화 확인)
- [ ] SQLite Provider 구현 (경량 단독 인스턴스용 — 2순위)

#### 1.9.3 인증 백엔드 구현
**예상 기간: 1주**

- [ ] 이메일/비밀번호 로그인 API (`POST /auth/login`)
- [ ] JWT 세션 발급 및 검증 미들웨어
- [ ] Whitelist 검사 로직 연결
- [ ] TOTP 2FA 검증 API (`POST /auth/totp/verify`)
- [ ] 관리자 PIN 검증 API (`POST /auth/pin/verify`)
- [ ] 임시 비밀번호 강제 변경 API (`POST /auth/password/change`)
- [ ] 비밀번호 복구 흐름 API (관리자 토큰 발급 / SMTP 연동은 Phase 2.3으로)

#### 1.9.4 공유 링크 코어 시스템
**예상 기간: 3일**

> 모든 모듈이 공통으로 사용할 수 있는 공개 링크 발행 인프라.
> 청구서, 폼, 프로젝트 현황 등 어떤 데이터든 모듈이 이 코어를 호출하면 공개 링크를 발행할 수 있다.
> 상세 설계는 `technical/08-shared-link.md` 참고.

- [ ] 공유 링크 DB 스키마 (`shared_links` 테이블 — 토큰, 대상 리소스, 만료일, 접근 제한 등)
- [ ] 링크 발행 API (`POST /core/share`) — 모듈이 호출하는 공통 엔드포인트
- [ ] 링크 조회 API (`GET /s/:token`) — 비인증 공개 접근, 토큰 유효성 검증
- [ ] 만료/비밀번호/접근 횟수 제한 옵션 지원
- [ ] 링크별 접근 로그 기록 (접속 시각, IP)
- [ ] 링크 무효화 API (`DELETE /core/share/:token`)

### 마일스톤 1.9 완료 기준
- ✅ `pnpm dev` 실행 시 API 서버가 실제로 기동되고 요청을 처리함
- ✅ SQLite 기반 DB 연결 및 마이그레이션이 실제로 동작함
- ✅ 로그인 → JWT 발급 → 인증 미들웨어 보호 라우트 접근이 실제로 동작함
- ✅ 프론트엔드 Shell의 mock 인증이 실제 API 호출로 교체 가능한 상태
- ✅ 공유 링크 발행 및 접근이 실제로 동작함

### 🔄 Phase 1.5 진행 이력

| 날짜 | 내용 |
|------|------|
| 2026-02-26 | P0, P0.5 Control 타입 계약 정의 및 export 반영 완료. 상세 구현 상태는 `ui/03-control-backlog.md` 기준으로 추적 |
| 2026-02-27 | Web 진입점을 React + TypeScript + Vite(`main.tsx`) 기준으로 전환 완료. 개발 실행 모드에 `dev:bypass` 추가. bypass 정책을 "설치만 스킵, 인증은 로그인부터"로 확정 |
| 2026-04-12 | 1차 UI/UX 전면 개편. 다크 모드 디자인 토큰 시스템 구축 및 고정 220px 좌측 사이드바 레이아웃으로 재설계. AppShell A/B/C/D 변형 폐기 후 단일 Shell로 통합. 로그인/홈/설정/관리자 CSS 전체를 다크 토큰 기반으로 전환 |
| 2026-04-12 | 임시 비밀번호 첫 로그인 강제 변경 화면(ChangePasswordView) 구현. 관리자 역할(isAdmin)과 PIN 인증(isPinVerified) 상태 분리 — 역할 보유자도 Admin 페이지 진입 시 PIN 재인증 필요. 비관리자 Admin 진입점 사이드바에서 숨김. Marketplace 사이드바 진입점 추가(Phase 3 플레이스홀더). @fieldstack/core ESM 빌드 전환 |
| 2026-04-13 | P0/P0.5 Control 전 항목 `packages/controls`에 React 컴포넌트 구현 완료 (`ready: true`). `controls.css` 작성(fs- 접두사). `global.css` 토큰을 라이트 기본값 + 다크 오버라이드(`[data-theme]`/`prefers-color-scheme`) 구조로 재설계. Settings 테마 셀렉터 실제 동작 연결 (localStorage + data-theme 적용). |

---

## Phase 1.95: Setup 설치 마법사

### 목표
처음 실행하는 사용자가 관리자 계정·DB·초기 설정을 완료하고 메인 앱으로 진입할 수 있는 독립된 설치 경험을 제공한다.

> **선행 조건:** Phase 1.9 (API 서버 + DB 레이어 + 인증 백엔드) 완료 후 착수.
> UX 레퍼런스: Synology DSM 초기 설정, Windows 설치 마법사 스타일.

### 아키텍처 원칙

- **모드 분리**: `installed.lock` 파일 존재 여부로 Setup 모드 / 앱 모드를 구분
- **같은 서버, 다른 모드**: 완전히 별도 프로세스가 아닌 동일 서버에서 모드 전환
- **메인 앱은 설치 완료를 전제**: 앱 코드 전반에 "미설치 상태" 방어 코드 불필요

```
첫 실행 (installed.lock 없음)
  └─ Setup 모드로 서버 기동 → Setup UI만 서빙
       └─ 설치 완료 → installed.lock 생성 → 서버 재시작
            └─ 앱 모드로 전환

완전 초기화 (공장 초기화)
  └─ DB 초기화 + installed.lock 삭제 → 서버 재시작
       └─ Setup 모드로 자동 복귀 (설치 첫날과 동일한 흐름)
```

### 주요 작업

#### 1.95.1 모드 전환 시스템
**예상 기간: 2일**

- [ ] `installed.lock` 기반 Setup/앱 모드 감지 로직
- [ ] Setup 모드일 때 메인 앱 라우트 전체 차단 (Setup UI만 응답)
- [ ] 설치 완료 시 `installed.lock` 생성 후 서버 자동 재시작 처리
- [ ] 완전 초기화 시 DB + `installed.lock` 삭제 → 서버 재시작 → Setup 모드 복귀

#### 1.95.2 Setup 백엔드 API
**예상 기간: 3일**

- [ ] 설치 상태 조회 (`GET /setup/status`)
- [ ] 관리자 계정 생성 (`POST /setup/admin`)
- [ ] DB 연결 테스트 (`POST /setup/db/test`)
- [ ] 초기 설정 저장 및 설치 완료 처리 (`POST /setup/complete`)
- [ ] 설치 진행 중 상태 스트리밍 (WebSocket 또는 SSE)
- [ ] 완전 초기화 API (`POST /admin/factory-reset`) — 관리자 PIN 재확인 필수

#### 1.95.3 Setup UI (프론트엔드)
**예상 기간: 1주**

- [ ] Welcome 화면 (제품 소개, 시작하기)
- [ ] Configuration 화면
  - [ ] 관리자 계정 설정 (이메일, 비밀번호, PIN)
  - [ ] DB 선택 및 연결 설정 (SQLite 기본 / PostgreSQL 선택)
  - [ ] 선택 옵션 (SMTP, 텔레메트리 동의 등)
- [ ] Progress 화면 (실시간 설치 로그, 단계 표시)
- [ ] Complete 화면 (로그인 진입 안내)
- [ ] 설치 중 새로고침/재접속 복구 (진행 상태 재동기화)
- [ ] 각 단계 유효성 검증 UX (필수값, 형식 오류, DB 연결 테스트 결과)
- [ ] Progress 실패 처리 UX (재시도 / 이전 단계 복귀 / 에러 요약)

#### 1.95.4 부분 초기화 / 완전 초기화 UI
**예상 기간: 2일**

- [ ] 관리자 설정 화면에 초기화 옵션 추가
- [ ] 부분 초기화 (데이터만 삭제, 계정·설정 유지) — `installed.lock` 유지
- [ ] 완전 초기화 (전체 삭제 + Setup 모드 복귀) — 관리자 PIN 재확인 + 2단계 경고

### 마일스톤 1.95 완료 기준
- ✅ 첫 실행 시 Setup 모드로 자동 진입, 설치 완료 후 앱 모드로 전환
- ✅ 관리자 계정 / DB 설정 / 선택 옵션을 Setup에서 모두 처리
- ✅ 완전 초기화 실행 시 Setup 모드로 자동 복귀
- ✅ 설치 중 새로고침해도 진행 상태 유지

---

## Phase 2: 기본 모듈 개발 (2개월)

### 목표
핵심 기능 모듈 2개 완성 (가계부, 구독 관리)

> 선행 조건(권장): Phase 1.5 → Phase 1.9 → Phase 1.95 완료 후 착수

### 주요 작업

#### 2.1 Ledger Module (가계부)
**예상 기간: 4주**

**Backend:**
- [ ] DB 스키마 설계 (설계 완료)
- [ ] API 엔드포인트 (설계 완료)
  - [ ] CRUD (생성, 조회, 수정, 삭제)
  - [ ] 통계 API
  - [ ] 검색/필터
- [ ] 비즈니스 로직
- [ ] 검증 로직
- [ ] 테스트

**Frontend:**
- [ ] 목록 페이지
- [ ] 상세 페이지
- [ ] 생성/수정 폼
- [ ] 통계 대시보드
- [ ] 차트 시각화 (recharts)
- [ ] 테스트

**기능:**
- [ ] 수입/지출 기록
- [ ] 카테고리 관리
- [ ] 결제 수단 관리
- [ ] 월별/연도별 통계
- [ ] CSV 내보내기
- [ ] 영수증 첨부 (선택)
- [ ] 사업자 관련

#### 2.2 Subscription Module (구독 관리)
**예상 기간: 4주**

**Backend:**
- [ ] DB 스키마 설계 (설계 완료)
- [ ] API 엔드포인트 (설계 완료)
- [ ] Google Calendar 연동 (설계 완료)
- [ ] 알림 시스템 (Scheduler) (설계 완료)
- [ ] 테스트

**Frontend:**
- [ ] 구독 목록
- [ ] 구독 추가/수정
- [ ] 대시보드
- [ ] 결제일 캘린더 뷰
- [ ] 테스트

**기능:**
- [ ] 구독 서비스 등록
- [ ] 결제일 추적
- [ ] Google Calendar 자동 등록
- [ ] 결제일 알림 (D-7, D-3, D-1)
- [ ] 월간/연간 구독료 계산
- [ ] Ledger Module (가계부) 연동

#### 2.3 SMTP 연동
**예상 기간: 1주**

- [ ] Admin 설정 화면에 SMTP 입력 항목 구현 (호스트, 포트, 보안, 사용자명, 비밀번호, 발신자)
- [ ] SMTP 비밀번호 암호화 저장 (AES-256)
- [ ] 테스트 이메일 발송 기능
- [ ] 비밀번호 복구 이메일 실제 발송 연동
- [ ] 신규 유저 임시 비밀번호 자동 발송 (SMTP 설정 완료 시)
- [ ] SMTP 미설정 시 관리자 수동 발급 안내 UX

#### 2.5 통합 및 테스트
**예상 기간: 1주**

- [ ] Ledger ↔ Subscription 연동
  - 결제일에 자동으로 가계부 기록
- [ ] E2E 테스트
- [ ] 성능 테스트
- [ ] 사용자 테스트

### 마일스톤 2 완료 기준
- ✅ 가계부 모듈 완전 작동
- ✅ 구독 관리 모듈 완전 작동
- ✅ 두 모듈 연동
- ✅ SMTP 연동 및 이메일 발송 작동
- ✅ 사용 가능한 MVP

---

## Phase 3: 마켓플레이스 & 웹사이트 (2개월)

### 목표
커뮤니티 생태계 구축

### 주요 작업

#### 3.1 Module Registry 구축
**예상 기간: 2주**

- [ ] GitHub 저장소 생성
- [ ] modules.json 스키마 정의
- [ ] 제출 프로세스 설계
- [ ] 자동 검증 (GitHub Actions)
- [ ] 보안 스캔 시스템

#### 3.2 공식 웹사이트 개발
**예상 기간: 4주**

**기술 스택:**
- Docusaurus(개발자 문서) / GitBook(사용자 문서)
- Cloudflare Pages

**페이지:**
- [ ] 홈페이지
- [ ] 마켓플레이스
  - [ ] 모듈 목록
  - [ ] 모듈 상세
  - [ ] 검색/필터
  - [ ] 통계 대시보드
- [ ] 문서
  - [ ] 사용자 가이드
  - [ ] 개발자 가이드 (API 문서 포함)
- [ ] 블로그
- [ ] 커뮤니티

#### 3.3 앱 내 Module Manager
**예상 기간: 3주**

**Backend:**
- [ ] 모듈 설치 API
- [ ] 모듈 제거 API
- [ ] 모듈 업데이트 API
- [ ] 통계 전송 API

**Frontend:**
- [ ] 설치된 모듈 관리
- [ ] 마켓플레이스 검색
- [ ] 원클릭 설치/제거
- [ ] 업데이트 확인
- [ ] 모듈 ON/OFF 토글

#### 3.4 통계 수집 시스템
**예상 기간: 1주**

- [ ] Cloudflare Workers + KV
- [ ] 다운로드 카운트
- [ ] 인기 모듈 랭킹
- [ ] 대시보드 차트

### 마일스톤 3 완료 기준
- ✅ 공식 웹사이트 오픈
- ✅ 마켓플레이스 작동
- ✅ 앱 내 모듈 관리 기능
- ✅ 통계 시스템 작동

---

## Phase 3.5: 텔레메트리 & 통계 수집 시스템

### 목표
앱 사용 데이터와 오류 정보를 수집·분석하여 개발 의사결정과 마켓플레이스 운영에 활용

> Phase 3 마켓플레이스 개발 시점에 함께 설계·구현. 마켓플레이스 서버 인프라(Cloudflare Workers 등)와 공유.

### 수집 범위 원칙
- 사용자 동의 기반 (설치 마법사 단계에 동의 항목 포함)
- 개인정보 미포함 — 익명 설치 UUID 기반
- 개발 개선 및 마켓플레이스 운영 목적에 한정

### 주요 작업

#### 3.5.1 앱 텔레메트리 (Fieldstack 앱 → 수집 서버)
**예상 기간: 1주**

- [ ] 설치 마법사에 텔레메트리 동의 항목 추가 (opt-out 선택 가능)
- [ ] 익명 설치 UUID 생성 및 관리
- [ ] 오류/크래시 로그 수집 (에러 메시지, 스택 트레이스, 발생 컨텍스트)
- [ ] 기능 사용 빈도 수집 (어떤 모듈·기능이 많이 쓰이는지)
- [ ] 앱 버전·환경 정보 수집 (Node.js 버전, OS, DB 타입)
- [ ] 수집 엔드포인트 구현 (`/telemetry/...`)
- [ ] 개인정보 필터링 레이어 (입력값 원문 제거, 경로 마스킹)

#### 3.5.2 마켓플레이스 통계 연계 (Phase 3.4 확장)
**예상 기간: 3일**

- [ ] 모듈 설치·제거·업데이트 이벤트 수집
- [ ] 모듈별 오류 발생률 집계
- [ ] 인기 모듈 랭킹 데이터 연계 (Phase 3.4 다운로드 카운트와 통합)

#### 3.5.3 수집 인프라
**예상 기간: 3일**

- [ ] 마켓플레이스 서버와 동일 인프라 공유 (별도 서버 불필요)
- [ ] 수집 데이터 DB 스키마 설계 (텔레메트리 전용 테이블/스키마 분리)
- [ ] 수집 데이터 보존 정책 정의 (보관 기간, 자동 삭제)
- [ ] 관리자용 텔레메트리 대시보드 (오류 빈도, 버전 분포 등)

### 마일스톤 3.5 완료 기준
- ✅ 동의 기반 텔레메트리 수집 작동
- ✅ 오류 로그 자동 수집 및 서버 전송
- ✅ 마켓플레이스 통계와 단일 인프라에서 운영
- ✅ 개인정보 필터링 검증 완료

---

## Phase 4: 배포 최적화 (1개월)

### 목표
쉬운 설치와 자동 업데이트

### 주요 작업

#### 4.1 Setup 설치 마법사 고도화
**예상 기간: 1주**

> Setup 설치 마법사 핵심 구현은 **Phase 1.95**에서 완료됩니다.
> Phase 4에서는 배포 환경에 맞는 고도화 항목만 다룹니다.

- [ ] AI 설정 연동 옵션 추가 (Phase 1.95 Configuration 화면 확장)
- [ ] Google 연동 옵션 추가
- [ ] 모듈 선택 화면 추가 (마켓플레이스 연동, Phase 3 이후 가능)
- [ ] Docker / Railway 등 배포 환경별 설치 흐름 검증

#### 4.2 설정 관리 UI
**예상 기간: 1주**

- [ ] 일반 설정
- [ ] AI 설정
- [ ] 데이터베이스
- [ ] 통합 서비스
- [ ] 모듈 관리
- [ ] 시스템 설정

#### 4.3 자동 업데이트 시스템
**예상 기간: 2주**

- [ ] 업데이트 체커 (Scheduler)
- [ ] 시간대 지정
- [ ] 활성 사용자 확인
- [ ] 백업 자동 생성
- [ ] 유지보수 모드
- [ ] 롤백 기능
- [ ] 알림 시스템

#### 4.4 배포 템플릿
**예상 기간: 1주**

- [ ] Docker Compose 최적화
- [ ] Railway 템플릿
- [ ] Cloudflare 가이드
- [ ] 설치 문서 개선

### 마일스톤 4 완료 기준
- ✅ 5분 내 설치 가능
- ✅ 웹 UI로 모든 설정 가능
- ✅ 자동 업데이트 작동
- ✅ 다양한 플랫폼 지원

---

## Phase 5: 확장 및 생태계 (3개월)

### 목표
추가 모듈과 고급 기능

### 주요 작업

#### 5.1 Scheduler Plugin
**예상 기간: 2주**

- [ ] Cron 표현식 지원
- [ ] 작업 등록/관리
- [ ] 실행 로그
- [ ] 웹 UI 관리 페이지

#### 5.2 TODO Module
**예상 기간: 3주**

- [ ] 할 일 생성/관리
- [ ] 우선순위
- [ ] 마감일
- [ ] 카테고리/태그
- [ ] 완료 통계

#### 5.3 Project Module
**예상 기간: 4주**

- [ ] 프로젝트 생성/관리
- [ ] 외주 정보 기록
- [ ] 일정 관리
- [ ] 예산/정산
- [ ] 클라이언트 관리

#### 5.4 AI 요약 자동화
**예상 기간: 2주**

- [ ] 월간 가계부 요약
- [ ] 지출 패턴 분석
- [ ] 구독 최적화 제안
- [ ] 프로젝트 리포트

#### 5.5 통합 서비스 확장
**예상 기간: 2주**

- [ ] Notion 연동
- [ ] Slack 연동
- [ ] GitHub 연동
- [ ] 커스텀 Webhook

### 마일스톤 5 완료 기준
- ✅ 5개 이상 공식 모듈
- ✅ AI 자동화 작동
- ✅ 다양한 통합 서비스
- ✅ 완성도 높은 생태계

---

## Phase 6: 커뮤니티 성장 (지속적)

### 목표
커뮤니티 활성화 및 지속 가능성

### 주요 작업

#### 6.1 커뮤니티 구축
- [ ] Discord 서버 운영
- [ ] 월간 뉴스레터
- [ ] YouTube 튜토리얼
- [ ] 블로그 정기 업데이트

#### 6.2 이벤트 및 프로모션
- [ ] 해커톤 개최
- [ ] 모듈 개발 콘테스트
- [ ] 사용자 스토리 공유

#### 6.3 문서 및 교육
- [ ] 한국어 문서 완성
- [ ] 영어 번역
- [ ] 비디오 튜토리얼
- [ ] 모듈 개발 워크샵

#### 6.4 생태계 확장
- [ ] 커뮤니티 모듈 10개+
- [ ] 파트너십 (도구, 서비스)
- [ ] 기여자 100명+

---

## 릴리스 일정 (예상)

### v1.0.0 - MVP (Phase 1-2 완료)
**예상 날짜: 2026년 10월** *(기존 2026년 5월 → 개인 예산 이슈로 인한 취미 수준 개발 페이스 반영)*

**포함 내용:**
- Core 레이어
- Ledger 모듈
- Subscription 모듈
- 기본 문서

**목표:**
- 혼자 사용 가능한 완전한 시스템
- Self-hosted 가능
- 안정적인 동작

### v1.5.0 - 마켓플레이스 (Phase 3 완료)
**예상 날짜: 2026년 7월**

**포함 내용:**
- 공식 웹사이트
- 마켓플레이스
- 앱 내 모듈 관리
- 통계 시스템

**목표:**
- 커뮤니티 생태계 시작
- 모듈 설치/제거 간편화

### v2.0.0 - 완전체 (Phase 4-5 완료)
**예상 날짜: 2026년 10월**

**포함 내용:**
- 웹 기반 설치 마법사
- 자동 업데이트
- TODO, Project 모듈
- AI 자동화
- 통합 서비스 확장

**목표:**
- 프로덕션 레디
- 비개발자도 쉽게 사용
- 완성도 높은 생태계

### v3.0.0 - 차세대 (Phase 6+)
**예상 날짜: 2027년 1분기**

**포함 내용:**
- 모바일 앱
- 고급 AI 기능
- 더 많은 통합 서비스
- 다국어 지원 확대

**목표:**
- 글로벌 커뮤니티
- 10,000+ 사용자
- 100+ 커뮤니티 모듈

---

## 우선순위

### P0 (최우선)
- Core 레이어 안정성
- 기본 인증/보안
- Ledger 모듈
- 문서

### P1 (높음)
- Subscription 모듈
- Module Loader
- 마켓플레이스
- 설치 마법사

### P2 (중간)
- TODO 모듈
- Project 모듈
- 자동 업데이트
- AI 자동화

### P3 (낮음)
- 모바일 앱
- 고급 AI 기능
- 추가 통합 서비스

---

## 리스크 및 대응

### 리스크 1: 개발 지연
**대응:**
- Phase 단위로 독립적 완성도
- MVP 먼저, 확장은 나중에
- 커뮤니티 기여 활성화

### 리스크 2: 커뮤니티 부족
**대응:**
- 초기부터 문서화 철저히
- 쉬운 기여 방법 제공
- 활발한 소통

### 리스크 3: 기술 부채
**대응:**
- 정기적인 리팩토링
- 코드 리뷰 철저히
- 테스트 커버리지 유지

### 리스크 4: 보안 이슈
**대응:**
- 정기적인 보안 감사
- 의존성 업데이트
- 커뮤니티 신고 시스템

---

## 성공 지표

### 기술적 지표
- [ ] 테스트 커버리지 > 70%
- [ ] 빌드 시간 < 2분
- [ ] 응답 시간 < 200ms
- [ ] 버그 해결 시간 < 7일

### 커뮤니티 지표
- [ ] GitHub Stars > 1,000
- [ ] 활성 기여자 > 50명
- [ ] 커뮤니티 모듈 > 20개
- [ ] Discord 멤버 > 500명

### 사용자 지표
- [ ] 월 활성 사용자 > 1,000명
- [ ] 설치 성공률 > 90%
- [ ] 사용자 만족도 > 4.5/5

---

## 장기 비전 (2-3년)

- 개인 금융 관리의 표준
- Self-hosted 생태계의 모범 사례
- 10,000+ 활성 사용자
- 100+ 커뮤니티 모듈
- 글로벌 커뮤니티

**하지만:**
- 여전히 완전 무료
- 여전히 Self-hosted 우선
- 여전히 커뮤니티 중심
