# 교통비 관리 — 구현 단계 계획

---

## Phase 1 — 기반 (백엔드 + 사이드바 연결)

**목표**: 교통카드 등록, 사이드바 서브탭 진입, 기본 UI 골격

**핵심 원칙**
- [ ] 브랜드는 선택 보조 데이터로만 사용하고, 실제 계산/저장은 항상 상품 기준으로 처리
- [ ] 정책 환급과 상품 혜택은 계산과 저장 단계에서 분리 유지
- [ ] 비활성/종료 상품도 기존 사용자 데이터 조회는 가능해야 함

### 1-1. 사이드바 서브탭 등록
- [ ] `apps/web/src/moduleRegistry.tsx`: ledger `subNav` 배열에 `transit` 항목 추가
- [ ] `LedgerView.tsx`: `subRoute === 'transit'` 분기 → `<TransitView />` 렌더링

### 1-2. DB 마이그레이션
- [ ] `004_transit_brands.sql`: `transit_card_brands` 테이블 + 브랜드 시드 데이터
- [ ] `004a_transit_products.sql`: `transit_card_products` 테이블 + 상품 시드 데이터
- [ ] `004b_transit_product_benefits.sql`: `transit_product_benefits` 테이블 + 검증된 추가 혜택 시드
- [ ] `005_transit_cards.sql`: `transit_cards` 테이블 (`billing_day`, `kpass_policy_version` 포함)
- [ ] `006_transit_refunds.sql`: `transit_refund_schedule` 테이블
- [ ] `007_payment_type_transit.sql`: `ledger_payment_methods.type`에 `transit_card` 추가

### 1-3. 타입 정의
- [ ] `modules/ledger/types/transit.ts`: 모든 타입 및 상수 정의

### 1-4. 백엔드 서비스 (카드 CRUD + 브랜드/상품 목록)
- [ ] `GET /api/ledger/transit/brands`
- [ ] `GET /api/ledger/transit/products`
- [ ] `GET /api/ledger/transit/benefits`
- [ ] `GET /api/ledger/transit/cards`
- [ ] `POST /api/ledger/transit/cards` (결제수단 자동 생성 포함)
- [ ] `PATCH /api/ledger/transit/cards/:id`
- [ ] `DELETE /api/ledger/transit/cards/:id` (소프트 삭제)

### 1-5. 프론트엔드 골격
- [ ] `TransitView.tsx`: 레이아웃 셸 (카드 목록 + 월별 현황 영역)
- [ ] `TransitCardList.tsx`: 등록된 카드 목록 표시
- [ ] `TransitCardModal.tsx`: 카드 추가/수정 모달 (카드 종류별 필드 분기, 브랜드 → 상품 선택)
- [ ] `transit.css`: 기본 레이아웃 스타일

**완료 기준**: 사이드바에서 교통비 관리 탭 진입 → 카드 등록/수정/삭제 가능

---

## Phase 2 — K-패스 집계 및 환급 계산

**목표**: 월별 탑승 횟수 집계, 환급액 계산, 환급 스케줄 생성

### 2-1. 집계 서비스
- [ ] `GET /api/ledger/transit/summary`: Ledger Entry 기반 월별 집계
  - 결제수단 type = `transit_card` 인 항목 필터
  - `transit_cards.card_type = 'kpass'` 인 카드별 집계
  - 탑승 횟수 COUNT + 교통비 합계 SUM
  - 1일 2회 / 월 60회 / 환승 30분 규칙 반영
  - K-패스 기본형 환급액 계산
  - 모두의 카드(`basic` / `modu_general` / `modu_plus`) 최대값 계산 구조 마련
- [ ] `POST /api/ledger/transit/summary/recalculate`: 강제 재계산
- [ ] `transit_refund_schedule` 자동 생성/업데이트 (집계 시)

### 2-2. 환급일 계산
- [ ] `calcRefundDate()` 유틸 함수 구현
  - `cashback + fixed_day`: 다음달 product.refundDay일
  - `billing_discount + next_billing`: 다음달 `transit_cards.billing_day`일

### 2-3. 상품 추가 혜택 계산
- [ ] `transit_product_benefits` 시드 테이블 추가
- [ ] 상품 부가혜택 계산기 구현
  - 고정금액형 (`fixed`)
  - 비율형 (`percentage`)
  - 구간형 (`tiered`)
