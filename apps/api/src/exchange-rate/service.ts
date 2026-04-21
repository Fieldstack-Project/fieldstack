/**
 * 환율 서비스
 *
 * DB 캐시를 우선 조회하고, 없으면 Frankfurter API에서 가져와 저장한다.
 * 이를 통해 외부 API 호출을 최소화하고 과거 날짜의 환율도 일관되게 유지한다.
 */

import type { DbProvider } from '@fieldstack/core' with { 'resolution-mode': 'import' };

import { fetchLatestRate, fetchRateForDate } from './frankfurter';

export interface ExchangeRate {
  rateDate: string;   // YYYY-MM-DD
  base: string;
  target: string;
  rate: number;
  source: string;
  fetchedAt: string;
}

type RateRow = {
  rate_date: string;
  base: string;
  target: string;
  rate: string;        // NUMERIC은 문자열로 반환될 수 있음
  source: string;
  fetched_at: string;
};

function rowToRate(row: RateRow): ExchangeRate {
  return {
    rateDate: row.rate_date,
    base: row.base,
    target: row.target,
    rate: parseFloat(row.rate),
    source: row.source,
    fetchedAt: row.fetched_at,
  };
}

/**
 * 특정 날짜의 환율을 반환한다.
 * DB에 캐시가 있으면 재사용하고, 없으면 Frankfurter API에서 fetch 후 저장한다.
 *
 * @param db     DB 프로바이더
 * @param date   YYYY-MM-DD (결제일 등)
 * @param base   기준 통화 (예: 'USD')
 * @param target 대상 통화 (예: 'KRW')
 */
export async function getRateForDate(
  db: DbProvider,
  date: string,
  base: string,
  target: string,
): Promise<ExchangeRate> {
  // 1. 캐시 조회
  const cached = await db.query<RateRow>(
    'SELECT * FROM exchange_rates WHERE rate_date = $1 AND base = $2 AND target = $3 LIMIT 1',
    [date, base.toUpperCase(), target.toUpperCase()],
  );

  if (cached.length > 0) {
    return rowToRate(cached[0]);
  }

  // 2. API fetch 후 저장
  const response = await fetchRateForDate(date, base.toUpperCase(), target.toUpperCase());
  const rate = response.rates[target.toUpperCase()];

  if (rate === undefined) {
    throw new Error(`Frankfurter 응답에 ${target} 환율이 없습니다.`);
  }

  // Frankfurter는 주말/공휴일이면 직전 영업일 날짜를 반환하므로 실제 날짜(response.date) 기준으로 저장
  await db.query(
    `INSERT INTO exchange_rates (rate_date, base, target, rate, source)
     VALUES ($1, $2, $3, $4, 'frankfurter')
     ON CONFLICT (rate_date, base, target) DO NOTHING`,
    [response.date, base.toUpperCase(), target.toUpperCase(), rate],
  );

  // 저장 후 다시 조회 (fetched_at 등 DB 기본값 포함)
  const saved = await db.query<RateRow>(
    'SELECT * FROM exchange_rates WHERE rate_date = $1 AND base = $2 AND target = $3 LIMIT 1',
    [response.date, base.toUpperCase(), target.toUpperCase()],
  );

  return rowToRate(saved[0]);
}

/**
 * 오늘 기준 최신 환율을 반환한다.
 * DB에 오늘 데이터가 없으면 API에서 fetch 후 저장한다.
 */
export async function getLatestRate(
  db: DbProvider,
  base: string,
  target: string,
): Promise<ExchangeRate> {
  const today = new Date().toISOString().slice(0, 10);

  // 오늘 캐시 먼저 확인
  const cached = await db.query<RateRow>(
    'SELECT * FROM exchange_rates WHERE rate_date = $1 AND base = $2 AND target = $3 LIMIT 1',
    [today, base.toUpperCase(), target.toUpperCase()],
  );

  if (cached.length > 0) {
    return rowToRate(cached[0]);
  }

  // fetch 후 저장
  const response = await fetchLatestRate(base.toUpperCase(), target.toUpperCase());
  const rate = response.rates[target.toUpperCase()];

  if (rate === undefined) {
    throw new Error(`Frankfurter 응답에 ${target} 환율이 없습니다.`);
  }

  await db.query(
    `INSERT INTO exchange_rates (rate_date, base, target, rate, source)
     VALUES ($1, $2, $3, $4, 'frankfurter')
     ON CONFLICT (rate_date, base, target) DO NOTHING`,
    [response.date, base.toUpperCase(), target.toUpperCase(), rate],
  );

  const saved = await db.query<RateRow>(
    'SELECT * FROM exchange_rates WHERE rate_date = $1 AND base = $2 AND target = $3 LIMIT 1',
    [response.date, base.toUpperCase(), target.toUpperCase()],
  );

  return rowToRate(saved[0]);
}

/**
 * 금액을 특정 날짜의 환율로 변환한다.
 *
 * @param db      DB 프로바이더
 * @param amount  변환할 금액
 * @param from    원본 통화 (예: 'USD')
 * @param to      목표 통화 (예: 'KRW')
 * @param date    YYYY-MM-DD (생략 시 오늘)
 * @returns       { converted: number, rate: number, rateDate: string }
 */
export async function convertAmount(
  db: DbProvider,
  amount: number,
  from: string,
  to: string,
  date?: string,
): Promise<{ converted: number; rate: number; rateDate: string }> {
  // 같은 통화면 변환 불필요
  if (from.toUpperCase() === to.toUpperCase()) {
    const today = new Date().toISOString().slice(0, 10);
    return { converted: amount, rate: 1, rateDate: date ?? today };
  }

  const rateData = date
    ? await getRateForDate(db, date, from, to)
    : await getLatestRate(db, from, to);

  return {
    converted: Math.round(amount * rateData.rate),
    rate: rateData.rate,
    rateDate: rateData.rateDate,
  };
}
