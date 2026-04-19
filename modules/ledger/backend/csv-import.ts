/**
 * CSV 가져오기 — 파서, 인코딩 감지, 포맷 자동 감지, 중복 판정
 *
 * 외부 패키지 없이 Node.js 기본 API만 사용.
 * - UTF-8 BOM 처리
 * - EUC-KR → UTF-8 변환 (TextDecoder)
 * - 국내 주요 은행·카드사 CSV 포맷 자동 감지
 */

import type { EntryType, ImportMapping, ImportPreviewRow } from '../types/index.js';

// ── CSV 기본 파서 ─────────────────────────────────────────────

/**
 * RFC 4180 준수 CSV 파서 (따옴표 내 쉼표·줄바꿈 처리)
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i]!;

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
        i++;
      } else if (ch === '\r') {
        // CRLF or CR
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
        if (text[i + 1] === '\n') i++;
        i++;
      } else if (ch === '\n') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // 마지막 행
  if (field || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  // 빈 마지막 행 제거
  if (rows.length > 0) {
    const last = rows[rows.length - 1]!;
    if (last.length === 1 && last[0] === '') rows.pop();
  }

  return rows;
}

// ── 인코딩 감지 및 디코딩 ──────────────────────────────────────

/**
 * Buffer를 문자열로 변환 (UTF-8 BOM / EUC-KR 자동 감지)
 */
export function decodeBuffer(buf: Buffer): string {
  // UTF-8 BOM (EF BB BF)
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.slice(3).toString('utf-8');
  }

  // UTF-8 유효성 검사
  const asUtf8 = buf.toString('utf-8');
  if (!asUtf8.includes('\uFFFD')) {
    return asUtf8;
  }

  // EUC-KR 시도
  try {
    const decoder = new TextDecoder('euc-kr', { fatal: true });
    return decoder.decode(buf);
  } catch {
    // fallback
    return asUtf8;
  }
}

// ── 포맷 자동 감지 ─────────────────────────────────────────────

interface FormatDetection {
  mapping: ImportMapping;
  confidence: number;
}

/**
 * 헤더 행을 분석해 국내 은행/카드사 포맷을 자동 감지.
 * confidence 0~1 (1 = 완벽 일치)
 */
export function detectFormat(headers: string[]): ImportMapping {
  const hs = headers.map((h) => h.trim());

  const detections: FormatDetection[] = [
    detectKbBank(hs),
    detectShinhanBank(hs),
    detectHanaBank(hs),
    detectWooriBank(hs),
    detectShinhanCard(hs),
    detectKbCard(hs),
    detectGeneric(hs),
  ];

  detections.sort((a, b) => b.confidence - a.confidence);
  return detections[0]!.mapping;
}

function col(headers: string[], candidates: string[]): string | undefined {
  for (const c of candidates) {
    const found = headers.find((h) => h.includes(c));
    if (found) return found;
  }
  return undefined;
}

function detectKbBank(hs: string[]): FormatDetection {
  // KB국민은행: 거래일자, 거래시간, 입금금액, 출금금액, 거래내용, 잔액
  const dateCol = col(hs, ['거래일자', '날짜']);
  const inCol = col(hs, ['입금금액', '입금']);
  const outCol = col(hs, ['출금금액', '출금']);
  const descCol = col(hs, ['거래내용', '적요', '내용']);
  const score = [dateCol, inCol, outCol, descCol].filter(Boolean).length;
  if (!dateCol || (!inCol && !outCol)) return { mapping: detectGeneric(hs).mapping, confidence: 0 };
  const mapping: ImportMapping = {
    dateCol: dateCol,
    amountCol: inCol ?? outCol ?? '',
    amountSignDeterminesType: false,
    descriptionCol: descCol,
  };
  if (inCol && outCol) {
    // 별도 처리 필요 — 여기서는 기본 감지만 제공
    mapping.amountCol = inCol;
  }
  return { mapping, confidence: score / 4 };
}

