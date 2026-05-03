# 교통비 관리 — API 설계

모든 엔드포인트는 Bearer 토큰 인증 필요.
기본 경로: `/api/ledger/transit`

---

## 1. 브랜드/상품 정보 (Read-only, 시드 데이터)

> 규칙:
> API는 브랜드를 조회할 수 있어야 하지만, 환급 계산과 혜택 계산에는 항상 `product_id`를 사용한다.

### `GET /api/ledger/transit/brands`
K-패스 발급 브랜드 목록을 반환한다.

### `GET /api/ledger/transit/products`
선택한 브랜드에 속한 카드 상품 목록을 반환한다.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tossbank_kpass_check",
      "brandId": "tossbank",
      "brandName": "토스뱅크",
      "name": "토스뱅크 K-패스 체크카드",
      "refundMethod": "cashback",
      "refundTiming": "fixed_day",
      "refundDay": 25,
      "refundDayText": "매달 25일 계좌 입금",
      "billingDayNote": null,
      "isVerified": true,
      "benefits": [
        {
          "id": "benefit_toss_transport_2000",
          "title": "교통비 2,000원 추가 캐시백",
          "benefitType": "cashback",
          "appliesTo": "transit_spend",
          "conditionSummary": "월 교통비 4만 원 이상",
          "amountMode": "fixed",
          "amountValue": 2000,
          "amountCap": 2000,
          "payoutMethod": "bank_deposit",
          "isStackableWithKpass": true,
          "isVerified": true
        }
      ]
    }
  ]
}
```

---

## 2. 교통카드 관리 (CRUD)

> 규칙:
> `POST/PATCH /cards`는 `kpassProductId`를 기준으로 저장하며,
> 브랜드명만으로 상품을 암묵 추론하지 않는다.

### `GET /api/ledger/transit/cards`
등록된 교통카드 목록.

**Query:**
- `activeOnly?: boolean` (기본 true)

---

### `POST /api/ledger/transit/cards`
교통카드 등록.

**Body:**
```json
{
  "name": "내 K-패스",
  "cardType": "kpass",
  "kpassTier": "youth",
  "kpassProductId": "kakaopay_kpass",
  "billingDay": 15,
  "paymentMethodId": "pm_xxx"
}
```

등록 시 Ledger 결제수단(`ledger_payment_methods`)에 `transit_card` 타입 항목 자동 생성 옵션 포함.

---

### `PATCH /api/ledger/transit/cards/:id`
카드 정보 수정.

---

### `DELETE /api/ledger/transit/cards/:id`
카드 비활성화 (소프트 삭제, `is_active = 0`).
연결된 환급 스케줄이 있으면 경고 반환.

---

## 3. 월별 교통 요약

### `GET /api/ledger/transit/summary`
특정 월의 교통비 집계 + K-패스 환급 계산.

**Query:**
- `year: number`
- `month: number`
- `cardId?: string` (생략 시 전체 교통카드)

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "month": 5,
    "cards": [
      {
        "card": { "id": "...", "name": "내 토스 K-패스", "cardType": "kpass", ... },
        "tripCount": 18,
        "recognizedTripCount": 18,
        "totalFare": 43200,
        "recognizedFare": 43200,
        "isKpassEligible": true,
        "tripsToThreshold": 0,
        "estimatedRefund": 12960,
        "estimatedProductBenefit": 2000,
        "refundRate": 0.30,
        "benefitMode": "basic",
        "refundSchedule": {
          "id": "...",
          "status": "pending",
          "refundDate": "2026-06-25",
          "estimatedRefund": 12960,
          "actualRefund": null
        },
        "climateSavings": null
      }
    ],
    "totalTransitFare": 43200
  }
}
```

**K-패스 계산 로직 (서버 사이드):**
```
tripCount = 월 교통 이용 전체 건수
recognizedTripCount = 일별 금액순 최대 2건만 인정 후, 월 기준 상위 60건까지 반영
totalFare = 전체 교통비 합계
recognizedFare = MIN(totalFare, 200000) + MAX(totalFare - 200000, 0) * 0.5
isEligible = firstMonth ? tripCount >= 1 : tripCount >= 15
estimatedBasicRefund = isEligible ? recognizedFare * kpass_tier_rate : 0
benefitMode = 'basic' | 'modu_general' | 'modu_plus' 중 최대값
estimatedProductBenefit = product.benefits 규칙에 따라 별도 계산
```

> 탑승 횟수 집계 방식:
> Ledger Entry 1건 = 탑승 1회로 계산.
> 환승은 별도 Entry로 기록하지 않고 1회 이동 = 1 Entry 권장.
> 다만 K-패스 공식 규칙과 맞추려면 **환승(30분 이내)**, **1일 2회 제한**, **월 60회 제한**을
> 서버 집계 로직에서 별도로 보정해야 한다.

---

### `POST /api/ledger/transit/summary/recalculate`
특정 월 집계를 강제 재계산 후 `transit_refund_schedule` 업데이트.

**Body:**
```json
{ "cardId": "card_xxx", "year": 2026, "month": 5 }
```

---

## 4. 환급 스케줄 관리

### `GET /api/ledger/transit/refunds`
환급 일정 목록.

**Query:**
- `status?: RefundStatus`
- `year?: number`
- `upcoming?: boolean` (향후 30일 내 지급 예정)

