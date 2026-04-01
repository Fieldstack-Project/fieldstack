# 프로젝트·외주 관리 모듈

## 개요

외주 및 프로젝트 단위의 업무 흐름을 관리하는 모듈입니다.  
문의 인입부터 계약 체결, 작업 진행, 정산 완료까지의 전체 라이프사이클을 Fieldstack 안에서 추적합니다.

1인 크리에이터, 프리랜서 등 MCN 미소속 개인 사업자를 주요 사용 대상으로 합니다.

> **개발 시점:** Fieldstack V1 완성 이후 여유가 생겼을 때 진행

---

## 주요 기능 (검토 중)

### 1. 프로젝트 관리
- 프로젝트 카드 생성 및 상태 관리
  - 상태 예시: `문의 인입` → `견적 발송` → `계약 체결` → `작업 중` → `검수` → `정산 완료`
- 클라이언트 정보 연결
- 마감일 및 일정 관리
- 파일 첨부 (계약서, 산출물 등)

### 2. 정산 시스템
- 견적서 작성 및 발송
- 인보이스 생성
- 정산 상태 추적
- Ledger 모듈 자동 연동 — 정산 완료 시 수입 항목 자동 기록

### 3. 문의 인입 관리
- 외부 채널에서 들어오는 문의를 프로젝트 리드(Lead)로 자동 전환
- 지원 인입 채널 (검토 중):
  - 이메일 (Gmail 연동)
  - 폼 (Tally, Google Form, Typeform, Notion DB)
  - 커스텀 API / Webhook

---

## 외부 서비스 연동

### 위드싸인 (전자계약)

**연동 목적:** 계약서 상태를 프로젝트 카드에서 직접 확인

**활용 기능:**
- 계약서 상태 조회 — 서명 대기 / 완료 / 거절
- 계약 완료 감지 시 프로젝트 상태 자동 전환 (웹훅 지원 시)
- 계약사본 / 인증서 다운로드 링크를 프로젝트 파일탭에 연결
- (선택) 템플릿으로 계약서 발송을 Fieldstack 내에서 직접 처리

**설계 고려사항:**
- 위드싸인 문서 ID를 프로젝트 레코드에 저장하는 필드 필요 (`contractIds` 등)
- API Key 관리는 Fieldstack 설정 모듈의 서드파티 연동 섹션에서 처리
- 초기에는 조회 전용으로 시작하고, 이후 발송 기능으로 확장하는 방향 권장
- API 문서: [apidocs.widsign.com](https://apidocs.widsign.com)

---

### Gmail 연동

**연동 목적:** 외주 문의 전용 Gmail 계정을 Fieldstack과 연결하여 문의 누락 방지 및 커뮤니케이션 이력 통합 관리

> 1인 크리에이터(MCN 미소속)의 경우 외주·문의 창구로 Gmail을 단독으로 사용하는 경우가 많아  
> Fieldstack 내 통합 관리의 실용성이 높음

**활용 기능:**
- 특정 레이블(`외주문의`, `견적` 등) 메일 → 프로젝트 리드 자동 생성
- 답장 여부 추적 — 미답장 문의 건 알림
- 위드싸인 계약 완료 메일 감지 → 프로젝트 상태 자동 전환
- 세금계산서 / 인보이스 관련 메일 → Ledger 모듈 연동
- 프로젝트 카드 내 해당 클라이언트와의 메일 스레드 타임라인 표시

**설계 고려사항:**
- Gmail OAuth 2.0 인증 필요
- 연동 계정은 설정 모듈에서 등록 및 관리
- 전체 메일함이 아닌 특정 레이블 또는 필터 기준으로만 동기화하는 방향 권장 (프라이버시 및 성능)

---

## 데이터 구조 (초안)

```ts
// 프로젝트 카드
interface Project {
  id: string
  userId: string
  title: string
  clientName: string
  clientEmail?: string
  status: ProjectStatus
  amount?: number
  currency?: string
  startDate?: string
  dueDate?: string
  contractIds?: string[]       // 위드싸인 문서 ID 목록
  gmailThreadIds?: string[]    // 연결된 Gmail 스레드 ID 목록
  tags?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

type ProjectStatus =
  | 'lead'          // 문의 인입
  | 'quoted'        // 견적 발송
  | 'contracted'    // 계약 체결
  | 'in_progress'   // 작업 중
  | 'review'        // 검수
  | 'settled'       // 정산 완료
  | 'cancelled'     // 취소
```

---

## 모듈 간 연동

### Project → Ledger
- 프로젝트 상태가 `settled`(정산 완료)로 변경될 때  
  `project:settled` 이벤트를 발행하여 Ledger에 수입 항목 자동 기록

### 위드싸인 → Project
- 계약 완료 웹훅 수신 시 연결된 프로젝트 상태를 `contracted`로 자동 전환

### Gmail → Project
- 지정 레이블 메일 수신 시 `project:lead-created` 이벤트 발행
- 미답장 건은 별도 알림 이벤트 발행

---

## API 엔드포인트 (초안)

```
GET    /api/projects                  # 목록 조회
GET    /api/projects/:id              # 상세 조회
POST   /api/projects                  # 신규 생성
PUT    /api/projects/:id              # 수정
DELETE /api/projects/:id              # 삭제
PATCH  /api/projects/:id/status       # 상태 변경

# 외부 연동
GET    /api/projects/:id/contracts    # 위드싸인 계약서 상태 조회
POST   /api/projects/sync-gmail       # Gmail 동기화
```

---

## 참고 / 레퍼런스

- 위드싸인: [widsign.com](https://www.widsign.com)
- 위드싸인 API 문서: [apidocs.widsign.com](https://apidocs.widsign.com)
