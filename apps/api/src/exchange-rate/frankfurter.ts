/**
 * Frankfurter 환율 API 클라이언트
 *
 * https://www.frankfurter.app
 * - 무료, API 키 불필요
 * - ECB(유럽중앙은행) 기준 환율 제공
 * - 지원 통화: EUR, USD, KRW, JPY, GBP 등 30여 개
 *
 * 주의: 주말·공휴일에는 가장 최근 영업일 환율을 반환한다.
 */

const BASE_URL = 'https://api.frankfurter.app';

export interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;          // 실제 적용된 날짜 (요청일과 다를 수 있음 — 주말/공휴일)
  rates: Record<string, number>;
}

/**
 * 특정 날짜의 환율 조회.
 * 주말·공휴일이면 Frankfurter가 자동으로 직전 영업일 환율을 반환한다.
 *
 * @param date   YYYY-MM-DD 형식
 * @param base   기준 통화 (예: 'USD')
 * @param target 대상 통화 (예: 'KRW')
 */
export async function fetchRateForDate(
  date: string,
  base: string,
  target: string,
): Promise<FrankfurterResponse> {
  const url = `${BASE_URL}/${date}?from=${base}&to=${target}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Frankfurter API 오류: ${res.status} ${res.statusText} (${url})`);
  }

  return res.json() as Promise<FrankfurterResponse>;
}

/**
 * 최신 환율 조회 (오늘 기준).
 *
 * @param base   기준 통화 (예: 'USD')
 * @param target 대상 통화 (예: 'KRW')
 */
export async function fetchLatestRate(
  base: string,
  target: string,
): Promise<FrankfurterResponse> {
  const url = `${BASE_URL}/latest?from=${base}&to=${target}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Frankfurter API 오류: ${res.status} ${res.statusText} (${url})`);
  }

  return res.json() as Promise<FrankfurterResponse>;
}