**Response 예시:**
```json
{
  "data": [
    {
      "id": "...",
      "year": 2026,
      "month": 5,
      "card": { "name": "토스뱅크 K-패스 체크카드" },
      "tripCount": 18,
      "estimatedRefund": 12960,
      "status": "pending",
      "refundDate": "2026-06-25"
    }
  ]
}
```

---

### `POST /api/ledger/transit/refunds/:id/receive`
환급 수령 처리. Ledger 수입 항목을 자동 생성한다.

**Body:**
```json
{
  "actualRefund": 12960,
  "receivedDate": "2026-06-25",
  "notes": "토스뱅크 K-패스 추가 캐시백 수령"
}
```

**처리:**
1. `transit_refund_schedule.status` → `received`
2. `transit_refund_schedule.actual_refund` 업데이트
3. Ledger Entry 자동 생성:
   ```
   date: receivedDate
   type: income
   amount: actualRefund
   description: "[K-패스] 5월 교통비 환급"
   category: "교통비 환급" (없으면 자동 생성)
   paymentMethodId: 해당 transit_card의 paymentMethodId
   ```
4. `ledger_entry_id` 기록

---

### `PATCH /api/ledger/transit/refunds/:id`
환급 정보 수동 수정 (금액, 날짜, 메모).

---

## 5. 상품 추가 혜택

### `GET /api/ledger/transit/benefits`

카드 상품별 추가 혜택 목록을 반환한다.

**Query:**
- `productId?: string`
- `activeOn?: string` (`YYYY-MM-DD`)
- `stackableOnly?: boolean`

**Response 예시:**
```json
{
  "data": [
    {
      "productId": "tossbank_kpass_check",
      "title": "교통비 2,000원 추가 캐시백",
      "conditionSummary": "월 교통비 4만 원 이상",
      "amountMode": "fixed",
      "amountValue": 2000,
      "payoutMethod": "bank_deposit",
      "isVerified": true
    },
    {
      "productId": "kbank_one_kpass",
      "title": "교통비 3,000원 추가 캐시백",
      "conditionSummary": "전월 실적 30만 원 이상 + 전월 대중교통비 5만 원 이상",
      "amountMode": "fixed",
      "amountValue": 3000,
      "payoutMethod": "bank_deposit",
      "isVerified": true
    }
  ]
}
```

### 계산 원칙

- `estimatedRefund`는 **K-패스 정책 환급액만** 의미한다.
- `estimatedProductBenefit`는 **상품 추가 혜택 예상액만** 의미한다.
- 화면 총합은 `estimatedRefund + estimatedProductBenefit`으로 보여주되,
  회계 등록 시에는 **정책 환급**과 **상품 혜택**을 별도 라인으로 분리할 수 있어야 한다.

---

## 6. 기후동행카드 손익 분석

### `GET /api/ledger/transit/climate-analysis`

**Query:**
- `cardId: string`
- `year: number`
- `month: number`

**Response:**
```json
{
  "data": {
    "monthlyFee": 65000,
    "tripCount": 42,
    "estimatedFareWithoutCard": 63000,
    "savings": -2000,
    "breakEvenTrips": 44,
    "isWorthIt": false,
    "message": "이번 달은 44회 이용 시 손익분기점입니다. 현재 42회 사용으로 2,000원 손해입니다."
  }
}
```

---

## 7. IC카드 잔액 관리 (Suica/PASMO)

### `PATCH /api/ledger/transit/cards/:id/balance`
잔액 수동 업데이트.

**Body:**
```json
{
  "balance": 5000,
  "currency": "JPY",
  "chargeAmount": 3000,
  "chargeDate": "2026-05-04"
}
```

충전 시 Ledger 지출 항목 자동 생성 여부 선택 가능.

---

## 8. 정책 메모

- 2026-01부터 K-패스는 **모두의 카드** 체계가 적용되어 기본형/일반형/플러스형 중 유리한 방식으로 계산된다.
- 1차 구현은 `basic` 계산과 카드 상품 지급 추적을 우선 지원하고,
  `modu_general` / `modu_plus` 및 지자체 특례는 정책 버전별 확장으로 분리한다.
- 상품 추가 혜택은 정책 환급과 별도 테이블/계산기로 관리하고,
  만료일·실적 조건·프로모션 여부를 함께 저장한다.

---

## 9. 엔드포인트 전체 목록

```
GET    /api/ledger/transit/brands                     브랜드 목록
GET    /api/ledger/transit/products                   카드 상품 목록
GET    /api/ledger/transit/cards                      내 교통카드 목록
POST   /api/ledger/transit/cards                      교통카드 등록
PATCH  /api/ledger/transit/cards/:id                  교통카드 수정
DELETE /api/ledger/transit/cards/:id                  교통카드 비활성화
GET    /api/ledger/transit/summary                    월별 교통 요약
POST   /api/ledger/transit/summary/recalculate        집계 재계산
GET    /api/ledger/transit/refunds                    환급 일정 목록
POST   /api/ledger/transit/refunds/:id/receive        환급 수령 처리
PATCH  /api/ledger/transit/refunds/:id                환급 정보 수정
GET    /api/ledger/transit/benefits                   상품 추가 혜택 목록
GET    /api/ledger/transit/climate-analysis           기후동행 손익 분석
PATCH  /api/ledger/transit/cards/:id/balance          IC카드 잔액 업데이트
```
