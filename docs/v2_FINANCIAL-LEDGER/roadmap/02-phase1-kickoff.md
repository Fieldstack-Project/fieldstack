# Phase 1 Kickoff Plan

> 기준 문서: `docs/v2_FINANCIAL-LEDGER/roadmap/01-development-plan.md`
> 상태: in progress

## 목적

Phase 1(코어 기반 구축)을 실제 구현 단계로 전환하고, 1.2/1.3/1.4 항목을 추적 가능한 작업 단위로 실행한다.

## 범위

- 1.2 Core Layer 개발
- 1.3 Module Loader
- 1.4 테스트 및 문서

1.1(프로젝트 세팅)은 완료된 상태로 간주한다.

## 이번 킥오프에서 완료한 항목

- monorepo 내 최소 빌드 대상 구조 정렬 (`apps/api`, `packages/core`, `apps/web`)
- `packages/core` 초기 public entrypoint 및 하위 도메인 엔트리 추가
- `apps/api` 초기 bootstrap 엔트리 추가
- 루트 `postbuild` 스크립트 대상 파일(`scripts/copy-frontend.js`) 추가
- 루트 `TODO.md`에 Phase 1 실행 체크리스트 작성

## 실행 체크포인트

### Track A: Core Layer (1.2)

- Auth: 이메일/비밀번호, JWT 세션, whitelist, PIN, 복구 흐름 스펙 우선 구현
- DB: provider interface, postgres/sqlite/supabase(우선), migration scaffold
- Types: api/user/module/integration 공통 타입 정리
- Utils: date/format/validation/encryption 기본 함수군
- UI: core primitive와 hook 계약(interface) 우선 정의

### Track B: Module Loader (1.3)

- backend loader: `modules/*/module.json` 스캔 + 유효성 검증 + 라우트 등록 준비
- frontend loader: module metadata 기반 route/nav 구성 준비
- dependency check: 모듈 의존성 그래프 검사 및 실패 메시지 정책 정의

### Track C: Test & Docs (1.4)

- vitest 기본 구성 및 core 단위테스트부터 시작
- api 통합 테스트 최소 smoke 케이스 마련
- OpenAPI 문서 스켈레톤 구성
- 개발자 가이드와 README 동기화

## 완료 기준 (Phase 1 Exit Criteria)

- Core layer 패키지가 명확한 public API와 내부 경계를 가진다.
- Module loader가 샘플 모듈을 자동 인식하고 등록까지 수행한다.
- 테스트 커버리지 측정이 가능하고 핵심 경로 커버리지가 확보된다.
- 문서가 실제 코드 구조와 불일치 없이 유지된다.

## 리스크와 즉시 대응

- 리스크: 구현 범위가 넓어 초기 병렬 작업 충돌 가능
- 대응: `packages/core`의 타입 계약을 먼저 고정하고 하위 구현을 분리

- 리스크: 모듈 로더 스펙과 실제 모듈 구조 불일치
- 대응: `module.json` validation 스키마를 먼저 정의

- 리스크: 테스트 인프라 도입 지연
- 대응: 최소 smoke 테스트부터 우선 도입하고 단계적으로 확장
