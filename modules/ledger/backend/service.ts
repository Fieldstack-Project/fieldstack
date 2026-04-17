import type { DbProvider } from '@fieldstack/core';

import type {
  CategoryStat,
  CreateCategoryDto,
  CreateEntryDto,
  CreatePaymentMethodDto,
  LedgerCategory,
  LedgerEntry,
  LedgerPaymentMethod,
  LedgerSummary,
  UpdateEntryDto,
} from '../types/index.js';

// ── DB Row 타입 정의 ──────────────────────────────────────────

interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  color: string | null;
  icon: string | null;
  is_default: boolean;
  created_at: string;
}

interface PaymentMethodRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  is_default: boolean;
  created_at: string;
}

interface EntryRow {
  id: string;
  user_id: string;
  date: string;
  // DECIMAL 컬럼은 드라이버에 따라 문자열 또는 숫자로 반환될 수 있음
  amount: string | number;
  type: string;
  category_id: string | null;
  category_name: string | null;
  description: string;
  payment_method_id: string | null;
  payment_method_name: string | null;
  notes: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

interface SummaryRow {
  type: string;
  category_id: string | null;
  category_name: string | null;
  total: string | number;
  count: string | number;
}

interface CountRow {
  count: string | number;
}

// ── Row 변환 헬퍼 ─────────────────────────────────────────────

function rowToEntry(row: EntryRow): LedgerEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    amount: Number(row.amount),
    type: row.type as 'income' | 'expense',
    categoryId: row.category_id,
    categoryName: row.category_name,
    description: row.description,
    paymentMethodId: row.payment_method_id,
    paymentMethodName: row.payment_method_name,
    notes: row.notes,
    tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToCategory(row: CategoryRow): LedgerCategory {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type as LedgerCategory['type'],
    color: row.color,
    icon: row.icon,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

function rowToPaymentMethod(row: PaymentMethodRow): LedgerPaymentMethod {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type as LedgerPaymentMethod['type'],
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

// ── 서비스 ────────────────────────────────────────────────────

export class LedgerService {
  constructor(private readonly db: DbProvider) {}

  // ── 카테고리 ────────────────────────────────────────────────

  async listCategories(userId: string): Promise<LedgerCategory[]> {
    const rows = await this.db.query<CategoryRow>(
      `SELECT * FROM ledger_categories
       WHERE user_id = $1
       ORDER BY is_default DESC, name ASC`,
      [userId],
    );
    return rows.map(rowToCategory);
  }

  async createCategory(userId: string, dto: CreateCategoryDto): Promise<LedgerCategory> {
    const rows = await this.db.query<CategoryRow>(
      `INSERT INTO ledger_categories (user_id, name, type, color, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, dto.name, dto.type, dto.color ?? null, dto.icon ?? null],
    );
    return rowToCategory(rows[0]);
  }

  async deleteCategory(userId: string, categoryId: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      `DELETE FROM ledger_categories WHERE id = $1 AND user_id = $2 RETURNING id`,
      [categoryId, userId],
    );
    return rows.length > 0;
  }

  // ── 결제 수단 ────────────────────────────────────────────────

  async listPaymentMethods(userId: string): Promise<LedgerPaymentMethod[]> {
    const rows = await this.db.query<PaymentMethodRow>(
      `SELECT * FROM ledger_payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, name ASC`,
      [userId],
    );
    return rows.map(rowToPaymentMethod);
  }

  async createPaymentMethod(
    userId: string,
    dto: CreatePaymentMethodDto,
  ): Promise<LedgerPaymentMethod> {
    const rows = await this.db.query<PaymentMethodRow>(
      `INSERT INTO ledger_payment_methods (user_id, name, type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, dto.name, dto.type],
    );
    return rowToPaymentMethod(rows[0]);
  }

  async deletePaymentMethod(userId: string, methodId: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      `DELETE FROM ledger_payment_methods WHERE id = $1 AND user_id = $2 RETURNING id`,
      [methodId, userId],
    );
    return rows.length > 0;
  }

  // ── 가계부 항목 ──────────────────────────────────────────────

  async listEntries(
    userId: string,
    opts: {
      year?: number;
      month?: number;
      type?: 'income' | 'expense';
      categoryId?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ items: LedgerEntry[]; total: number }> {
    const conditions: string[] = ['e.user_id = $1'];
    const params: unknown[] = [userId];
    let idx = 2;

    if (opts.year !== undefined && opts.month !== undefined) {
      // 날짜 범위 비교 방식 — PostgreSQL, SQLite 공통 호환
      const from = `${opts.year}-${String(opts.month).padStart(2, '0')}-01`;
      const toYear = opts.month === 12 ? opts.year + 1 : opts.year;
      const toMonth = opts.month === 12 ? 1 : opts.month + 1;
      const to = `${toYear}-${String(toMonth).padStart(2, '0')}-01`;
      conditions.push(`e.date >= $${idx} AND e.date < $${idx + 1}`);
      params.push(from, to);
      idx += 2;
    } else if (opts.year !== undefined) {
      const from = `${opts.year}-01-01`;
      const to = `${opts.year + 1}-01-01`;
      conditions.push(`e.date >= $${idx} AND e.date < $${idx + 1}`);
      params.push(from, to);
      idx += 2;
    }

    if (opts.type) {
      conditions.push(`e.type = $${idx}`);
      params.push(opts.type);
      idx++;
    }

    if (opts.categoryId) {
      conditions.push(`e.category_id = $${idx}`);
      params.push(opts.categoryId);
      idx++;
    }

    const where = conditions.join(' AND ');

    // 전체 건수
    const [countRow] = await this.db.query<CountRow>(
      `SELECT COUNT(*) AS count FROM ledger_entries e WHERE ${where}`,
      params,
    );
    const total = Number(countRow.count);

    // 페이지 데이터 (카테고리, 결제 수단 JOIN)
    const offset = (opts.page - 1) * opts.limit;
    const rows = await this.db.query<EntryRow>(
      `SELECT
         e.*,
         c.name  AS category_name,
         pm.name AS payment_method_name
       FROM ledger_entries e
       LEFT JOIN ledger_categories      c  ON c.id  = e.category_id
       LEFT JOIN ledger_payment_methods pm ON pm.id = e.payment_method_id
       WHERE ${where}
       ORDER BY e.date DESC, e.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, opts.limit, offset],
    );

    return { items: rows.map(rowToEntry), total };
  }

  async getEntry(userId: string, entryId: string): Promise<LedgerEntry | null> {
    const rows = await this.db.query<EntryRow>(
      `SELECT
         e.*,
         c.name  AS category_name,
         pm.name AS payment_method_name
       FROM ledger_entries e
       LEFT JOIN ledger_categories      c  ON c.id  = e.category_id
       LEFT JOIN ledger_payment_methods pm ON pm.id = e.payment_method_id
       WHERE e.id = $1 AND e.user_id = $2`,
      [entryId, userId],
    );
    return rows[0] ? rowToEntry(rows[0]) : null;
  }

  async createEntry(userId: string, dto: CreateEntryDto): Promise<LedgerEntry> {
    const tagsStr = dto.tags && dto.tags.length > 0 ? dto.tags.join(',') : null;

    const rows = await this.db.query<{ id: string }>(
      `INSERT INTO ledger_entries
         (user_id, date, amount, type, category_id, description, payment_method_id, notes, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id`,
      [
        userId,
        dto.date,
        dto.amount,
        dto.type,
        dto.categoryId ?? null,
        dto.description,
        dto.paymentMethodId ?? null,
        dto.notes ?? null,
        tagsStr,
      ],
    );

    // 생성 후 JOIN 포함 재조회
    return (await this.getEntry(userId, rows[0].id))!;
  }

  async updateEntry(
    userId: string,
    entryId: string,
    dto: UpdateEntryDto,
  ): Promise<LedgerEntry | null> {
    const existing = await this.getEntry(userId, entryId);
    if (!existing) return null;

    const tagsStr =
      dto.tags !== undefined
        ? dto.tags.length > 0
          ? dto.tags.join(',')
          : null
        : existing.tags.length > 0
          ? existing.tags.join(',')
          : null;

    // updated_at을 파라미터로 전달 (PostgreSQL NOW() / SQLite CURRENT_TIMESTAMP 대신)
    const now = new Date().toISOString();

    await this.db.query(
      `UPDATE ledger_entries SET
         date              = $1,
         amount            = $2,
         type              = $3,
         category_id       = $4,
         description       = $5,
         payment_method_id = $6,
         notes             = $7,
         tags              = $8,
         updated_at        = $9
       WHERE id = $10 AND user_id = $11`,
      [
        dto.date ?? existing.date,
        dto.amount ?? existing.amount,
        dto.type ?? existing.type,
        dto.categoryId !== undefined ? dto.categoryId ?? null : existing.categoryId,
        dto.description ?? existing.description,
        dto.paymentMethodId !== undefined ? dto.paymentMethodId ?? null : existing.paymentMethodId,
        dto.notes !== undefined ? dto.notes ?? null : existing.notes,
        tagsStr,
        now,
        entryId,
        userId,
      ],
    );

    return this.getEntry(userId, entryId);
  }

  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      `DELETE FROM ledger_entries WHERE id = $1 AND user_id = $2 RETURNING id`,
      [entryId, userId],
    );
    return rows.length > 0;
  }

  // ── 통계 ──────────────────────────────────────────────────────

  async getSummary(userId: string, year: number, month: number): Promise<LedgerSummary> {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const toYear = month === 12 ? year + 1 : year;
    const toMonth = month === 12 ? 1 : month + 1;
    const to = `${toYear}-${String(toMonth).padStart(2, '0')}-01`;

    // 카테고리별 타입별 합계
    const rows = await this.db.query<SummaryRow>(
      `SELECT
         e.type,
         e.category_id,
         c.name AS category_name,
         SUM(e.amount) AS total,
         COUNT(*)      AS count
       FROM ledger_entries e
       LEFT JOIN ledger_categories c ON c.id = e.category_id
       WHERE e.user_id = $1 AND e.date >= $2 AND e.date < $3
       GROUP BY e.type, e.category_id, c.name`,
      [userId, from, to],
    );

    let totalIncome = 0;
    let totalExpense = 0;
    let entryCount = 0;

    const byCategory: CategoryStat[] = rows.map((row) => {
      const total = Number(row.total);
      const count = Number(row.count);
      if (row.type === 'income') totalIncome += total;
      else totalExpense += total;
      entryCount += count;
      return {
        categoryId: row.category_id,
        categoryName: row.category_name,
        type: row.type as 'income' | 'expense',
        total,
        count,
      };
    });

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      entryCount,
      byCategory,
    };
  }
}
