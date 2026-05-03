# 교통비 관리 — 데이터 모델

---

## 1. 신규 테이블

### `transit_cards` — 등록된 교통카드/패스

```sql
CREATE TABLE transit_cards (
  id              TEXT PRIMARY KEY,           -- UUID
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,              -- 사용자 지정 이름 (예: "내 K-패스")
  card_type       TEXT NOT NULL,              -- 'kpass' | 'climate' | 'suica' | 'pasmo' | 'pass' | 'other'

  -- K-패스 전용 필드
  kpass_tier      TEXT,                       -- 'general' | 'youth' | 'low_income' (기본 등급만 저장)
  kpass_product_id TEXT,                      -- → transit_card_products.id
  kpass_policy_version TEXT DEFAULT '2026-01',-- 정책 버전 스냅샷
  billing_day     INTEGER,                    -- 청구할인 카드의 사용자 결제일 (1~31, cashback면 NULL)

  -- 기후동행카드 전용
  climate_monthly_fee INTEGER,                -- 월정액 (원), 예: 65000 or 62000
  climate_avg_fare    INTEGER,                -- 건당 평균 요금 (계산용, 사용자 입력)

  -- Suica/PASMO 전용
  ic_balance      INTEGER DEFAULT 0,          -- 현재 잔액 (JPY 기준, 엔 단위)
  ic_currency     TEXT DEFAULT 'JPY',         -- 통화

  -- 기간제 패스 전용
  pass_cost       INTEGER,                    -- 구매 금액
  pass_currency   TEXT DEFAULT 'KRW',
  pass_valid_from TEXT,                       -- YYYY-MM-DD
  pass_valid_to   TEXT,                       -- YYYY-MM-DD

  -- 공통
  payment_method_id TEXT,                     -- → ledger_payment_methods.id (Ledger 연동)
  is_default      INTEGER DEFAULT 0,          -- 기본 교통카드 여부
  is_active       INTEGER DEFAULT 1,
  notes           TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
```

---

### `transit_card_brands` — 카드사/은행/플랫폼 브랜드

```sql
CREATE TABLE transit_card_brands (
  id              TEXT PRIMARY KEY,           -- 예: 'shinhan', 'tossbank', 'kakaopay'
  name            TEXT NOT NULL,              -- 표시명
  brand_type      TEXT NOT NULL,              -- 'bank' | 'card_company' | 'fintech' | 'transit_platform'
  official_site_url TEXT,
  is_verified     INTEGER DEFAULT 0,
  source_url      TEXT,
  updated_at      TEXT NOT NULL
);
```

**시드 예시:**

| id | name | brand_type | is_verified |
|---|---|---|---|
| `shinhan` | 신한카드 | card_company | 1 |
| `kb` | KB국민카드 | card_company | 1 |
| `woori` | 우리카드 | card_company | 1 |
| `hana` | 하나카드 | card_company | 1 |
| `tossbank` | 토스뱅크 | bank | 1 |
| `kakaobank` | 카카오뱅크 | bank | 1 |
| `kbank` | 케이뱅크 | bank | 1 |
| `kakaopay` | 카카오페이 | fintech | 1 |
| `naverpay` | 네이버페이 | fintech | 1 |
| `tmoney` | 티머니 | transit_platform | 1 |

---

### `transit_card_products` — 실제 발급/등록 가능한 카드 상품

K-패스 환급 규칙과 추가 혜택은 **브랜드가 아니라 상품 기준**으로 저장한다.

```sql
CREATE TABLE transit_card_products (
  id                TEXT PRIMARY KEY,         -- 예: 'tossbank_kpass_check'
  brand_id          TEXT NOT NULL,            -- → transit_card_brands.id
  name              TEXT NOT NULL,            -- 예: '토스뱅크 K-패스 체크카드'
  product_type      TEXT NOT NULL,            -- 'credit' | 'check' | 'prepaid' | 'mobile'
  supports_kpass    INTEGER NOT NULL DEFAULT 1,
  refund_method     TEXT NOT NULL,            -- 'billing_discount' | 'cashback'
  refund_day        INTEGER,                  -- 대표 지급일 또는 지급 시작일
  refund_day_text   TEXT NOT NULL,            -- 예: '매달 25일 계좌 입금'
  refund_timing     TEXT NOT NULL,            -- 'next_billing' | 'business_day_range' | 'fixed_day' | 'fixed_day_prev_business_day' | 'last_business_day' | 'coupon_window'
  billing_day_note  TEXT,
  requires_manual_card_registration INTEGER DEFAULT 0,
  valid_from        TEXT,
  valid_to          TEXT,
  is_active         INTEGER DEFAULT 1,
  is_verified       INTEGER DEFAULT 0,
  source_url        TEXT,
  updated_at        TEXT NOT NULL
);
```

