> **백업용으로 남겨둔 초기 계획서입니다.<br> 이후 계획을 확인하고자 한다면 'finance_system_plan-v2.md'를 확인하시기 바랍니다.**

---

# Personal Modular Finance & Productivity System

> 개인용 · 소수 지인용 self-hosted 내부 관리 시스템

---

## 1. 프로젝트 개요

본 프로젝트는 **가계부 / 정기 구독 관리**를 시작으로, 향후 **Scheduler, TODO, 프로젝트·외주 관리, 정산 시스템**까지 확장 가능한 **모듈형 개인 생산성 시스템**을 구축하는 것을 목표로 한다.

- 대상 사용자: **본인 + 허용된 소수 지인**
- 배포 형태: **GitHub 공개 (Self-hosted only)**
- 운영 철학: "서비스가 아닌 내부 툴", "유지보수 부담 최소화"

---

## 2. 핵심 설계 원칙

### 2.1 서비스가 아닌 프레임워크
- SaaS 형태 ❌
- 중앙 서버 ❌
- 데이터 수집 ❌
- 사용자 직접 배포 / 직접 설정

### 2.2 Core / Module / Plugin 분리
- **Core**: 인프라 레이어 (절대 최소 변경)
- **Modules**: 실제 기능 단위 (안정적)
- **Plugins**: 실험/확장 영역 (깨져도 무방)

### 2.3 개인정보 보호 우선
- DB, AI, 외부 API는 **사용자가 직접 API Key 등록**
- 프로젝트는 어떤 개인정보도 수집하지 않음

---

## 3. 전체 아키텍처 개요

```
Client (Web / App)
   ↓
Core Layer
 ├ Auth (Google OAuth + Whitelist)
 ├ DB Connector
 ├ Scheduler
 ├ Event Bus
 ├ AI Abstraction
 └ Config Loader
   ↓
Modules / Plugins
```

---

## 4. 디렉터리 구조 (초안)

```
/core
  /auth            # Google OAuth, whitelist
  /db              # DB 연결, 마이그레이션
  /scheduler       # 공통 스케줄러
  /calendar        # Google Calendar 연동
  /events          # 이벤트 버스
  /ai              # AI 추상화 레이어
  /config          # 환경설정 로딩
  /types           # 공통 타입

/modules
  /ledger          # 가계부 (기본)
  /subscription    # 정기 구독 관리 (기본)
  /example         # 모듈 예시

/plugins           # 실험용 확장 영역

/ui
  /default
  /minimal
  /custom-example
```

---

## 5. 인증 및 접근 제어

### 5.1 인증 방식
- Google OAuth 로그인만 허용
- 비밀번호 시스템 미사용

### 5.2 접근 제어
- 로그인 후 이메일 기준 **Whitelist 체크**
- `allowed_users` 테이블에 등록된 계정만 접근 가능

---

## 6. 데이터베이스 / 외부 서비스 정책

### 6.1 데이터베이스
- DB 종류는 제한하지 않음 (PostgreSQL 권장)
- Core는 DB URL만 참조

```env
DATABASE_URL=postgres://...
```

### 6.2 AI 연동
- AI Provider는 추상화 레이어로 분리
- 사용자 직접 API Key 등록

```env
AI_PROVIDER=gemini
AI_API_KEY=xxxx
```

AI는 **계산 주체가 아닌 분석/요약/해설 역할**로만 사용

---

## 7. Scheduler 설계

- Scheduler는 Core 레벨에서 단일 실행
- 모듈은 작업만 등록

예시:
- 월간 가계부 요약
- 구독 결제일 체크
- 외주 정산 알림

---

## 8. 기본 제공 Modules (MVP)

### 8.1 Ledger (가계부)
- 날짜
- 금액 (+ / -)
- 카테고리
- 메모
- 결제 수단

### 8.2 Subscription (정기 구독)
- 서비스명
- 금액
- 결제 주기 (월/년)
- 결제일
- Google Calendar 연동

---

## 9. Module 시스템 설계

### 9.1 Module 메타 정보

`module.json`
```json
{
  "name": "ledger",
  "version": "1.0.0",
  "entry": "index.ts",
  "permissions": ["db"],
  "schedules": ["monthly-summary"]
}
```

### 9.2 강제 규칙
- Module 간 직접 import 금지
- Core → Module 의존 금지
- Module은 자신이 소유한 DB 테이블만 접근 가능

---

## 10. UI 정책

- UI는 Core/Module 로직과 완전 분리
- 기본 UI는 예시용
- 사용자는 자유롭게 UI 교체 가능

---

## 11. GitHub 공개 정책

### 11.1 공개 범위
- 소스 전체 공개
- 배포본 제공 ❌

### 11.2 README 명시 사항
- 개인/소규모 내부용 프로젝트임을 명확히 고지
- Self-hosted 전제
- 기능 요청은 PR만 허용

---

## 12. 단계별 개발 계획

### Phase 1 (Core 기반)
- Auth / Config / DB / Scheduler / Event Bus

### Phase 2 (기본 기능)
- Ledger Module
- Subscription Module
- Google Calendar 연동

### Phase 3 (확장)
- TODO / Project / 외주 정산 모듈
- AI 요약 자동화

---

## 13. 프로젝트 목표 요약

- ✔ 혼자 써도 가치 있는 시스템
- ✔ 미래의 유지보수를 고려한 구조
- ✔ 개인정보 이슈 없는 공개 프로젝트
- ✔ 개인 생산성 OS로 확장 가능

---

> "이 프로젝트는 완성된 서비스가 아니라,
> 스스로에게 최적화된 도구를 만들기 위한 기반이다."