/**
 * 구독 데이터 가져오기 — CSV / XLSX / XLS 파싱
 *
 * 지원 포맷:
 *   - .csv (UTF-8 BOM, EUC-KR 자동 감지)
 *   - .xlsx / .xls (SheetJS)
 *
 * 컬럼 헤더는 한국어·영어 모두 인식.
 */

import * as XLSX from 'xlsx';

export type BillingCycle = 'monthly' | 'yearly';
export type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'GBP';

export interface ImportRow {
  serviceName: string;
  currentAmount: number;
  currency: Currency;
  billingCycle: BillingCycle;
  billingDay: number;
  startedAt?: string;
  category?: string;
  url?: string;
}

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportResult {
  rows: ImportRow[];
  errors: ImportError[];
}

// ── 헤더 매핑 ──────────────────────────────────────────────────

const FIELD_ALIASES: Record<keyof ImportRow, string[]> = {
  serviceName:    ['서비스명', '서비스', 'servicename', 'service', 'name'],
  currentAmount:  ['금액', '가격', 'amount', 'price', 'currentamount'],
  currency:       ['통화', 'currency'],
  billingCycle:   ['결제주기', '주기', 'billingcycle', 'cycle'],
  billingDay:     ['결제일', '결제 일', 'billingday', 'day'],
  startedAt:      ['구독시작일', '시작일', 'startedat', 'started', 'start'],
  category:       ['카테고리', 'category'],
  url:            ['url', 'URL', '주소'],
};

function findCol(headers: string[], field: keyof ImportRow): string | undefined {
  const aliases = FIELD_ALIASES[field];
  const lower = headers.map((h) => h.trim().toLowerCase().replace(/\s/g, ''));
  for (const alias of aliases) {
    const idx = lower.indexOf(alias.toLowerCase().replace(/\s/g, ''));
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

// ── 값 파싱 ────────────────────────────────────────────────────

function normalizeCurrency(raw: string): Currency {
  const v = raw.trim().toUpperCase();
  const valid: Currency[] = ['KRW', 'USD', 'EUR', 'JPY', 'GBP'];
  return valid.includes(v as Currency) ? (v as Currency) : 'KRW';
}

function normalizeCycle(raw: string): BillingCycle {
  const v = raw.trim().toLowerCase();
  if (v === 'yearly' || v === '연간' || v === 'annual') return 'yearly';
  return 'monthly';
}

function parseAmount(raw: string | number): number | null {
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  const s = String(raw).trim().replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseDay(raw: string | number): number | null {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw).trim());
  if (isNaN(n) || n < 1 || n > 31) return null;
  return n;
}

function parseDate(raw: string | number | undefined): string | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const s = String(raw).trim().slice(0, 10).replace(/[./]/g, '-');
  const compact = String(raw).trim().replace(/\D/g, '').slice(0, 8);
  if (compact.length === 8) {
    return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return undefined;
}

// ── CSV 디코딩 ─────────────────────────────────────────────────

function decodeBuffer(buf: Buffer): string {
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.slice(3).toString('utf-8');
  }
  const asUtf8 = buf.toString('utf-8');
  if (!asUtf8.includes('�')) return asUtf8;
  try {
    const decoder = new TextDecoder('euc-kr', { fatal: true });
    return decoder.decode(buf);
  } catch {
    return asUtf8;
  }
}

// ── 메인 파서 ─────────────────────────────────────────────────

export function parseSubscriptionFile(buf: Buffer, ext: string): ImportResult {
  let rows: Record<string, unknown>[];

  if (ext === 'csv') {
    const text = decodeBuffer(buf);
    const wb = XLSX.read(text, { type: 'string' });
    const ws = wb.Sheets[wb.SheetNames[0]!]!;
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  } else {
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]!]!;
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  }

  if (rows.length === 0) return { rows: [], errors: [] };

  const headers = Object.keys(rows[0]!);
  const colMap: Partial<Record<keyof ImportRow, string>> = {};
  for (const field of Object.keys(FIELD_ALIASES) as (keyof ImportRow)[]) {
    const found = findCol(headers, field);
    if (found) colMap[field] = found;
  }

  const result: ImportResult = { rows: [], errors: [] };

  rows.forEach((raw, idx) => {
    const rowNum = idx + 2; // 헤더 행은 1행

    const nameRaw = String(raw[colMap.serviceName ?? ''] ?? '').trim();
    if (!nameRaw) {
      result.errors.push({ row: rowNum, message: '서비스명이 비어 있습니다.' });
      return;
    }

    const amountRaw = raw[colMap.currentAmount ?? ''];
    const amount = parseAmount(amountRaw as string | number);
    if (amount === null || amount < 0) {
      result.errors.push({ row: rowNum, message: `금액 파싱 실패: "${amountRaw}"` });
      return;
    }

    const dayRaw = raw[colMap.billingDay ?? ''];
    const day = colMap.billingDay ? parseDay(dayRaw as string | number) : 1;
    if (day === null) {
      result.errors.push({ row: rowNum, message: `결제일 파싱 실패: "${dayRaw}"` });
      return;
    }

    const currency = colMap.currency
      ? normalizeCurrency(String(raw[colMap.currency] ?? 'KRW'))
      : 'KRW';

    const cycle = colMap.billingCycle
      ? normalizeCycle(String(raw[colMap.billingCycle] ?? 'monthly'))
      : 'monthly';

    const startedAt = parseDate(
      colMap.startedAt ? (raw[colMap.startedAt] as string | undefined) : undefined,
    );

    const category = colMap.category
      ? String(raw[colMap.category] ?? '').trim() || undefined
      : undefined;

    const rawUrl = colMap.url ? String(raw[colMap.url] ?? '').trim() : '';
    const url = rawUrl.match(/^https?:\/\//) ? rawUrl : undefined;

    result.rows.push({
      serviceName: nameRaw,
      currentAmount: amount,
      currency,
      billingCycle: cycle,
      billingDay: day,
      startedAt,
      category,
      url,
    });
  });

  return result;
}