- [ ] `estimatedProductBenefit` 필드 집계 결과에 포함
- [ ] K-패스 정책 환급과 상품 부가혜택을 분리 표시

### 2-4. 프론트엔드 — K-패스 집계 카드
- [ ] `KpassSummary.tsx`:
  - 탑승 횟수 프로그레스 바 (15회 기준, 미달/달성 색상)
  - 교통비 합계 / 예상 환급액 표시
  - 상품 추가 혜택 표시
  - 총 예상 혜택 표시
  - 환급 예정일 표시
  - [환급 수령 완료로 등록] 버튼 (status: pending 시 표시)

**완료 기준**: 이번 달 K-패스 탑승 횟수, 정책 환급액, 상품 추가 혜택이 구분되어 계산·표시됨

---

## Phase 3 — 환급 수령 처리 및 이력

**목표**: 환급 수령 시 Ledger 수입 항목 자동 생성 + 이력 관리

### 3-1. 환급 수령 API
- [ ] `POST /api/ledger/transit/refunds/:id/receive`:
  - `transit_refund_schedule` 상태 → `received`
  - Ledger Entry 자동 생성 (income, 교통비 환급 카테고리)
  - `ledger_entry_id` 연결
- [ ] `PATCH /api/ledger/transit/refunds/:id`: 수동 수정
- [ ] `GET /api/ledger/transit/refunds`: 환급 일정 목록 (upcoming 필터 포함)

### 3-2. 프론트엔드 — 환급 처리
- [ ] `KpassRefundModal.tsx`: 환급 수령 등록 모달
  - 실제 수령액 입력 (기본값: 예상 환급액)
  - 수령일 입력
  - Ledger 수입 항목 미리보기 표시
- [ ] `KpassRefundHistory.tsx`: 환급 이력 테이블
  - 월별 탑승 횟수 / 환급액 / 상태 / 수령일

**완료 기준**: [환급 수령 완료] 클릭 → 가계부 수입에 자동 등록됨

---

## Phase 4 — 기후동행카드 분석

### 4-1. 백엔드
- [ ] `GET /api/ledger/transit/climate-analysis`:
  - 월별 이용 횟수 × 건당 평균 요금 = 환산 교통비
  - 월정액 대비 절감/손해 계산
  - 본전 탑승 횟수 계산

### 4-2. 프론트엔드
- [ ] `ClimateAnalysis.tsx`: 손익 현황 + 월별 추이

**완료 기준**: 기후동행카드 손익이 월별로 표시됨

---

## Phase 5 — IC카드 (Suica/PASMO)

### 5-1. 백엔드
- [ ] `PATCH /api/ledger/transit/cards/:id/balance`: 잔액 수동 업데이트
  - 충전 시 Ledger 지출 항목 선택적 자동 생성

### 5-2. 프론트엔드
- [ ] `IcCardBalance.tsx`: 잔액 표시 + 충전 이력

**완료 기준**: Suica/PASMO 잔액이 기록·추적됨

---

## 확인 필요 사항 (구현 전 검증)

| # | 항목 | 중요도 |
|---|------|--------|
| 1 | 모두의 카드 일반형/플러스형 지역 기준금액을 정책 테이블로 어떻게 모델링할지 | 높음 |
| 2 | 환승 30분 묶음 규칙을 Ledger Entry 구조에서 어떻게 복원할지 | 높음 |
| 3 | 경기/인천/광주/경남/울산 등 지자체 특례를 사용자 프로필과 어떻게 연결할지 | 높음 |
| 4 | 2026 신규 확대 카드사(전북·신협·경남·새마을금고·제주)의 상세 지급 문구 수집 | 중간 |
| 5 | 상품 추가 혜택의 종료일/프로모션 여부를 어떤 주기로 동기화할지 | 중간 |
| 6 | 토스뱅크 원스톱 가입 흐름을 별도 UX로 드러낼지 여부 | 낮음 |

> 이미 공식 지급 문구까지 확인된 카드사는 `is_verified = 1`로 반영하고,
> 2026 신규 확대 카드사 중 상세 문구가 공개되지 않은 대상만 후속 확인한다.

---

## 구현 우선순위 요약

```
Phase 1 (필수) → Phase 2 (핵심) → Phase 3 (핵심) → Phase 4 (추가) → Phase 5 (추가)
```

Phase 1~3이 K-패스 핵심 기능이며 우선 구현.
Phase 4~5는 기후동행/IC카드 사용자가 생기면 추가.