function detectShinhanBank(hs: string[]): FormatDetection {
  const dateCol = col(hs, ['거래일', '거래일자']);
  const amtCol = col(hs, ['거래금액', '금액']);
  const typeCol = col(hs, ['입출구분', '거래구분', '구분']);
  const descCol = col(hs, ['적요', '거래내용', '내용']);
  const score = [dateCol, amtCol, typeCol, descCol].filter(Boolean).length;
  if (!dateCol || !amtCol) return { mapping: detectGeneric(hs).mapping, confidence: 0 };
  const mapping: ImportMapping = {
    dateCol: dateCol!,
    amountCol: amtCol!,
    typeCol,
    incomeValues: ['입금', '수입', 'CR'],
    descriptionCol: descCol,
  };
  return { mapping, confidence: score / 4 };
}

function detectHanaBank(hs: string[]): FormatDetection {
  const dateCol = col(hs, ['거래일시', '날짜']);
  const amtCol = col(hs, ['거래금액', '금액']);
  const descCol = col(hs, ['적요', '내용']);
  const score = [dateCol, amtCol, descCol].filter(Boolean).length;
  if (!dateCol || !amtCol) return { mapping: detectGeneric(hs).mapping, confidence: 0 };
  const mapping: ImportMapping = {
    dateCol: dateCol!,
    amountCol: amtCol!,
    amountSignDeterminesType: true,
    descriptionCol: descCol,
  };
  return { mapping, confidence: score / 3 };
}

function detectWooriBank(hs: string[]): FormatDetection {
  const dateCol = col(hs, ['거래일', '일자']);
  const inCol = col(hs, ['입금액', '입금']);
  const outCol = col(hs, ['출금액', '출금']);
  const descCol = col(hs, ['거래내역', '적요', '내용']);
  const score = [dateCol, inCol || outCol, descCol].filter(Boolean).length;
  if (!dateCol) return { mapping: detectGeneric(hs).mapping, confidence: 0 };
  const mapping: ImportMapping = {
    dateCol: dateCol!,
    amountCol: inCol ?? outCol ?? '',
    descriptionCol: descCol,
  };
  return { mapping, confidence: score / 3 };
}

function detectShinhanCard(hs: string[]): FormatDetection {
  const dateCol = col(hs, ['이용일', '거래일', '승인일']);
  const amtCol = col(hs, ['이용금액', '승인금액', '금액']);
  const descCol = col(hs, ['가맹점명', '상호명', '이용처']);
  const score = [dateCol, amtCol, descCol].filter(Boolean).length;
  if (!dateCol || !amtCol) return { mapping: detectGeneric(hs).mapping, confidence: 0 };
  const mapping: ImportMapping = {
    dateCol: dateCol!,
    amountCol: amtCol!,
    fixedType: 'expense',
    descriptionCol: descCol,
  };
  return { mapping, confidence: score / 3 };
}

function detectKbCard(hs: string[]): FormatDetection {
  const dateCol = col(hs, ['이용일자', '승인일자', '거래일']);
  const amtCol = col(hs, ['이용금액', '국내이용금액', '금액']);
  const descCol = col(hs, ['가맹점', '상호', '이용처']);
  const score = [dateCol, amtCol, descCol].filter(Boolean).length;
  if (!dateCol || !amtCol) return { mapping: detectGeneric(hs).mapping, confidence: 0 };
  const mapping: ImportMapping = {
    dateCol: dateCol!,
    amountCol: amtCol!,
    fixedType: 'expense',
    descriptionCol: descCol,
  };
  return { mapping, confidence: score / 3 };
}

