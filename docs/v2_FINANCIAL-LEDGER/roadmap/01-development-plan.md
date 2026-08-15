# 단계별 개발 계획

> 📌 **프로젝트 상태:** 2026-04-23 기준 **Phase 2.2 Subscription 모듈 진행 중 (핵심 기능 완료, 잔여 항목 지속 작업)**.
> - Phase 1.5 전 항목 완료 (Core UI Shell / 로그인 / 홈 / 설정 / 관리자).
> - Phase 1.9 완료 (API 서버 + DB + 인증 백엔드 + 공유 링크).
> - Phase 1.95 전 항목 완료 (모드 전환·Setup 백엔드 API·Setup UI·초기화 UI).
> - Phase 2 사전 작업 완료 (ModuleRegistry·모듈 관리 API·Admin UI 연동·유저별 모듈 활성화).
> - Phase 2.1 Ledger 백엔드 완료 (CRUD·통계·CSV export/import·카테고리·결제수단·예산·영수증 첨부 API).
> - Phase 2.1 Ledger 프론트엔드 완료 (목록·폼·요약 카드·카테고리·결제수단 관리·상세 패널·SVG 차트·예산 현황·CSV import 2단계 모달·영수증 첨부). 테스트: 개발 중 수동 검증으로 대체.
> - Phase 2.x.2 i18n 전 항목 완료 (i18next·ko/en 번역·Settings 언어 전환·Ledger 번역·모듈 로케일 자동 등록·displayName·description i18n 키 전환·언어 서버 저장·모듈 템플릿 locales 추가). 미완료: Setup 언어 선택.
> - 환율 시스템 완료 (`exchange_rates` 테이블·Frankfurter API 클라이언트·캐시 우선 서비스·`/core/exchange-rates` API 엔드포인트).
> - Phase 2.x.3 Event Bus & Service Registry 완료. Phase 2.x.4 Core Scheduler 완료 (`node-cron`·DB 로그·재시도·Asia/Seoul).
> - Phase 2.2 Subscription 핵심 기능 완료 (DB 스키마·API·Scheduler 결제일 체크·Event Bus 연동·프론트 목록/추가/수정/상세 패널/누적 통계/가격 히스토리/메모). 잔여: Google Calendar·결제일 캘린더 뷰·Ledger 수신 연동·시간대 전략(표시/계산 분리) 고도화.

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
- [x] 로그인 실패/잠금/세션 만료 UX 정의

  > 실패 시 버튼 아래 인라인 에러 텍스트 표시. 5회 실패 시 30분 잠금(Alert). 세션 만료 알림 버튼 아래 표시.
  > 잠금 임박(3회~) 경고 표시. 폼 전체 disabled 처리.
- [x] 로그인 성공 후 Home 리다이렉트 규칙 확정 (mock)
- [x] Mock 계정 시스템 구현 (이메일+비밀번호 세트 — admin/user 계정 분리, 로그인 시 역할 자동 적용)
- [x] 임시 비밀번호 첫 로그인 시 강제 변경 화면 구현 (정책 체크리스트 포함)
- [x] 비밀번호 복구 UI 구현 (이메일 재설정 경로 + 관리자 토큰 복구 경로)

  > `ForgotPasswordView` 3단계 재구성: 경로 선택 → 이메일 입력(전송 완료) / 이메일+토큰 입력 → 새 비밀번호 설정 → 완료.
  > 관리자 토큰은 이메일과 토큰을 함께 검증하는 구조로 설계 (실제 API 연결 시 서버 측 쌍 검증).
  > 이메일 경로는 링크 클릭 시 새 비밀번호 입력 화면으로 직접 이동하는 흐름 (API 연결 시 구현).
- [x] OAuth/Passkey 로그인 진입 UI 정책 정의 (서버에서 enabled 플래그 수신 시에만 노출 — Phase 1.95+)
- [x] 인증 실패 메시지 규칙 통일 (계정 존재 여부 비노출, 이메일/비밀번호 구분 없이 동일 메시지)

#### 1.5.4 Main Home
**예상 기간: 3일**