**시드 예시:**

| id | brand_id | name | product_type | refund_method | refund_timing | refund_day_text | is_verified |
|---|---|---|---|---|---|---|---|
| `shinhan_kpass` | `shinhan` | 신한 K-패스 | credit | cashback | business_day_range | 익월 7~9영업일 이후 결제계좌 입금 | 1 |
| `kb_kpass` | `kb` | KB국민 K-패스 | credit | cashback | last_business_day | 익월 마지막 영업일 계좌 입금 | 1 |
| `kakaopay_kpass` | `kakaopay` | 카카오페이 K-패스 | mobile | cashback | coupon_window | 익월 20~27일 오전 10시 카카오페이 앱 쿠폰함 지급 | 1 |
| `kbank_one_kpass` | `kbank` | ONE 체크카드(K-패스) | check | cashback | fixed_day_prev_business_day | 익월 15일, 휴일이면 다음 영업일 계좌 입금 | 1 |
| `kakaobank_friends_kpass` | `kakaobank` | 프렌즈 체크카드(K-패스) | check | cashback | fixed_day_prev_business_day | 익월 20일, 휴일이면 직전 영업일 계좌 입금 | 1 |
| `tossbank_kpass_check` | `tossbank` | 토스뱅크 K-패스 체크카드 | check | cashback | fixed_day | 매달 25일 계좌 입금 | 1 |
| `tmoney_kpass` | `tmoney` | 티머니 K-패스 | prepaid | cashback | fixed_day | 익월 16일 지급 | 1 |

> 2026-01-20 국토교통부 발표 기준 신규 확대 브랜드:
> 전북은행, 신협, 경남은행, 새마을금고, 제주은행, 토스뱅크, 티머니.
> 실제 구현에서는 **브랜드별 1개 이상 상품**이 들어갈 수 있으므로
> 브랜드와 상품을 분리한 구조를 유지한다.

---

### `transit_product_benefits` — 상품별 추가 혜택

K-패스 기본 환급 외에 카드 상품이 자체 제공하는 교통비 관련 부가혜택을 저장한다.

```sql
CREATE TABLE transit_product_benefits (
  id                TEXT PRIMARY KEY,         -- UUID
  product_id        TEXT NOT NULL,            -- → transit_card_products.id
  title             TEXT NOT NULL,            -- 예: "교통비 2천원 추가 캐시백"
  benefit_type      TEXT NOT NULL,            -- 'cashback' | 'coupon' | 'balance_topup' | 'base_card_perk'
  applies_to        TEXT NOT NULL,            -- 'transit_spend' | 'card_usage' | 'mobile_transit'
  condition_summary TEXT NOT NULL,            -- 사용자 표시용 조건 요약
  amount_mode       TEXT NOT NULL,            -- 'fixed' | 'percentage' | 'tiered'
  amount_value      INTEGER,
  amount_cap        INTEGER,
  threshold_amount  INTEGER,
  requires_prev_month_spend INTEGER DEFAULT 0,
  is_stackable_with_kpass INTEGER DEFAULT 1,
  payout_method     TEXT NOT NULL,            -- 'bank_deposit' | 'coupon_box' | 'balance_topup' | 'card_cashback'
  valid_from        TEXT,
  valid_to          TEXT,
  source_url        TEXT,
  is_verified       INTEGER DEFAULT 0,
  notes             TEXT,
  updated_at        TEXT NOT NULL
);
```

**시드 예시:**

| product_id | title | benefit_type | condition_summary | amount_mode | amount_value | amount_cap | payout_method | is_verified |
|---|---|---|---|---|---|---|---|---|
| `tossbank_kpass_check` | 교통비 2,000원 추가 캐시백 | cashback | 월 교통비 4만 원 이상 | fixed | 2000 | 2000 | bank_deposit | 1 |
| `kbank_one_kpass` | 교통비 3,000원 추가 캐시백 | cashback | 전월 실적 30만 원 이상 + 전월 대중교통비 5만 원 이상 | fixed | 3000 | 3000 | bank_deposit | 1 |
| `kakaopay_kpass` | 모바일교통 10% 추가 충전쿠폰 | coupon | 전월 모바일교통카드 이용금액 10만/20만/30만 원 이상 시 최대 2천/5천/7천 원 | tiered | 10 | 7000 | coupon_box | 1 |

---

### `transit_refund_schedule` — K-패스 환급 일정 추적

월별 환급 예정/완료 상태를 추적한다.