function detectGeneric(hs: string[]): FormatDetection {
  const dateCol =
    col(hs, ['date', '날짜', '일자', '거래일']) ?? hs[0] ?? '';
  const amtCol =
    col(hs, ['amount', '금액', '거래금액', '이용금액']) ??
    hs.find((h) => /금액|amount/i.test(h)) ??
    hs[1] ??
    '';
  const descCol = col(hs, ['description', '내용', '적요', '설명', '메모']);
  const mapping: ImportMapping = {
    dateCol,
    amountCol: amtCol,
    amountSignDeterminesType: true,
    descriptionCol: descCol,
  };
  return { mapping, confidence: 0.1 };
}

// ── 날짜 파싱 ─────────────────────────────────────────────────

/**
 * 다양한 날짜 형식 → YYYY-MM-DD
 * - 2026.04.19, 2026/04/19, 20260419, 2026-04-19
 * - 날짜+시간: 2026.04.19 13:21:00 → 앞 10자만 사용
 */
export function parseDate(raw: string): string | null {
  const s = raw.trim().slice(0, 10).replace(/[./]/g, '-');
  // 숫자만 8자리: YYYYMMDD
  const compact = raw.trim().replace(/\D/g, '').slice(0, 8);
  if (compact.length === 8) {
    return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

// ── 금액 파싱 ─────────────────────────────────────────────────

/**
 * "1,234,567" / "1234567" / "-500" → 숫자
 */
export function parseAmount(raw: string): number | null {
  const s = raw.trim().replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ── 수입/지출 판정 ─────────────────────────────────────────────

export function determineType(
  mapping: ImportMapping,
  row: Record<string, string>,
  amount: number,
): EntryType {
  if (mapping.amountSignDeterminesType) {
    return amount >= 0 ? 'income' : 'expense';
  }
  if (mapping.fixedType) return mapping.fixedType;
  if (mapping.typeCol && mapping.incomeValues) {
    const val = (row[mapping.typeCol] ?? '').trim();
    return mapping.incomeValues.some((v) => val.includes(v)) ? 'income' : 'expense';
  }
  return 'expense';
}

// ── 미리보기 빌드 ─────────────────────────────────────────────

export interface ExistingEntry {
  date: string;
  amount: number;
  description: string;
}

/**
 * 파싱된 CSV rows → ImportPreviewRow[]
 */
export function buildPreviewRows(
  dataRows: string[][],
  headers: string[],
  mapping: ImportMapping,
  existingEntries: ExistingEntry[],
): ImportPreviewRow[] {
  const existingSet = new Set(
    existingEntries.map((e) => `${e.date}|${Math.abs(e.amount)}|${e.description}`),
  );

  return dataRows.map((cols, idx) => {
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => {
      raw[h] = cols[i] ?? '';
    });

    const mapped: ImportPreviewRow['mapped'] = {};
    let parseError: string | undefined;

    // 날짜
    const rawDate = raw[mapping.dateCol] ?? '';
    const date = parseDate(rawDate);
    if (date) mapped.date = date;
    else parseError = `날짜 파싱 실패: "${rawDate}"`;

    // 금액
    const rawAmt = raw[mapping.amountCol] ?? '';
    const rawNum = parseAmount(rawAmt);
    if (rawNum !== null) {
      mapped.amount = Math.abs(rawNum);
      mapped.type = determineType(mapping, raw, rawNum);
    } else {
      parseError = parseError ?? `금액 파싱 실패: "${rawAmt}"`;
    }

    // 설명
    if (mapping.descriptionCol) mapped.description = raw[mapping.descriptionCol] ?? '';
    if (mapping.categoryCol) mapped.categoryName = raw[mapping.categoryCol] ?? '';
    if (mapping.paymentMethodCol) mapped.paymentMethodName = raw[mapping.paymentMethodCol] ?? '';
    if (mapping.notesCol) mapped.notes = raw[mapping.notesCol] ?? '';

    // 중복 체크
    const dupKey = `${mapped.date}|${mapped.amount}|${mapped.description ?? ''}`;
    const duplicate = !parseError && existingSet.has(dupKey);

    return {
      rowIndex: idx,
      raw,
      mapped,
      duplicate,
      parseError,
    };
  });
}
