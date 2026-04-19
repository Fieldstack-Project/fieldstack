import fs from 'fs';
import path from 'path';

import type { DbProvider } from '@fieldstack/core';

import {
  buildPreviewRows,
  decodeBuffer,
  detectFormat,
  parseCsv,
} from './csv-import.js';
import type {
  CategoryStat,
  CreateCategoryDto,
  CreateEntryDto,
  CreatePaymentMethodDto,
  ImportCommitResult,
  ImportMapping,
  ImportPreviewResult,
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
  budget_limit: string | number | null;
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
  // pg 드라이버는 DATE 컬럼을 JS Date 객체로 파싱함, SQLite는 문자열로 반환
  date: string | Date;
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
  receipt_path: string | null;
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

/**
 * pg 드라이버가 DATE 컬럼을 JS Date 객체로 자동 변환하는 경우를 정규화한다.
 * UTC 기준 toISOString()을 쓰면 한국 자정(KST)이 전날 UTC로 밀릴 수 있으므로
 * 로컬 연·월·일을 직접 조합해 YYYY-MM-DD 문자열로 반환한다.
 */
function normalizeDate(val: string | Date): string {
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // SQLite는 'YYYY-MM-DD' 문자열로 반환하지만 뒤에 시각이 붙을 수 있으므로 앞 10자만 사용
  return String(val).slice(0, 10);
}

function rowToEntry(row: EntryRow): LedgerEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: normalizeDate(row.date),
    amount: Number(row.amount),
    type: row.type as 'income' | 'expense',
    categoryId: row.category_id,
    categoryName: row.category_name,
    description: row.description,
    paymentMethodId: row.payment_method_id,
    paymentMethodName: row.payment_method_name,
    notes: row.notes,
    tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
    receiptPath: row.receipt_path ?? null,
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
    budgetLimit: row.budget_limit != null ? Number(row.budget_limit) : null,
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
      `INSERT INTO ledger_categories (user_id, name, type, color, icon, budget_limit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, dto.name, dto.type, dto.color ?? null, dto.icon ?? null, dto.budgetLimit ?? null],
    );
    return rowToCategory(rows[0]);
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    dto: Partial<CreateCategoryDto>,
  ): Promise<LedgerCategory | null> {
    const existing = await this.db.query<CategoryRow>(
      `SELECT * FROM ledger_categories WHERE id = $1 AND user_id = $2`,
      [categoryId, userId],
    );
    if (!existing[0]) return null;

    const row = await this.db.query<CategoryRow>(
      `UPDATE ledger_categories
       SET name         = $1,
           type         = $2,
           color        = $3,
           icon         = $4,
           budget_limit = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        dto.name  ?? existing[0].name,
        dto.type  ?? existing[0].type,
        dto.color !== undefined ? dto.color ?? null : existing[0].color,
        dto.icon  !== undefined ? dto.icon  ?? null : existing[0].icon,
        dto.budgetLimit !== undefined ? dto.budgetLimit ?? null : existing[0].budget_limit,
        categoryId,
        userId,
      ],
    );
    return rowToCategory(row[0]);
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

  async updatePaymentMethod(
    userId: string,
    methodId: string,
    dto: Partial<CreatePaymentMethodDto>,
  ): Promise<LedgerPaymentMethod | null> {
    const existing = await this.db.query<PaymentMethodRow>(
      `SELECT * FROM ledger_payment_methods WHERE id = $1 AND user_id = $2`,
      [methodId, userId],
    );
    if (!existing[0]) return null;

    const row = await this.db.query<PaymentMethodRow>(
      `UPDATE ledger_payment_methods
       SET name = $1,
           type = $2
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [
        dto.name ?? existing[0].name,
        dto.type ?? existing[0].type,
        methodId,
        userId,
      ],
    );
    return rowToPaymentMethod(row[0]);
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

  async exportEntriesCsv(
    userId: string,
    opts: {
      year?: number;
      month?: number;
      type?: 'income' | 'expense';
      categoryId?: string;
    },
  ): Promise<string> {
    const conditions: string[] = ['e.user_id = $1'];
    const params: unknown[] = [userId];
    let idx = 2;

    if (opts.year !== undefined && opts.month !== undefined) {
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
    }

    const where = conditions.join(' AND ');
    const rows = await this.db.query<EntryRow>(
      `SELECT
         e.*,
         c.name  AS category_name,
         pm.name AS payment_method_name
       FROM ledger_entries e
       LEFT JOIN ledger_categories      c  ON c.id  = e.category_id
       LEFT JOIN ledger_payment_methods pm ON pm.id = e.payment_method_id
       WHERE ${where}
       ORDER BY e.date DESC, e.created_at DESC`,
      params,
    );

    const entries = rows.map(rowToEntry);

    // CSV 헤더
    const header = ['날짜', '유형', '금액', '카테고리', '내용', '결제수단', '메모', '태그'].join(',');

    const escapeCell = (val: string | null | undefined): string => {
      if (val == null) return '';
      // 쉼표·큰따옴표·줄바꿈이 있으면 큰따옴표로 감싸기
      if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
      return val;
    };

    const lines = entries.map((e) =>
      [
        escapeCell(e.date),
        escapeCell(e.type === 'income' ? '수입' : '지출'),
        String(e.amount),
        escapeCell(e.categoryName),
        escapeCell(e.description),
        escapeCell(e.paymentMethodName),
        escapeCell(e.notes),
        escapeCell(e.tags.join('|')),
      ].join(','),
    );

    return [header, ...lines].join('\r\n');
  }

  // ── CSV 가져오기 ──────────────────────────────────────────────

  /**
   * CSV 파일(Buffer)을 파싱해 미리보기 결과를 반환한다.
   * mapping은 자동 감지하며 클라이언트가 덮어쓸 수 있다.
   */
  async importPreview(
    userId: string,
    fileBuffer: Buffer,
    overrideMapping?: ImportMapping,
  ): Promise<ImportPreviewResult> {
    const text = decodeBuffer(fileBuffer);
    const allRows = parseCsv(text);
    if (allRows.length < 2) {
      return {
        headers: [],
        rows: [],
        detectedMapping: { dateCol: '', amountCol: '' },
        totalRows: 0,
        duplicateCount: 0,
        errorCount: 0,
      };
    }

    const headers = allRows[0]!;
    const dataRows = allRows.slice(1);
    const mapping = overrideMapping ?? detectFormat(headers);

    // 현재 사용자의 항목으로 중복 판정
    const existing = await this.db.query<{ date: string | Date; amount: string | number; description: string }>(
      `SELECT date, amount, description FROM ledger_entries WHERE user_id = $1`,
      [userId],
    );
    const existingNormalized = existing.map((r) => ({
      date: normalizeDate(r.date),
      amount: Number(r.amount),
      description: r.description,
    }));

    const rows = buildPreviewRows(dataRows, headers, mapping, existingNormalized);
    const duplicateCount = rows.filter((r) => r.duplicate).length;
    const errorCount = rows.filter((r) => r.parseError).length;

    return {
      headers,
      rows,
      detectedMapping: mapping,
      totalRows: dataRows.length,
      duplicateCount,
      errorCount,
    };
  }

  /**
   * 미리보기에서 확정된 mapping으로 항목을 일괄 삽입한다.
   */
  async importCommit(
    userId: string,
    fileBuffer: Buffer,
    mapping: ImportMapping,
    skipDuplicates: boolean,
  ): Promise<ImportCommitResult> {
    const preview = await this.importPreview(userId, fileBuffer, mapping);
    let inserted = 0;
    let skippedDuplicates = 0;
    let errors = 0;

    for (const row of preview.rows) {
      if (row.parseError) {
        errors++;
        continue;
      }
      if (row.duplicate && skipDuplicates) {
        skippedDuplicates++;
        continue;
      }
      const m = row.mapped;
      if (!m.date || m.amount === undefined || !m.type) {
        errors++;
        continue;
      }

      try {
        // 카테고리 이름으로 ID 조회 (없으면 null)
        let categoryId: string | null = null;
        if (m.categoryName) {
          const cats = await this.db.query<{ id: string }>(
            `SELECT id FROM ledger_categories WHERE user_id = $1 AND name = $2 LIMIT 1`,
            [userId, m.categoryName],
          );
          categoryId = cats[0]?.id ?? null;
        }

        // 결제 수단 이름으로 ID 조회
        let paymentMethodId: string | null = null;
        if (m.paymentMethodName) {
          const pms = await this.db.query<{ id: string }>(
            `SELECT id FROM ledger_payment_methods WHERE user_id = $1 AND name = $2 LIMIT 1`,
            [userId, m.paymentMethodName],
          );
          paymentMethodId = pms[0]?.id ?? null;
        }

        await this.db.query(
          `INSERT INTO ledger_entries
             (user_id, date, amount, type, category_id, description, payment_method_id, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            userId,
            m.date,
            m.amount,
            m.type,
            categoryId,
            m.description ?? '',
            paymentMethodId,
            m.notes ?? null,
          ],
        );
        inserted++;
      } catch {
        errors++;
      }
    }

    return { inserted, skippedDuplicates, errors };
  }

  // ── 영수증 첨부 ──────────────────────────────────────────────

  private receiptDir(): string {
    // API 프로세스 CWD 기준 data/ledger/receipts
    const dir = path.resolve(process.cwd(), 'data', 'ledger', 'receipts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  async uploadReceipt(
    userId: string,
    entryId: string,
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<LedgerEntry | null> {
    const entry = await this.getEntry(userId, entryId);
    if (!entry) return null;

    // 기존 파일 삭제
    if (entry.receiptPath) {
      const oldPath = path.resolve(process.cwd(), entry.receiptPath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const dir = this.receiptDir();
    const ext = path.extname(originalName).toLowerCase() || '.bin';
    const filename = `${entryId}${ext}`;
    const fullPath = path.join(dir, filename);
    fs.writeFileSync(fullPath, fileBuffer);

    // DB에 상대 경로 저장
    const relativePath = path.join('data', 'ledger', 'receipts', filename);
    const now = new Date().toISOString();
    await this.db.query(
      `UPDATE ledger_entries SET receipt_path = $1, updated_at = $2 WHERE id = $3 AND user_id = $4`,
      [relativePath, now, entryId, userId],
    );

    return this.getEntry(userId, entryId);
  }

  async deleteReceipt(userId: string, entryId: string): Promise<LedgerEntry | null> {
    const entry = await this.getEntry(userId, entryId);
    if (!entry) return null;
    if (!entry.receiptPath) return entry;

    const fullPath = path.resolve(process.cwd(), entry.receiptPath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    const now = new Date().toISOString();
    await this.db.query(
      `UPDATE ledger_entries SET receipt_path = NULL, updated_at = $1 WHERE id = $2 AND user_id = $3`,
      [now, entryId, userId],
    );

    return this.getEntry(userId, entryId);
  }

  /** 영수증 파일의 절대 경로 반환 (없으면 null) */
  async getReceiptFilePath(userId: string, entryId: string): Promise<string | null> {
    const entry = await this.getEntry(userId, entryId);
    if (!entry?.receiptPath) return null;
    const fullPath = path.resolve(process.cwd(), entry.receiptPath);
    return fs.existsSync(fullPath) ? fullPath : null;
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
