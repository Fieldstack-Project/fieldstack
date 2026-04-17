// ── Ledger 모듈 공통 타입 ──────────────────────────────────────

export type EntryType = 'income' | 'expense';
export type CategoryType = 'income' | 'expense' | 'both';
export type PaymentMethodType = 'cash' | 'credit_card' | 'debit_card' | 'transfer' | 'other';

// ── 카테고리 ──────────────────────────────────────────────────

export interface LedgerCategory {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
}

// ── 결제 수단 ─────────────────────────────────────────────────

export interface LedgerPaymentMethod {
  id: string;
  userId: string;
  name: string;
  type: PaymentMethodType;
  isDefault: boolean;
  createdAt: string;
}

export interface CreatePaymentMethodDto {
  name: string;
  type: PaymentMethodType;
}

// ── 가계부 항목 ───────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  userId: string;
  date: string;           // ISO 날짜 문자열 (YYYY-MM-DD)
  amount: number;         // 양수 (type으로 수입/지출 구분)
  type: EntryType;
  categoryId: string | null;
  categoryName: string | null;
  description: string;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntryDto {
  date: string;
  amount: number;
  type: EntryType;
  categoryId?: string;
  description: string;
  paymentMethodId?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateEntryDto extends Partial<CreateEntryDto> {}

// ── 통계 ──────────────────────────────────────────────────────

export interface LedgerSummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  entryCount: number;
  byCategory: CategoryStat[];
}

export interface CategoryStat {
  categoryId: string | null;
  categoryName: string | null;
  type: EntryType;
  total: number;
  count: number;
}

// ── API 공통 응답 ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