```sql
CREATE TABLE transit_refund_schedule (
  id              TEXT PRIMARY KEY,           -- UUID
  user_id         TEXT NOT NULL,
  transit_card_id TEXT NOT NULL,              -- → transit_cards.id
  year            INTEGER NOT NULL,
  month           INTEGER NOT NULL,           -- 사용 월 (예: 5 = 5월 사용분)

  -- 집계 (월말 또는 요청 시 계산)
  trip_count      INTEGER NOT NULL DEFAULT 0, -- 해당 월 탑승 횟수
  total_fare      INTEGER NOT NULL DEFAULT 0, -- 해당 월 교통비 합계 (원)
  refund_rate     REAL NOT NULL DEFAULT 0,    -- 적용 환급율 (0.20 / 0.30 / 0.53)
  estimated_refund INTEGER NOT NULL DEFAULT 0,-- 예상 환급액 (원)
  actual_refund   INTEGER,                    -- 실제 환급액 (사용자 확인 후 입력)

  -- 환급 상태
  status          TEXT NOT NULL DEFAULT 'pending',
  -- 'ineligible'  : 15회 미만, 환급 없음
  -- 'pending'     : 환급 예정 (집계 완료, 아직 지급 전)
  -- 'scheduled'   : 환급 지급일 확정됨
  -- 'received'    : 환급 수령 완료 (Ledger Entry 생성됨)
  -- 'skipped'     : 해당 월 미사용

  refund_date     TEXT,                       -- 예상/실제 지급일 (YYYY-MM-DD)
  ledger_entry_id TEXT,                       -- → ledger_entries.id (수입 항목 연결)
  notes           TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,

  UNIQUE(transit_card_id, year, month)
);
```

---

## 2. Ledger 기존 테이블 변경

### `ledger_payment_methods.type` 확장

```
기존: 'cash' | 'credit_card' | 'debit_card' | 'transfer' | 'other'
추가: 'transit_card'
```

결제수단으로 교통카드를 선택하면 → `transit_cards` 테이블과 연동.

---

## 3. TypeScript 타입 정의

```typescript
// modules/ledger/types/transit.ts

export type TransitCardType = 'kpass' | 'climate' | 'suica' | 'pasmo' | 'pass' | 'other';
export type KpassTier = 'general' | 'youth' | 'low_income';
export type RefundMethod = 'billing_discount' | 'cashback';
export type RefundTiming =
  | 'next_billing'
  | 'business_day_range'
  | 'fixed_day'
  | 'fixed_day_prev_business_day'
  | 'last_business_day'
  | 'coupon_window';
export type RefundStatus = 'ineligible' | 'pending' | 'scheduled' | 'received' | 'skipped';
export type KpassBenefitMode = 'basic' | 'modu_general' | 'modu_plus';
export type TransitCardBrandType = 'bank' | 'card_company' | 'fintech' | 'transit_platform';
export type TransitProductBenefitType = 'cashback' | 'coupon' | 'balance_topup' | 'base_card_perk';
export type TransitProductBenefitAppliesTo = 'transit_spend' | 'card_usage' | 'mobile_transit';
export type TransitProductBenefitAmountMode = 'fixed' | 'percentage' | 'tiered';
export type TransitProductBenefitPayoutMethod = 'bank_deposit' | 'coupon_box' | 'balance_topup' | 'card_cashback';

export interface TransitCardBrand {
  id: string;
  name: string;
  brandType: TransitCardBrandType;
  officialSiteUrl: string | null;
  isVerified: boolean;
  sourceUrl: string | null;
}

export interface TransitCardProduct {
  id: string;
  brandId: string;
  brand: TransitCardBrand;
  name: string;
  productType: 'credit' | 'check' | 'prepaid' | 'mobile';
  supportsKpass: boolean;
  refundMethod: RefundMethod;
  refundTiming: RefundTiming;
  refundDay: number | null;
  refundDayText: string;
  billingDayNote: string | null;
  requiresManualCardRegistration: boolean;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  isVerified: boolean;
  sourceUrl: string | null;
  benefits: TransitProductBenefit[];
}

export interface TransitProductBenefit {
  id: string;
  productId: string;
  title: string;
  benefitType: TransitProductBenefitType;
  appliesTo: TransitProductBenefitAppliesTo;
  conditionSummary: string;
  amountMode: TransitProductBenefitAmountMode;
  amountValue: number | null;
  amountCap: number | null;
  thresholdAmount: number | null;
  requiresPrevMonthSpend: boolean;
  isStackableWithKpass: boolean;
  payoutMethod: TransitProductBenefitPayoutMethod;
  validFrom: string | null;
  validTo: string | null;
  sourceUrl: string | null;
  isVerified: boolean;
  notes: string | null;
}

export interface TransitCard {
  id: string;
  userId: string;
  name: string;
  cardType: TransitCardType;

  // K-패스
  kpassTier: KpassTier | null;          // 기본 등급만 저장, 지역/가구 가산은 별도 정책 적용
  kpassProductId: string | null;
  kpassProduct: TransitCardProduct | null;  // JOIN
  kpassPolicyVersion: string;             // 예: '2026-01'
  billingDay: number | null;             // 청구할인 카드 결제일 (cashback면 null)

  // 기후동행카드
  climateMonthlyFee: number | null;
  climateAvgFare: number | null;

  // IC카드
  icBalance: number | null;
  icCurrency: string;

  // 패스
  passCost: number | null;
  passCurrency: string;
  passValidFrom: string | null;
  passValidTo: string | null;

  // 공통
  paymentMethodId: string | null;
  isDefault: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransitRefundSchedule {
  id: string;
  userId: string;
  transitCardId: string;
  year: number;
  month: number;
  tripCount: number;
  totalFare: number;
  refundRate: number;
  estimatedRefund: number;
  actualRefund: number | null;
  status: RefundStatus;
  refundDate: string | null;
  ledgerEntryId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// K-패스 환급율 상수
export const KPASS_REFUND_RATES: Record<KpassTier, number> = {
  general:    0.20,
  youth:      0.30,
  low_income: 0.53,
};

export const KPASS_TRIP_THRESHOLD = 15;          // 월 최소 탑승 횟수
export const KPASS_DAILY_TRIP_CAP = 2;          // 1일 최대 인정 횟수
export const KPASS_MONTHLY_TRIP_CAP = 60;       // 월 최대 인정 횟수
export const KPASS_FARE_CAP = 200000;           // 월 20만원까지 전액 인정
export const KPASS_OVER_CAP_RATIO = 0.5;        // 20만원 초과분은 50%만 반영
export const KPASS_POLICY_VERSION = '2026-01';  // 모두의 카드 도입 이후 정책 기준

// 월별 교통 요약
export interface TransitMonthlySummary {
  year: number;
  month: number;
  card: TransitCard;
  tripCount: number;
  recognizedTripCount: number;
  totalFare: number;
  recognizedFare: number;
  // K-패스
  isKpassEligible: boolean;        // 15회 이상 여부
  tripsToThreshold: number;        // 남은 탑승 횟수 (15회까지)
  estimatedRefund: number;
  benefitMode: KpassBenefitMode | null;
  estimatedProductBenefit: number; // 상품 추가 혜택 예상액
  refundSchedule: TransitRefundSchedule | null;
  // 기후동행카드
  climateSavings: number | null;   // 절감액 (양수) 또는 손해액 (음수)
}
```

