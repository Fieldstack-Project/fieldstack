# 아키텍처 개요

## 전체 아키텍처

```
Client (Web / App)
   ↓
Core Layer
 ├ Auth (Google OAuth + Whitelist)
 ├ DB Connector (Multi-provider)
 ├ Module Loader (자동 스캔)
 ├ Event Bus
 ├ AI Abstraction
 └ Common UI Components
   ↓
Modules (자동 로드)
 ├ Frontend (React Components)
 └ Backend (API Routes)
   ↓
Plugins (Optional)
```

---

## Core Layer

### 역할
- 인프라 레이어 (절대 최소 변경)
- 모듈이 의존하는 공통 기능 제공
- 안정성 최우선

### 구성 요소

**Auth**
- Google OAuth 인증
- Whitelist 기반 접근 제어
- 세션 관리

**DB Connector**
- 다양한 DB Provider 지원 (PostgreSQL, SQLite, Supabase, MongoDB)
- 추상화 레이어로 모듈은 DB 종류를 신경쓰지 않음
- 자동 마이그레이션

**Module Loader**
- modules/ 폴더 자동 스캔
- module.json 기반 로드
- 활성화/비활성화 관리
- 의존성 체크

**Event Bus**
- 모듈 간 통신
- 이벤트 발행/구독 패턴
- 느슨한 결합

**AI Abstraction**
- Provider 추상화 (Gemini, OpenAI, Claude, Ollama)
- 사용자 API Key 관리
- 통일된 인터페이스

**Common UI Components**
- Button, Input, Table, Modal 등
- Layout 컴포넌트
- 공통 Hooks
- 일관된 디자인 시스템

---

## Module Layer

### 특징
- 실제 기능 단위
- 독립적으로 개발/배포 가능
- 폴더 단위로 추가/제거
- Core에 의존하지만 다른 모듈에는 의존하지 않음

### 구조
```
modules/[module-name]/
├── module.json          # 메타데이터
├── frontend/           # UI
├── backend/            # API
└── types/              # 타입 정의
```

### 생명주기
1. 모듈 스캔
2. module.json 검증
3. 의존성 체크
4. 활성화 상태 확인
5. Frontend/Backend 로드
6. 라우트 등록

---

## Plugin Layer

### 역할
- 실험적 기능
- 백그라운드 작업 (Scheduler, AI 등)
- 깨져도 Core/Module에 영향 없음

### 예시
- Scheduler: 정기 작업 실행
- AI Assistant: 백그라운드 분석
- Backup: 자동 백업

---

## 데이터 흐름

### 1. 사용자 요청
```
사용자 → Frontend Component
         ↓
      API 호출
         ↓
   Backend Route
         ↓
      Service
         ↓
   DB (Core Connector)
```

### 2. 모듈 간 통신
```
Module A → Event Bus → Module B
```

직접 import 금지, Event Bus로만 통신

### 3. 통합 서비스 사용
```
Module → Core Integration → External API
                ↓
         (Google, Notion, etc.)
```

---

## 확장성

### 수평 확장
- 모듈 추가로 기능 확장
- 기존 코드 수정 불필요

### 수직 확장
- Core 업그레이드
- 모든 모듈이 자동으로 혜택

---

## 보안 모델

### 계층별 보안

**Core Layer**
- 인증/인가 처리
- API Key 암호화
- 세션 관리

**Module Layer**
- Permissions 체크
- 사용자 본인 데이터만 접근
- DB 테이블 격리

**Plugin Layer**
- Sandbox 실행
- 제한된 권한

---

## 성능 고려사항

### 모듈 로딩
- Lazy Loading
- 사용하지 않는 모듈은 로드하지 않음

### DB 최적화
- Connection Pooling
- 쿼리 최적화
- 인덱싱

### 캐싱
- 모듈 설정 캐싱
- API 응답 캐싱 (선택)

---

## 에러 처리

### 계층별 에러 처리

**Core**
- 치명적 에러 → 전체 중단
- 복구 불가능

**Module**
- 모듈 에러 → 해당 모듈만 비활성화
- 다른 모듈에 영향 없음

**Plugin**
- 플러그인 에러 → 무시 또는 재시도
- 시스템에 영향 없음

---

## 업데이트 전략

### Core 업데이트
- 하위 호환성 유지
- 주요 변경 시 마이그레이션 가이드

### Module 업데이트
- 독립적으로 업데이트
- 버전 관리

### 롤백
- Git tag 기반
- DB 백업/복원
- 자동 롤백 지원