- [x] Home 화면 정보 구조 확정 (요약 영역, 빠른 액션, 최근 활동) - shell
- [x] 모듈 0개 상태 Empty UX 구현 (안내 + 다음 행동 CTA)
- [x] 관리자/일반 사용자 홈 표시 정책 분리
- [x] 글로벌 네비게이션 진입점 확정 (설정, 모듈 관리, 로그아웃) - shell
- [x] 글로벌 네비게이션 Marketplace 진입점 추가 (사이드바 Workspace 섹션)
- [x] 글로벌 네비게이션 상세 규격 확정 (메뉴 순서 Workspace→Modules→Footer, 아이콘 확정, 모바일 Drawer 768px, ArrowKey 키보드 탐색)
- [x] 사이드바(LNB) 고정 레이아웃 구현 (모듈 간 즉시 이동 및 딥 링크 지원)
- [x] 딥 링크(Deep Link) 라우팅 검증 (비인증 상태 #admin/#marketplace 진입 → 로그인 후 원래 route 복귀)
- [x] Home 공통 상태 정의 (Loading, Empty, Error, Unauthorized) - mock 상태 전환 기준 반영
- [x] 첫 로그인 사용자용 온보딩 진입 UX 정의 (첫 로그인 시 dismissible 환영 배너, localStorage 기반 1회 표시)

#### 1.5.5 관리자 대시보드 / 일반 설정
**예상 기간: 4일**

- [x] 일반 설정 화면 뼈대 구현 (프로필/언어/테마) - shell
- [x] 개인화 설정: 로그인 후 첫 화면(Home vs Marketplace) 선택 옵션 구현 (localStorage fs_startup_route, 저장 시 반영)
- [x] 관리자 전용 영역 라우트 분리 - shell
- [x] 관리자 PIN Step-up 모달 흐름 구현 (isAdmin/isPinVerified 분리, 비관리자 진입점 숨김)
- [x] Protected Route 정책 구현 (권한 부족 시 리다이렉트) - shell
- [x] 관리자 PIN 관리 UI 구현 (AdminView 보안 설정 패널 — 현재/새 PIN 입력, 유효성 검증, 성공/오류 상태)
- [x] 관리자 세션 만료 UX 구현 (30분 만료 시 재인증 모달)
- [x] 일반 설정 저장 UX 보강 (저장 성공/실패, 미저장 변경 경고)

  > 변경 감지(dirty state) 구현 — 변경 없으면 저장 버튼 비활성화. 저장 클릭 시 로딩(500ms) 후 모달 닫힘 + notice 표시. 미저장 상태에서 닫기 시 브라우저 기본 confirm 창으로 경고.
- [x] 관리자 활동/감사 로그 화면 진입점 정의 (AdminView master-detail 패널 — 전체 로그 10건 + 필터 탭 All/로그인/설정/PIN)

#### 1.5.6 UX 품질 기준
**예상 기간: 2일**

- [x] 데스크톱/모바일 반응형 기준 확인 (브레이크포인트 정의: 768px Drawer, 860px padding, 540px bottom sheet, 980px admin 단일 컬럼, 900px 로그인 단일 컬럼)
- [x] 에러/빈 상태/권한 거부 상태 일관성 점검 (`docs/ui/04-qa-checklist.md` 섹션 3 참고)
- [x] 핵심 플로우 QA 체크리스트 작성 (`docs/ui/04-qa-checklist.md` 섹션 1)
- [x] "설치 -> 로그인 -> 홈 -> 설정" E2E 시나리오 정의 (`docs/ui/04-qa-checklist.md` 섹션 4.1 S-02)
- [x] 접근성 QA 체크리스트 작성 (`docs/ui/04-qa-checklist.md` 섹션 5 — 키보드 탐색, ARIA, 명도 대비, 포커스 가시성)
- [x] 텍스트/피드백 톤 가이드 통일 (notice 문자열 한국어 통일, `docs/ui/04-qa-checklist.md` 섹션 6)
- [x] E2E 확장 시나리오 정의 (`docs/ui/04-qa-checklist.md` 섹션 4.2 — 잠금 복구, PIN 만료 재인증, 임시 비밀번호, 개인화 첫 화면)

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

### 🔄 Phase 1.5 진행 이력

| 날짜 | 내용 |
|------|------|
| 2026-02-26 | P0, P0.5 Control 타입 계약 정의 및 export 반영 완료. 상세 구현 상태는 `ui/03-control-backlog.md` 기준으로 추적 |
| 2026-02-27 | Web 진입점을 React + TypeScript + Vite(`main.tsx`) 기준으로 전환 완료. 개발 실행 모드에 `dev:bypass` 추가. bypass 정책을 "설치만 스킵, 인증은 로그인부터"로 확정 |
| 2026-04-12 | 1차 UI/UX 전면 개편. 다크 모드 디자인 토큰 시스템 구축 및 고정 220px 좌측 사이드바 레이아웃으로 재설계. AppShell A/B/C/D 변형 폐기 후 단일 Shell로 통합. 로그인/홈/설정/관리자 CSS 전체를 다크 토큰 기반으로 전환 |
| 2026-04-12 | 임시 비밀번호 첫 로그인 강제 변경 화면(ChangePasswordView) 구현. 관리자 역할(isAdmin)과 PIN 인증(isPinVerified) 상태 분리 — 역할 보유자도 Admin 페이지 진입 시 PIN 재인증 필요. 비관리자 Admin 진입점 사이드바에서 숨김. Marketplace 사이드바 진입점 추가(Phase 3 플레이스홀더). @fieldstack/core ESM 빌드 전환 |
| 2026-04-13 | P0/P0.5 Control 전 항목 `packages/controls`에 React 컴포넌트 구현 완료 (`ready: true`). `controls.css` 작성(fs- 접두사). `global.css` 토큰을 라이트 기본값 + 다크 오버라이드(`[data-theme]`/`prefers-color-scheme`) 구조로 재설계. Settings 테마 셀렉터 실제 동작 연결 (localStorage + data-theme 적용). |
| 2026-04-14 | Phase 1.5.3 로그인 UX 개선 완료. 로그인 실패/잠금/세션 만료 UX 구현 (인라인 에러 텍스트, 5회 잠금 Alert, 30분 잠금). `ForgotPasswordView` 전면 재구성 — 경로 선택(이메일/관리자 토큰) → 각 경로별 단계 흐름 구현. 관리자 토큰 경로에 이메일+토큰 쌍 검증 구조 추가. Mock 계정 시스템 도입 (admin@/user@ 세트, 로그인 시 역할 자동 적용). `@fieldstack/core/browser` 브라우저 전용 엔트리포인트 분리 — Vite 번들링 시 Node.js 전용 패키지(jsonwebtoken 등) 포함 문제 해결. |
| 2026-04-15 | 관리자/사용자 홈 분리 완료. HomeView에 `isAdmin` prop 추가 — 관리자 로그인 시 Admin Overview 배너(활성 사용자·설치 모듈·시스템 상태 카드) 표시, Admin 패널 바로가기 버튼 제공. 관리자 PIN 세션 30분 자동 만료 구현 — `pinVerifiedAt` 타임스탬프 기반 setTimeout, 만료 시 notice 표시 및 AdminView 재인증 게이트 자동 복원. |
| 2026-04-15 | Phase 1.5.4 Main Home 잔여 항목 완료. 글로벌 네비게이션 상세 규격 확정 (메뉴 순서·아이콘·키보드 탐색). 모바일 Drawer 구현 — 768px 이하 햄버거 버튼 + 슬라이드인 오버레이 사이드바 + 배경 클릭 닫기. 딥 링크 라우팅 — 비인증 상태에서 앱 route 직접 진입 시 로그인 후 원래 route로 자동 복귀. 첫 로그인 온보딩 배너 — localStorage 기반 1회 표시, 닫기 버튼으로 영구 dismiss. |
| 2026-04-15 | Phase 1.5.5 일반 설정 저장 UX 완료. SettingsView dirty state 감지, 저장 로딩 피드백, 미저장 변경 시 브라우저 confirm 경고 구현. |
| 2026-04-15 | Phase 1.5.6 UX 품질 기준 완료. 텍스트 톤 통일(notice 문자열 한국어). 반응형 브레이크포인트 정의(768/860/540/980/900px). `docs/ui/04-qa-checklist.md` 작성 — 핵심 플로우 QA 30항목, 반응형 체크, 에러/빈 상태/권한 거부 일관성 매트릭스, E2E 시나리오 9개(핵심 5 + 확장 4), 접근성 체크리스트(키보드/ARIA/명도/포커스), 피드백 톤 가이드. |
| 2026-04-15 | Phase 1.5.5 관리자 대시보드 / 일반 설정 잔여 항목 완료. Settings '로그인 후 첫 화면' 개인화 옵션 추가(fs_startup_route). AdminView master-detail 패널 시스템 도입 — 섹션 클릭 시 오른쪽 패널 전환. 보안 설정 패널에 PIN 변경 폼 구현(현재/새 PIN 유효성 검증, 성공 화면). 감사 로그 패널에 전체 로그(10건) + 필터 탭(전체/로그인/설정/PIN) 구현. |

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
- [x] 모듈 로더와 HTTP 서버 연결 (스캔된 모듈 라우트를 실제 서버에 마운트 — Phase 1.9.2 DB 완료 후)
- [x] 헬스체크 엔드포인트 (`GET /health`)
- [x] 환경변수 스키마 검증 (Zod 기반, 시작 시 필수값 누락 시 즉시 실패)

#### 1.9.2 DB 레이어 구현
**예상 기간: 1주**

> **DB 우선순위 결정 (2026-04-14):**
> PostgreSQL을 1순위로 구현한다. 재무 데이터 특성(ACID, decimal 정확도), 멀티 유저 동시 write,
> Phase 2 복잡 쿼리를 고려하면 PostgreSQL이 더 적합하다.
> SQLite는 경량 단독 인스턴스용으로 2순위 구현 대상으로 유지한다.
> 개발 환경은 Docker Compose로 PostgreSQL을 띄우는 방식을 기본으로 한다.

- [x] Docker Compose 개발 환경 세팅 (PostgreSQL 컨테이너)
- [x] PostgreSQL Provider 실제 구현 (`packages/core/src/db/providers/postgres.ts`)
- [x] DB 연결 초기화 및 연결 실패 처리 (5회 지수 백오프 재시도)
- [x] 마이그레이션 러너 실제 동작 구현 (`packages/core/src/db/migrations/`) — `06-migrations.md` 설계 기준
- [x] DB 프로바이더 추상화 검증 (타입체크 전체 통과, Node16 ESM 해석 이슈 수정)
- [x] SQLite Provider 구현 (경량 단독 인스턴스용 — 2순위)

#### 1.9.3 인증 백엔드 구현
**예상 기간: 1주**

- [x] 이메일/비밀번호 로그인 API (`POST /auth/login`)
- [x] JWT 세션 발급 및 검증 미들웨어 (`requireAuth` 미들웨어, 리프레시 토큰 회전)
- [x] Whitelist 검사 로직 연결 (로그인 시 자동 적용)
- [x] TOTP 2FA 검증 API (`POST /auth/totp/verify`, `/totp/enroll`, `/totp/confirm`)
- [x] 관리자 PIN 검증 API (`POST /auth/pin/verify`)
- [x] 임시 비밀번호 강제 변경 API (`POST /auth/password/change`)
- [x] 비밀번호 복구 흐름 API (관리자 토큰 발급 `/auth/password/recovery/issue` · 확인 `/auth/password/recovery/confirm` — SMTP는 Phase 2.3)

#### 1.9.4 공유 링크 코어 시스템
**예상 기간: 3일**

> 모든 모듈이 공통으로 사용할 수 있는 공개 링크 발행 인프라.
> 청구서, 폼, 프로젝트 현황 등 어떤 데이터든 모듈이 이 코어를 호출하면 공개 링크를 발행할 수 있다.
> 상세 설계는 `technical/07-shared-link.md` 참고.

- [x] 공유 링크 DB 스키마 (`shared_links`, `shared_link_logs`, `system_settings` 테이블)
- [x] 링크 발행 API (`POST /core/share`) — 인증된 사용자, 도메인 감지 + admin on/off 검사
- [x] 링크 조회 API (`GET /s/:token`) — 비인증 공개 접근, 토큰 유효성 검증
- [x] 만료/비밀번호/접근 횟수 제한 옵션 지원
- [x] 링크별 접근 로그 기록 (접속 시각, IP, User-Agent)
- [x] 링크 무효화 API (`DELETE /core/share/:token`)
- [x] 내 링크 목록 API (`GET /core/share`)
- [x] 공유 링크 on/off 토글 (`GET|PATCH /core/share/settings`)
- [x] Renderer Registry — 모듈 핸들러 등록 인프라 (실제 핸들러는 각 모듈 구현 시 등록)

### 마일스톤 1.9 완료 기준
> **실제 검증 완료 (2026-04-14)** — Docker Compose PostgreSQL + `node dist/index.js` 환경에서 전 항목 확인

- ✅ API 서버 기동 및 요청 처리 (`GET /health` → `{"status":"ok"}`)
- ✅ PostgreSQL 연결 및 마이그레이션 실제 동작 (001_auth_schema, 002_shared_links 적용 확인)
- ✅ 로그인 → JWT 발급 → 리프레시 토큰 회전 → 인증 미들웨어 보호 라우트 접근
- ✅ 프론트엔드 Shell의 mock 인증이 실제 API 호출로 교체 가능한 상태
- ✅ 공유 링크 도메인 감지·on/off 설정 동작 확인 (PUBLIC_URL 미설정 시 DOMAIN_REQUIRED 반환)

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
- **DB 기본값은 PostgreSQL**: 장기 운영을 고려해 처음부터 PostgreSQL 권장. SQLite는 개발/테스트 전용으로 제공하며 일부 모듈 기능이 정상적으로 작동하지 않을 수 있음.
- **DB 자동 프로비저닝**: Docker / systemd / native 세 가지 런타임을 감지해 가능한 경우 자동 설치. Docker 사용 시 `fieldstack-postgres` 컨테이너를 자동 생성 (`--restart unless-stopped`).

```
첫 실행 (installed.lock 없음)
  └─ Setup 모드로 서버 기동 → Setup UI만 서빙
       └─ 설치 완료 → fieldstack.config.json 저장 → installed.lock 생성 → 서버 재시작
            └─ 앱 모드로 전환 (config → process.env 자동 반영)

완전 초기화 (공장 초기화)
  └─ DB 초기화 + installed.lock + fieldstack.config.json 삭제 → 서버 재시작
       └─ Setup 모드로 자동 복귀 (설치 첫날과 동일한 흐름)
```

### DB 런타임 자동 감지 흐름

```
GET /setup/db/detect
  ├─ Docker   — docker --version + docker info → 컨테이너 자동 생성 가능
  ├─ systemd  — systemctl + postgresql 서비스 탐색 → 서비스 기동 + DB 생성
  └─ native   — pg_isready / postgres 바이너리 탐색 → 이미 실행 중이면 연결

POST /setup/db/provision { runtime: "docker"|"systemd"|"native" }
  ├─ docker  : pull postgres:16-alpine → docker run --restart unless-stopped → 연결 대기
  ├─ systemd : systemctl start → pg_isready 폴링 → fieldstack 유저/DB 생성 (sudo 폴백)
  └─ native  : 실행 중인 pg에 접속 → fieldstack 유저/DB 생성 시도
  └─ (모두 실패) → URL 직접 입력 폴백
```

### 주요 작업

#### 1.95.1 모드 전환 시스템
**예상 기간: 2일**

- [x] `installed.lock` 기반 Setup/앱 모드 감지 로직 (`setup/mode.ts`)
- [x] Setup 모드일 때 메인 앱 라우트 전체 차단 (`createSetupApp()`, `index.ts` 분기)
- [x] 설치 완료 시 `installed.lock` + `fieldstack.config.json` 생성 후 서버 자동 재시작
- [x] `fieldstack.config.json` → `process.env` 자동 반영 (`applyConfigToEnv()`)
- [x] 완전 초기화 시 DB + `installed.lock` + config 삭제 → 서버 재시작 → Setup 모드 복귀

#### 1.95.2 Setup 백엔드 API
**예상 기간: 3일**

- [x] 설치 상태 조회 (`GET /setup/status`) — 앱 모드에서도 `installed: true` 반환
- [x] DB 런타임 감지 (`GET /setup/db/detect`) — Docker / systemd / native 병렬 감지
- [x] DB 자동 프로비저닝 (`POST /setup/db/provision`) — 런타임별 SSE 스트리밍
  - [x] Docker: `postgres:16-alpine` 컨테이너 자동 생성
  - [x] systemd: `systemctl start` + fieldstack 유저/DB 생성
  - [x] native: 실행 중인 PostgreSQL에서 유저/DB 생성 시도
- [x] DB 연결 테스트 (`POST /setup/db/test`)
- [x] 설치 완료 처리 (`POST /setup/complete`) — SSE 스트리밍 (DB→마이그레이션→관리자→config→lock→재시작)
- [x] SQLite 제공자 실제 구현 (`better-sqlite3`, 개발/테스트 전용)
- [x] 마이그레이션 SQLite 호환 (`{{SERIAL_PK}}` 토큰, `gen_random_uuid()` 유저 함수)
- [x] Setup 모드 시작 시 접속 가능한 IP 주소 콘솔 배너 출력 (`os.networkInterfaces()` — Docker/원격 서버 환경 대응)
- [x] 완전 초기화 API (`POST /admin/factory-reset`) — 관리자 PIN 재확인 필수

#### 1.95.3 Setup UI (프론트엔드)
**예상 기간: 1주**

- [x] Welcome 화면 (제품 소개, 시작하기)
- [x] Configuration 화면
  - [x] 관리자 계정 설정 (이메일, 비밀번호, PIN)
  - [x] DB 설정 — PostgreSQL 기본값, 런타임별 자동 설치 버튼 / URL 직접 입력
  - [ ] 언어 선택 — Configuration 단계에서 표시 언어를 선택하고 설치 완료 후에도 유지
  - [ ] 선택 옵션 (SMTP, 텔레메트리 동의 등) — Phase 2.3 / 3.5 이후 확장
- [x] Progress 화면 (실시간 설치 로그, 단계 표시)
- [x] Complete 화면 (로그인 진입 안내)
- [x] 설치 중 새로고침/재접속 복구 (진행 상태 재동기화)
- [x] 각 단계 유효성 검증 UX (필수값, 형식 오류, DB 연결 테스트 결과)
- [x] Progress 실패 처리 UX (재시도 / 이전 단계 복귀 / 에러 요약)
- [x] Vite 개발 서버 API 프록시 설정 (`/setup`, `/core`, `/auth`, `/api` → `localhost:3000`)

#### 1.95.4 부분 초기화 / 완전 초기화 UI
**예상 기간: 2일**

- [x] 관리자 설정 화면에 초기화 옵션 추가
- [x] 부분 초기화 (데이터만 삭제, 계정·설정 유지) — `installed.lock` 유지
- [x] 완전 초기화 (전체 삭제 + Setup 모드 복귀) — 관리자 PIN 재확인 + 2단계 경고

### 마일스톤 1.95 완료 기준
- ✅ 첫 실행 시 Setup 모드로 자동 진입, 설치 완료 후 앱 모드로 전환
- ✅ 관리자 계정 / DB 설정 / 선택 옵션을 Setup에서 모두 처리
- ✅ 완전 초기화 실행 시 Setup 모드로 자동 복귀
- ✅ 설치 중 새로고침해도 진행 상태 유지

### 🔄 Phase 1.95 진행 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-16 | Phase 1.95.1 모드 전환 시스템 구현. `setup/mode.ts` — `installed.lock` / `fieldstack.config.json` 유틸 + `applyConfigToEnv()` + `scheduleRestart()`. `index.ts` Setup/앱 모드 분기. `app.ts` `createSetupApp()` 팩토리 추가. `config/env.ts` postgres refine 제거(DB 검증을 `initDb()` 호출 시점으로 이동, Setup 모드 기동 허용). |
| 2026-04-16 | Phase 1.95.2 Setup 백엔드 API 구현. `routes/setup.ts` — GET /setup/status, GET /setup/db/detect, POST /setup/db/provision (SSE), POST /setup/db/test, POST /setup/complete (SSE). `setup/docker.ts` — Docker 감지·이미지 pull·컨테이너 프로비저닝·연결 폴링. `setup/runtime.ts` — Docker/systemd/native 런타임 병렬 감지 및 provisioner 추상화. |
| 2026-04-16 | SQLite 제공자 실제 구현(`better-sqlite3`). 데이터 디렉터리 자동 생성, `gen_random_uuid()` / `now()` 유저 함수 등록, `$N`→`?` 파라미터 변환, RETURNING 절 지원, BEGIN/COMMIT 수동 트랜잭션. 마이그레이션 SQLite 호환 — `{{SERIAL_PK}}` 토큰 추가, `_migrations` 테이블 생성 시 `applyDialect()` 적용. |
| 2026-04-16 | Phase 1.95.3 Setup UI 구현. 4단계 설치 마법사(Welcome → Config → Progress → Complete). Config 단계: 관리자 계정(이메일/비밀번호/PIN) + DB 선택(PostgreSQL 기본값·런타임 자동 감지·자동 설치 SSE / SQLite 경고). Progress: `POST /setup/complete` SSE 스트리밍 단계별 표시. Complete: 5초 카운트다운 자동 이동. 오류 시 재시도 / 이전 단계 복귀 UX. Vite 개발 서버 프록시 추가. |
| 2026-04-16 | Setup 모드 시작 시 접속 가능한 IP 주소 콘솔 배너 출력. `os.networkInterfaces()`로 IPv4 주소 수집 — Docker bridge / LAN / 외부 인터페이스 포함. 박스 배너 형식으로 localhost + 네트워크 주소 전체 표시. |
| 2026-04-16 | 기술 문서 번호 논리적 순서 재정렬. migrations(06→02), startup-sequence(07→03), authentication(02→04), scheduler(04→06), shared-link(08→07), ai-integration(03→08). 관련 참조 경로 일괄 업데이트. `09-system-monitor.md` 신규 추가. |
| 2026-04-16 | Phase 1.95.4 완전 초기화·부분 초기화 구현. 백엔드: `POST /admin/factory-reset` (모든 테이블 삭제 → lock·config 제거 → 서버 재시작 → Setup 모드 복귀), `POST /admin/partial-reset` (데이터 테이블만 DELETE, 계정·설정 유지). 두 엔드포인트 모두 JWT 인증 + 관리자 PIN 필수. `apps/api/src/routes/admin.ts` 신규 생성, `app.ts`에 `/admin` 라우터 등록. 프론트엔드: AdminView 시스템 설정 패널에 초기화 UI 구현 — 부분 초기화 (1단계 확인 → PIN), 완전 초기화 (2단계 확인 → PIN) mock 플로우. `admin.css`에 reset-zone 스타일 추가. |

---

## Phase 2 사전 작업: 모듈 레지스트리 시스템

> **Phase 2 착수 전 완료 권장.** Ledger 등 실제 모듈을 붙이기 전에 모듈 라우터를
> 런타임에 동적으로 등록/해제할 수 있는 레지스트리 구조를 먼저 확보한다.

> **작업 시작전 알림**: Phase 2 pre 작업 이전 현재까지 작업된 코드에서 인용(//)으로 설명이나 메모가 안되어 있는 부분들을 확인하고
> 만약 안되어 있거나 설명이 부족하다 싶은 부분이 있을 시 추가로 보충을 하고 넘어갈 것.

### 배경

현재 모듈 로더는 서버 부트스트랩 시 1회 스캔 후 `app.use()`로 고정 마운트한다.
Express 특성상 한 번 등록된 라우트는 런타임에 제거할 수 없어,
모듈 설치/제거 시 서버 전체를 재시작해야 한다.

Fieldstack은 관리자 UI에서 모듈을 설치·제거할 수 있어야 하므로
Chrome 확장 프로그램의 "새로고침" 방식과 동일하게:
- 모듈 파일 추가/삭제 후 관리자가 "모듈 새로고침" 액션을 실행하면
- 서버 재시작 없이 레지스트리만 갱신되어 즉시 반영되어야 한다.

### 주요 작업

#### P2-Pre.1 ModuleRegistry 싱글턴
- [x] `ModuleRegistry` 클래스 구현 (동적 디스패치 방식)
  - `register(basePath, router)` / `unregister(basePath)` 메서드
  - 매 요청마다 레지스트리를 참조하는 단일 디스패처 미들웨어
- [x] 기존 `mountModuleRouters`를 레지스트리 방식으로 교체 (`loadModulesIntoRegistry` + `reloadModules`)

#### P2-Pre.2 모듈 관리 API
- [x] `GET /core/modules` — 현재 등록된 모듈 목록 및 매니페스트 정보 반환 (어드민 전용)
- [x] `POST /core/modules/reload` — `modules/*/module.json` 재스캔 후 레지스트리 갱신 (어드민 전용)

#### P2-Pre.3 Admin UI 연동
- [x] AdminView 모듈 관리 패널에 설치된 모듈 목록 표시 (`GET /core/modules` 연동)
- [x] "모듈 새로고침" 버튼 추가 (`POST /core/modules/reload` 호출)
- [x] HomeView 관리자 통계 "설치 모듈" 카드를 실제 API 데이터로 교체

#### P2-Pre.4 유저별 모듈 활성화 시스템

> 서버 레지스트리(전역)와 유저 설정(개인)을 분리하여 각 유저가 설치된 모듈 중
> 자신이 사용할 모듈을 직접 선택할 수 있도록 한다.

**권한 정책:**
- 모듈 설치: 일반 유저도 가능 (마켓플레이스에서 설치 → 서버 레지스트리 등록)
- 모듈 제거: 관리자 전용 (서버 레지스트리에서 해제 + 전체 유저 설정 삭제)
- 모듈 활성화/비활성화: 각 유저 본인 (자신의 설정만 변경)

**DB:**
- [x] `user_modules` 테이블 설계 및 마이그레이션 (`004_add_user_modules.sql`)
  - `(user_id, module_name, enabled, installed_at)` 구조
  - 모듈 설치 시 설치한 유저의 레코드 자동 생성 (`enabled: true`)
  - 모듈 제거(관리자) 시 해당 모듈의 전체 유저 레코드 삭제

**API:**
- [x] `GET /core/modules/me` — 현재 유저의 모듈 활성화 목록 반환
- [x] `PATCH /core/modules/:name/toggle` — 현재 유저의 모듈 활성화/비활성화 전환
- [x] `POST /core/modules/:name/install` — 모듈 설치 (서버 레지스트리 등록 + user_modules 레코드 생성)

**Frontend:**
- [x] 사이드바 모듈 메뉴를 `GET /core/modules/me` 기반으로 동적 구성 (AppShell 업데이트)
- [x] 설정 화면에서 유저별 모듈 활성화/비활성화 토글 UI

---

## Phase 2: 기본 모듈 개발 (2개월)

### 목표
핵심 기능 모듈 2개 완성 (가계부, 구독 관리)

> 선행 조건(권장): Phase 1.5 → Phase 1.9 → Phase 1.95 → Phase 2 사전 작업 완료 후 착수

### 주요 작업

#### 2.1 Ledger Module (가계부)
**예상 기간: 4주**

**Backend:**
- [x] DB 스키마 설계 (`modules/ledger/backend/migrations/001_initial.sql`)
- [x] API 엔드포인트 구현
  - [x] CRUD (생성, 조회, 수정, 삭제)
  - [x] 통계 API (`GET /api/ledger/summary`)
  - [x] 검색/필터 (연·월·type·카테고리·페이지네이션)
- [x] 비즈니스 로직 (`service.ts`)
- [x] 검증 로직 (`validation.ts` — Zod)
- [x] 모듈 레지스트리 async createRouter 지원 (`module-registry.ts` 수정)
- [x] 테스트 (개발 중 수동 검증으로 대체)

**Frontend:**
- [x] 목록 페이지 (DataTable, 월 네비게이션, 필터 탭)
- [x] 상세 패널 (우측 슬라이드 드로어 — 금액·카테고리·메모·태그·등록일·수정·삭제 액션)
- [x] 생성/수정 폼 (모달)
- [x] 통계 대시보드 (월별 수입·지출·잔액 카드)
- [x] 카테고리·결제수단 관리 UI (탭 모달 — 추가/삭제)
- [x] 차트 시각화 (SVG 도넛 차트 — 수입·지출 비교 바 + 카테고리별 도넛, 라이브러리 불필요)
- [x] 테스트 (개발 중 수동 검증으로 대체)

**기능:**
- [x] 수입/지출 기록
- [x] 카테고리 관리 (CRUD API + 관리 UI)
- [x] 결제 수단 관리 (CRUD API + 관리 UI)
- [x] 월별/연도별 통계
- [x] CSV 내보내기 (`GET /api/ledger/entries/export`, BOM 포함 UTF-8, 프론트 다운로드 버튼 포함)
- [x] 카테고리별 예산 설정 (`ledger_categories.budget_limit` 컬럼 — `002_budget.sql`, 관리 UI·차트 뷰 예산 바)
- [x] CSV 가져오기 (은행·카드사 포맷 자동 감지·열 매핑·중복 감지·2단계 모달 — `csv-import.ts`)
- [x] 영수증 첨부 (`ledger_entries.receipt_path` — `003_receipt.sql`, 상세 패널 업로드/삭제)
- [ ] 세무 준비 지원 (세무 메타데이터·예상 세금·자료 체크 — `docs/v2_FINANCIAL-LEDGER/modules/04-tax-management.md` 초안 완료, 세무사 검증 후 착수)

#### 2.1.5 환율 시스템 (Subscription 선행 인프라)
**예상 기간: 2일**

> Subscription 모듈에서 USD 구독(Claude, Discord, Railway 등)을 KRW로 환산하려면 환율 시스템이 선행 필요.
> 결제일 당일 환율을 기본값으로 적용하고, 실제 카드 청구 금액과 다를 경우 사용자가 직접 수정 가능한 구조.

- [x] `exchange_rates` 테이블 (`006_exchange_rates.sql` — `rate_date·base·target` UNIQUE, `NUMERIC(18,6)`)
- [x] Frankfurter API 클라이언트 (`apps/api/src/exchange-rate/frankfurter.ts` — `fetchRateForDate` / `fetchLatestRate`)
- [x] 환율 서비스 (`apps/api/src/exchange-rate/service.ts` — DB 캐시 우선, `getRateForDate` / `getLatestRate` / `convertAmount`)
- [x] `/core/exchange-rates` API 엔드포인트
  - [x] `GET /core/exchange-rates?from=USD&to=KRW&date=YYYY-MM-DD` — 특정 날짜 환율 조회
  - [x] `POST /core/exchange-rates/convert` — 금액 변환 (`amount`, `from`, `to`, `date?`)
  - [x] `POST /core/exchange-rates/refresh` — 특정 날짜 환율 강제 갱신 (캐시 삭제 후 재fetch)

#### 2.2 Subscription Module (구독 관리)
**예상 기간: 4주**

> **선행 완료 권장:** 2.1.5 환율 시스템 / 2.x.3 Event Bus / 2.x.4 Core Scheduler / 2.x.5 통합 서비스 레이어(Google Calendar)

**Backend:**
- [x] DB 스키마 설계 및 구현 (`subscription_services`, `subscription_price_history`, `subscription_notes`)
- [x] API 엔드포인트 (구독 CRUD·가격 히스토리·누적 통계·요약·메모 CRUD)
- [x] 알림 시스템 — Scheduler 활용, 매일 자정 결제일 체크 (`subscription-payment-check`)
- [x] Event Bus `subscription:payment` 이벤트 발행 (Ledger 수신 연동은 Ledger 측 미구현)
- [x] 구독 상태 이력 (`subscription_status_history` 테이블 — 해지/재개 기록, 누적 계산 시 해지 기간 제외)
- [ ] 시간대 분리 전략 적용
  - [ ] 서버 기준 시간 UTC 고정 (환경 로컬 시간대 의존 제거)
  - [ ] 결제 계산 시간대(`billingTimezone`) 필드 도입 (유저 기본값 + 구독 단위 override)
  - [ ] 누적 통계/다음 결제일/결제일 체크 로직을 `billingTimezone` 기준으로 통일
- [ ] Google Calendar 연동 (2.x.5 통합 레이어 활용)
- [ ] 테스트

**Frontend:**
- [x] 구독 목록 (카드 그리드·활성/비활성 뱃지)
- [x] 구독 추가/수정 (서비스명·금액·통화·결제 주기·결제일·구독 시작일·카테고리·URL·메모)
- [x] 대시보드 요약 카드 (월간 구독료·활성 구독 수·다음 결제일 D-day)
- [x] 상세 패널 (기본 정보·누적 통계·가격 변동 히스토리·메모 테이블)
- [x] 가격 변경 모달 (적용일·사유 기록)
- [x] 구독 해지/재개·삭제
- [ ] 결제일 캘린더 뷰
- [ ] 테스트

**기능:**
- [x] 구독 서비스 등록 및 관리
- [x] 결제일 추적 (다음 결제일 자동 계산·갱신)
- [x] 가격 변동 히스토리 추적
- [x] 월간/연간 구독료 합산 (KRW 환산)
- [x] 누적 결제 금액·평균 월 비용·사용 일수 통계
- [x] 인라인 메모 (날짜 기록 테이블 형식)
- [ ] 구독 상태 이력 추적 (해지/재개 기록 → 누적 계산에서 해지 기간 제외)
- [ ] 표시 시간대 설정 (사용자 설정)과 결제 계산 시간대(도메인 로직) 분리
- [ ] Google Calendar 자동 등록
- [ ] 결제일 알림 (D-7, D-3, D-1)
- [ ] Ledger Module 자동 연동 (Ledger 측 `subscription:payment` 이벤트 수신 구현 필요)

#### 2.3 통합 및 테스트
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
- ✅ 사용 가능한 MVP

---

## Phase 2.x: 코어 시스템 보완

> **Phase 2와 병행 또는 직후 완료 권장.**
> 모듈 개발(2.1 Ledger / 2.2 Subscription)과 성격이 다른 코어 인프라·시스템 항목을 별도로 분리.
> 이 항목들은 특정 모듈의 기능이 아니라 앱 전체에 영향을 주는 시스템 레이어다.

### 주요 작업

#### 2.x.1 SMTP 연동
**예상 기간: 1주**

> Phase 1.9.3에서 비밀번호 복구 API를 구현할 때 "관리자 수동 토큰 경로"로 우선 완성하고 이메일 발송은 여기서 실제 연동.

- [ ] Admin 설정 화면에 SMTP 입력 항목 구현 (호스트, 포트, 보안, 사용자명, 비밀번호, 발신자)
- [ ] SMTP 비밀번호 암호화 저장 (AES-256)
- [ ] 테스트 이메일 발송 기능
- [ ] 비밀번호 복구 이메일 실제 발송 연동
- [ ] 신규 유저 임시 비밀번호 자동 발송 (SMTP 설정 완료 시)
- [ ] SMTP 미설정 시 관리자 수동 발급 안내 UX

#### 2.x.2 i18n 국제화 시스템
**예상 기간: 1주**

> 초기 지원 언어: 한국어(ko) · 영어(en). 번역 파일 추가만으로 언어를 확장할 수 있는 구조로 설계.

**아키텍처 결정:**
- i18next + react-i18next 기반
- 네임스페이스 분리: `common` (앱 공통 문자열) / 모듈별 네임스페이스 (`ledger`, `subscription` 등)
- **번역 파일 소유권**: 각 모듈이 `modules/{name}/frontend/locales/{lang}.json`을 직접 소유 → 모듈 추가 시 앱 번역 파일 수정 불필요
- 앱 초기화 시 각 모듈의 번역 파일을 i18next에 namespace로 자동 등록

**module.json displayName i18n 연동:**
- `displayName` 값을 i18n 키로 사용: `"ledger:displayName"`
- i18next가 키를 찾지 못하면 `module.name`을 폴백으로 표시 (하위 호환 유지)
- 언어 추가 시 `locales/{lang}.json` 파일만 추가하면 됨 — `module.json` 수정 불필요

**주요 작업:**
- [x] i18next + react-i18next 도입 및 초기화 설정 (`apps/web/src/i18n/index.ts`)
- [x] `common` 네임스페이스 번역 파일 작성 — 공통 UI 문자열 (`ko.json` / `en.json`)
- [x] 모듈 번역 로더 구현 — `registerModuleLocale()` 헬퍼, 모듈 진입 시 namespace 자동 등록
- [x] Settings 화면 언어 선택 실제 연동 (`i18n.changeLanguage()` + `localStorage` 저장)
- [x] Ledger 모듈 번역 파일 작성 (`modules/ledger/frontend/locales/ko.json` / `en.json`)
- [x] `module.json` displayName·description → i18n 키 방식 전환 (`ModuleManifest` 타입 및 AppShell·HomeView·SettingsView 연동)
- [x] 언어 설정 서버 저장: `PATCH /core/users/me/settings` 연동 (`users.language` 컬럼 + 로그인 후 로드)
- [x] 모듈 템플릿에 `locales/` 디렉터리 및 샘플 번역 파일 추가 (`module-template/frontend/locales/ko.json` / `en.json`)

#### 2.x.3 Event Bus & Core Service Registry ✅ 완료
**예상 기간: 3일**

> 모듈 간 직접 import 금지 원칙(CLAUDE.md 참고)을 지키면서 데이터를 주고받을 수 있는 인프라.
> 설계는 `modules/03-system-design.md` 기준. Subscription → Ledger 자동 연동에 필수.

**Event Bus:**
- [x] `apps/api/src/event-bus.ts` — 발행(emit) / 구독(on) / 단발(once) 인터페이스 구현
- [x] 타입 안전한 이벤트 이름 + 페이로드 타입 정의 (`subscription:payment`, `ledger:created` 등)
- [x] 모듈 종료(shutdown) 시 리스너 자동 해제 지원

**Core Service Registry:**
- [x] `apps/api/src/service-registry.ts` — 모듈 서비스 인스턴스 중앙 등록소
- [x] `register(name, service)` / `getService(name)` 메서드
- [ ] 모듈 로더와 연동 — 모듈 초기화 시 서비스 자동 등록, 언로드 시 해제

#### 2.x.4 Core Scheduler (Cron 기반 배경 작업) ✅ 완료
**예상 기간: 3일**

> 모듈이 주기적 작업을 등록할 수 있는 코어 인프라. 설계는 `technical/06-scheduler.md` 기준.
> Subscription 결제일 자동 체크·Ledger 자동 기록에 필수.
> Phase 5.1의 "Scheduler 관리 UI"와는 별개 — 여기서는 엔진(실행기)만 구현.

- [x] `apps/api/src/plugins/scheduler/index.ts` — Scheduler 싱글턴 엔진 (`node-cron`)
- [x] `register` / `unregister` / `runNow` / `toggle` / `stopAll` / `list` / `getLogs` 메서드
- [x] 중복 실행 방지 (`runningTasks` Set)
- [x] 실행 로그 DB 저장 (`scheduler_logs` 테이블 — `007_scheduler_logs.sql`)
- [x] 재시도 정책 (`retries`, `retryDelay`)
- [x] 서버 부트스트랩 시 자동 시작, graceful shutdown 시 전체 중지
- [x] 타임존 지원 (기본: `Asia/Seoul`)

#### 2.x.5 통합 서비스 레이어 (Google Calendar 우선)
**예상 기간: 1주**

> 외부 서비스 연동을 위한 추상화 레이어. 설계는 `modules/02-integrations.md` 기준.
> 1순위: Google Calendar (Subscription 결제일 이벤트 자동 등록에 필요).
> 이후 Google Drive, Gmail, Microsoft Calendar 등 순차 확장.

- [ ] `packages/core/src/integrations/base.ts` — `Integration` 인터페이스 + `BaseIntegration` 추상 클래스
- [ ] `packages/core/src/integrations/security.ts` — OAuth 토큰 AES-256 암호화 저장
- [ ] `packages/core/src/integrations/google/calendar.ts` — Google Calendar API 클라이언트
  - 이벤트 생성 / 수정 / 삭제
  - OAuth 2.0 인증 흐름 (Google Cloud Console 앱 등록 전제)
- [ ] Admin 설정 화면에 Google 연동 섹션 추가 (연동하기 버튼 → OAuth 팝업 → 상태 표시)
- [ ] `integrations` DB 테이블 — 서비스명·암호화 토큰·만료일 저장

#### 2.x.6 마켓플레이스 Module Registry 구축
**예상 기간: 2주**

> Phase 3 마켓플레이스 웹사이트 개발의 선행 인프라.
> GitHub 저장소 기반이 아닌 자체 웹사이트 내 처리 방식으로 구축한다.
> 레지스트리 스키마는 기존 `module.json` 매니페스트(`ModuleManifest`)를 기반으로 마켓플레이스 전용 필드만 추가한다.

**스키마 확장 (module.json → registry entry):**
- `ModuleManifest` 기반 + `author`, `tags`, `icon`, `repository`, `license`, `downloads`, `publishedAt` 추가
- [x] 기반 스키마 (`name`, `version`, `displayName`, `description`, `dependencies`, `routes`) — 기존 매니페스트로 확정

**주요 작업:**
- [ ] 레지스트리 전용 확장 필드 타입 정의 (`RegistryEntry` — `ModuleManifest` 상속)
- [ ] 모듈 제출 API 설계 (마켓플레이스 서버 — Cloudflare Workers)
- [ ] 서버 측 검증 파이프라인 (스키마 검사, 의존성 충돌, 악성 코드 패턴)
- [ ] 관리자 심사 UI (제출 목록, 승인/거절, 스캔 결과 표시)
- [ ] `ModuleManifest` 타입에 누락 필드 보완 (`displayName`, `description`, `fileHandlers`)

#### 2.x.7 사용자 관리 & Whitelist 운영
**예상 기간: 3일**

> Phase 1.95.2 Setup 마법사가 만든 첫 관리자 계정 외에 추가 사용자를 운영 단계에서 발급할 수 있는 코어 기능.
> Phase 2.x.1 SMTP가 완성되기 전이라도 동작해야 하므로 **수동 초대 토큰 방식**으로 우선 구현하고,
> SMTP 도입 시 같은 토큰을 자동 메일 발송 채널로 전환만 한다.
> 비밀번호 분실 복구(`password_recovery_tokens`) 인프라(Phase 1.9.3)를 그대로 재사용한다.

**설계 원칙:**
- 임시 비밀번호를 화면에 노출하지 않는다 — 일회용 초대 토큰만 발급
- 관리자가 토큰을 복사해 외부 채널(메신저 등)로 전달 → 사용자가 `#forgot-password` 토큰 경로로 비밀번호 직접 설정
- 모든 destructive 액션(삭제·관리자 강등·비활성화)은 자기 자신/마지막 관리자 보호
- 관리자 전용 라우트는 `requireAdmin` 미들웨어로 JWT + DB `is_admin` 재확인

**DB:**
- [x] `users.is_active` 컬럼 추가 (`008_user_status.sql`) — 비활성 계정은 로그인 차단

**Backend (admin 라우트):**
- [x] `requireAdmin` 미들웨어 — JWT 검증 후 DB에서 `is_admin` 재확인
- [x] `GET /admin/users` — 사용자 목록 (id, email, isAdmin, isActive, isTempPassword, createdAt)
- [x] `POST /admin/users` — 사용자 생성 + 일회용 초대 토큰 반환 (옵션: `addToWhitelist`, `isAdmin`)
- [x] `PATCH /admin/users/:id` — `isActive` / `isAdmin` 토글 (자기 자신·마지막 관리자 보호)
- [x] `POST /admin/users/:id/invite` — 초대/복구 토큰 재발급
- [x] `DELETE /admin/users/:id` — 삭제 (PIN 재확인 필수, 자기 자신·마지막 관리자 보호)
- [x] `GET /admin/whitelist` — 룰 목록
- [x] `POST /admin/whitelist` — 룰 추가 (email | domain)
- [x] `PATCH /admin/whitelist/:id` — `enabled` 토글
- [x] `DELETE /admin/whitelist/:id` — 룰 삭제

**서비스 확장:**
- [x] `UserAuthService.login()`이 `is_active = false` 계정을 차단
- [x] `UserAuthService` — `listUsers` / `setUserActive` / `setUserAdmin` / `deleteUser` / `countAdmins`
- [x] `WhitelistServiceImpl.setEnabled(id, enabled)`

**Frontend (AdminView "사용자 관리" 패널):**
- [x] 패널 내부 탭 — "사용자" / "Whitelist" 분리
- [x] 사용자 목록 테이블 (이메일 / 역할 / 활성 / 임시 / 가입일 / 액션)
- [x] "사용자 추가" 모달 — 이메일·관리자 여부·Whitelist 동시 추가 옵션
- [x] 초대 토큰 표시 모달 — 토큰 1회 표시 + 복사 버튼 + 안내 문구 (창 닫으면 재발급 필요)
- [x] 활성 토글 / 관리자 토글 / 토큰 재발급 / 삭제(PIN 재확인) 액션
- [x] Whitelist 서브탭 — 룰 목록·추가(email/domain)·활성 토글·삭제

**SMTP 연결 시 후속 작업 (2.x.1):**
- [ ] 초대 토큰을 자동 이메일 발송으로 전환 (관리자 화면은 토큰 미표시 + "메일 발송됨" 안내)
- [ ] SMTP 미설정 시 현재 수동 발급 UX를 폴백으로 유지

### 마일스톤 2.x 완료 기준
- ✅ SMTP 연동 및 이메일 발송 작동
- ✅ 한국어/영어 전환 실제 동작, 모듈별 번역 파일 로드
- ✅ Event Bus / Core Scheduler / 통합 서비스 레이어 구현 완료 (Subscription 착수 가능 상태)
- ✅ 마켓플레이스 Registry 제출 프로세스 설계 완료
- ✅ 관리자가 추가 사용자 계정을 발급/관리 가능 (수동 토큰 → SMTP 자동화 후속)

---

## Phase 3: 마켓플레이스 & 웹사이트 (2개월)

### 목표
커뮤니티 생태계 구축

### 주요 작업

#### 3.1 공식 웹사이트 개발
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

#### 3.2 앱 내 Module Manager
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

#### 3.3 통계 수집 시스템
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
  > ⚠️ **이 항목 작업 시 체크**: Setup 진행 중 새로고침/재접속 복구 기능(sessionStorage 복원 + `/setup/status` 폴링)을
  > 실제 설치 플로우에서 테스트할 것. 복구 배너 표시, 자동 complete 이동, 실패 후 재시도 시나리오 모두 확인.
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

## Phase 3.7: 앱 내부 시스템 모니터링

> **구현 시점: Phase 3 완료 후 (Phase 4 착수 전)**
> 모듈·API가 어느 정도 안정화된 시점에 한 번에 만든다.
> 외부 Uptime Kuma(마켓플레이스·공유 서비스 가용성 확인)와는 별개로,
> Fieldstack 인스턴스 내부 상태를 관리자가 직접 확인하는 용도.

### 목표
관리자가 앱 내부에서 시스템 상태를 실시간으로 파악할 수 있는 모니터링 페이지 제공.

레퍼런스 : Uptime Kuma

### 주요 작업

#### 3.7.1 시스템 상태 API
**예상 기간: 1일**

- [ ] `GET /core/monitor` — 관리자 전용 시스템 상태 통합 응답
  - 시스템: CPU 사용률, 메모리 사용량/총량, 디스크 잔여 공간
  - 서버: 프로세스 업타임, Node.js 버전, Fieldstack 버전
  - 데이터베이스: 연결 상태, 응답 속도(ms), provider 종류
  - 설치 상태: `installed.lock` 유효 여부, 마이그레이션 최신 여부
  - 모듈: 활성 모듈 목록 및 상태

#### 3.7.2 모니터링 UI
**예상 기간: 1일**

- [ ] Admin 패널에 "시스템 상태" 전용 패널 추가
- [ ] 카드 형식으로 각 항목 시각화 (정상/경고/오류 상태 색상 구분)
- [ ] 30초 자동 갱신 (수동 새로고침 버튼 포함)

### 마일스톤 3.7 완료 기준
- ✅ 관리자 패널에서 시스템 리소스·DB·모듈 상태를 한눈에 확인 가능
- ✅ 30초 자동 갱신 동작

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

> 상세 설계: `deployment/04-updates.md`, `deployment/05-update-channels.md`

**업데이트 채널 (3단계):**
- Release (안정): 충분히 검증된 버전 — 일반 사용자 권장
- Beta: 신규 기능 얼리 액세스 — 일부 버그 가능성 인지 필요
- Alpha: 개발 중 최신본 — 테스터·기여자 대상

**주요 작업:**
- [ ] 업데이트 체커 (Scheduler 기반 — 사용자 지정 주기)
- [ ] 업데이트 실행 시간대 지정 (Admin 설정 — 타임존 선택, 예: Asia/Seoul)
- [ ] 채널 선택 UI (Admin 설정 — Release / Beta / Alpha)
- [ ] 활성 사용자 확인 후 유지보수 모드 전환
- [ ] 백업 자동 생성 (업데이트 전)
- [ ] 롤백 기능 (이전 버전으로 복원)
- [ ] 업데이트 알림 (앱 내 배너)

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

#### 5.1 Scheduler 관리 UI
**예상 기간: 1주**

> 코어 엔진은 Phase 2.x.4에서 구현. 여기서는 관리자/사용자가 등록된 작업을 제어하는 UI.

- [ ] Admin 패널 "스케줄러" 섹션 — 등록된 작업 목록 조회
- [ ] 작업 활성화/비활성화 토글
- [ ] 다음 실행 시간 표시
- [ ] 수동 실행 트리거 버튼
- [ ] 실행 히스토리(로그) 조회

#### 5.2 Tax Preparation Support (세무 준비 지원)
**예상 기간: 4주**

> Ledger/금융 모듈 내부의 세무 준비 보조 기능. 신고 대행이 아니라 예상 세금 계산, 자료 정리, 누락 확인, 세무사 자료 공유를 지원한다. 설계는 `modules/04-tax-management.md`.
> **착수 조건:** 세무사 자문 완료 후 (`docs/local/tax_Q-a-A.md` 미결 항목 해소 필요).

- [ ] 증빙 분류 (세금계산서 / 현금영수증 / 카드 / 기타)
- [ ] 원천세 대상 거래 태깅 (3.3% 원천징수)
- [ ] 예상 세금 계산 결과 표시 (기준 연도·출처·최종 갱신일·누락 정보 포함)
- [ ] 부가가치세 예상 데이터 집계 (과세/면세/영세율 구분)
- [ ] 신고자료 체크리스트 (준비 완료 / 자료 누락 / 확인 필요 / 추가 자료 필요)
- [ ] 세무사 공유 페이지 및 다운로드 흐름
- [ ] 크리에이터 특화 항목 (플랫폼 수익 종류별 분류)
- [ ] Ledger 모듈 연동 (세무 메타데이터 컬럼 확장 — Event Bus 경유)

#### 5.3 TODO Module
**예상 기간: 3주**

> 설계 초안: `docs/v2_FINANCIAL-LEDGER/modules/future/01-todo-scheduler.md`

- [ ] 할 일 생성/관리
- [ ] 우선순위 / 마감일
- [ ] 카테고리/태그
- [ ] 완료 통계

#### 5.4 Project Module (프로젝트·외주 관리)
**예상 기간: 4주**

> 설계 초안: `docs/v2_FINANCIAL-LEDGER/modules/future/02-project-outsource.md` (Gmail / 위드싸인 연동 포함)

- [ ] 프로젝트 생성/관리
- [ ] 외주 정보 기록 (클라이언트, 계약 금액, 정산 일정)
- [ ] 예산/정산 관리
- [ ] 계약서 관리 (위드싸인 연동 검토)

#### 5.5 Planner Module
**예상 기간: 3주**

> 설계 초안: `docs/v2_FINANCIAL-LEDGER/modules/future/03-planner.md` (여행 계획 등 목적 특화 계획 관리)

- [ ] 계획 생성/관리 (여행, 이벤트, 프로젝트 등)
- [ ] 일정 타임라인 뷰
- [ ] 체크리스트

#### 5.6 Video Downloader Module
**예상 기간: 2주**

> 설계 초안: `docs/v2_FINANCIAL-LEDGER/modules/future/04-video-downloader.md` (yt-dlp / Streamlink 기반)

- [ ] URL 입력 → yt-dlp 다운로드 실행
- [ ] 다운로드 큐 관리 및 진행 상태 표시
- [ ] 파일 포맷/품질 선택

#### 5.7 AI 요약 자동화
**예상 기간: 2주**

> AI 정책 및 아키텍처: `technical/08-ai-integration.md`

- [ ] 월간 가계부 요약
- [ ] 지출 패턴 분석
- [ ] 구독 최적화 제안
- [ ] 프로젝트 리포트

#### 5.8 통합 서비스 확장
**예상 기간: 2주**

> 2.x.5에서 Google Calendar 레이어 구축 후 순차 확장.

- [ ] Google Drive 자동 백업
- [ ] Gmail 연동
- [ ] Microsoft Calendar / OneDrive
- [ ] Notion 연동
- [ ] Slack 연동
- [ ] 커스텀 Webhook

### 마일스톤 5 완료 기준
- ✅ 5개 이상 공식 모듈 (Tax / TODO / Project / Planner / Video Downloader 포함)
- ✅ AI 요약 자동화 작동
- ✅ Google Drive, Gmail, Notion, Slack 등 통합 서비스 2개 이상 실제 연동
- ✅ Scheduler 관리 UI 완성

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
