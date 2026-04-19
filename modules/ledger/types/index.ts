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
  budgetLimit: number | null;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  budgetLimit?: number | null;
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
  receiptPath: string | null;
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

// ── CSV 가져오기 ──────────────────────────────────────────────

export interface ImportPreviewRow {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: {
    date?: string;
    amount?: number;
    type?: EntryType;
    description?: string;
    categoryName?: string;
    paymentMethodName?: string;
    notes?: string;
  };
  duplicate: boolean;
  parseError?: string;
}

export interface ImportMapping {
  dateCol: string;
  amountCol: string;
  /** 수입/지출 구분 열. 없으면 fixedType 사용 */
  typeCol?: string;
  /** typeCol의 값 중 수입으로 판정할 값들 */
  incomeValues?: string[];
  /** typeCol 없을 때 전체 고정 타입 */
  fixedType?: EntryType;
  descriptionCol?: string;
  categoryCol?: string;
  paymentMethodCol?: string;
  notesCol?: string;
  /** 금액 부호로 수입/지출 구분 (양수=수입, 음수=지출) */
  amountSignDeterminesType?: boolean;
}

export interface ImportPreviewResult {
  headers: string[];
  rows: ImportPreviewRow[];
  detectedMapping: ImportMapping;
  totalRows: number;
  duplicateCount: number;
  errorCount: number;
}

export interface ImportCommitResult {
  inserted: number;
  skippedDuplicates: number;
  errors: number;
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