---

## 4. K-패스 환급일 계산 로직

```typescript
/**
 * 특정 월 사용분의 K-패스 환급 예상일을 계산한다.
 * - fixed_day / fixed_day_prev_business_day: 다음달 product.refundDay 기준
 * - coupon_window / business_day_range / last_business_day:
 *   사용자 알림은 지급 시작일 또는 대표일로 계산하고,
 *   UI에는 product.refundDayText를 그대로 표시
 * - billing_discount (next_billing): 사용자의 카드 결제일 기준
 *   → 카드 결제일은 사용자가 카드 설정 시 입력
 *   → 예: 결제일 15일이면 다음달 15일에 청구서 반영
 */
function calcRefundDate(
  usageYear: number,
  usageMonth: number,
  product: TransitCardProduct,
  userBillingDay?: number,  // 청구할인 카드의 카드 결제일
): string {
  const nextMonth = usageMonth === 12
    ? { year: usageYear + 1, month: 1 }
    : { year: usageYear, month: usageMonth + 1 };

  if (product.refundTiming === 'fixed_day' && product.refundDay) {
    return `${nextMonth.year}-${String(nextMonth.month).padStart(2, '0')}-${String(product.refundDay).padStart(2, '0')}`;
  }

  // billing_discount: 카드 결제일 기준
  const day = userBillingDay ?? 1;  // 모르면 1일로 표시
  return `${nextMonth.year}-${String(nextMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
```

> 청구할인 카드는 결제일이 사람마다 달라서 `transit_cards` 테이블에
> `billing_day INTEGER` 컬럼을 추가해 사용자가 직접 입력하게 한다.

---

## 5. 마이그레이션 파일 위치

```
modules/ledger/backend/migrations/
  004_transit_brands.sql       — transit_card_brands 테이블 + 시드 데이터
  004a_transit_products.sql    — transit_card_products 테이블 + 상품 시드 데이터
  004b_transit_product_benefits.sql — transit_product_benefits 테이블 + 혜택 시드 데이터
  005_transit_cards.sql        — transit_cards 테이블 (billing_day 포함)
  006_transit_refunds.sql      — transit_refund_schedule 테이블
  007_payment_type_transit.sql — ledger_payment_methods.type에 transit_card 추가
```
