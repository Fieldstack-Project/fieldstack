// ── Subscription 모듈 공통 타입 ───────────────────────────────────

export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionCurrency = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'GBP';

// ── 구독 서비스 ───────────────────────────────────────────────────

export interface Subscription {
  id: string;
  userId: string;
  serviceName: string;
  currentAmount: number;
  currency: SubscriptionCurrency;
  billingCycle: BillingCycle;
  /** 결제일 (1~31) */
  billingDay: number;
  /** 구독 시작일 (YYYY-MM-DD) */
  startedAt: string;
  nextPaymentDate: string;   // YYYY-MM-DD
  isActive: boolean;
  cancelledAt: string | null;
  category: string | null;
  description: string | null;
  url: string | null;
  tags: string[];
  /** 누적 결제 금액 (KRW 환산) */
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionDto {
  serviceName: string;
  currentAmount: number;
  currency: SubscriptionCurrency;
  billingCycle: BillingCycle;
  billingDay: number;
  startedAt?: string;   // YYYY-MM-DD, 기본값: 오늘
  category?: string;
  description?: string;
  url?: string;
  tags?: string[];
}

export interface UpdateSubscriptionDto extends Partial<CreateSubscriptionDto> {
  isActive?: boolean;
  cancelledAt?: string | null;
}

// ── 가격 히스토리 ────────────────────────────────────────────────

export interface PriceHistory {
  id: string;
  subscriptionId: string;
  effectiveDate: string;   // YYYY-MM-DD — 이 가격이 적용되기 시작한 날짜
  amount: number;
  currency: SubscriptionCurrency;
  reason: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreatePriceHistoryDto {
  effectiveDate: string;
  amount: number;
  currency: SubscriptionCurrency;
  reason?: string;
  note?: string;
}

// ── 통계 ──────────────────────────────────────────────────────────

export interface SubscriptionSummary {
  totalMonthlyKrw: number;     // 모든 활성 구독의 월 환산 합계 (KRW)
  totalYearlyKrw: number;
  activeCount: number;
  inactiveCount: number;
  nextPaymentDate: string | null;   // 가장 가까운 다음 결제일
  nextPaymentServices: string[];    // 해당일 결제 서비스명 목록
}

export interface CumulativeResult {
  subscriptionId: string;
  currency: SubscriptionCurrency;
  totalPaid: number;
  currentPricePaid: number;
  priceChangeCount: number;
  averageMonthly: number;
  daysSinceStart: number;
  periods: CumulativePeriod[];
}

export interface CumulativePeriod {
  effectiveDate: string;
  endDate: string | null;
  amount: number;
  currency: SubscriptionCurrency;
  paymentCount: number;
  periodTotal: number;
}

// ── 메모 ──────────────────────────────────────────────────────────

export interface SubscriptionNote {
  id: string;
  subscriptionId: string;
  content: string;
  createdAt: string;
}

export interface CreateNoteDto {
  content: string;
}

// ── API 공통 응답 ─────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
