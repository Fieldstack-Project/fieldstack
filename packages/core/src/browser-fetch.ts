/**
 * Fieldstack 브라우저 인증 유틸리티
 *
 * apiFetch  — 인증 토큰 자동 첨부 + 만료 시 자동 갱신 (raw Response 반환)
 * apiCall   — apiFetch + Fieldstack JSON 응답({ success, data, error }) 파싱
 * FS_TOKEN, FS_REFRESH — sessionStorage 키 상수
 *
 * 사용법:
 *   import { apiFetch, apiCall, setSessionExpiredHandler } from '@fieldstack/core/browser';
 */

/** sessionStorage 인증 토큰 키 */
export const FS_TOKEN = 'fs_token';
/** sessionStorage 리프레시 토큰 키 */
export const FS_REFRESH = 'fs_refresh';

const SS_TOKEN = FS_TOKEN;
const SS_REFRESH = FS_REFRESH;

type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

/** 로그인 성공 시 호출 — 세션 만료(리프레시 실패) 시 실행할 콜백 등록 */
export function setSessionExpiredHandler(cb: SessionExpiredHandler | null): void {
  sessionExpiredHandler = cb;
}

// 동시 다발 401에 대해 refresh 요청을 한 번만 보내도록 직렬화
let inflightRefresh: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (inflightRefresh) return inflightRefresh;

  inflightRefresh = (async () => {
    const refreshToken = sessionStorage.getItem(SS_REFRESH);
    if (!refreshToken) return null;

    try {
      const res = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      type RefreshResp = {
        success: boolean;
        data?: { accessToken: string; refreshToken: string };
      };
      const json = (await res.json()) as RefreshResp;
      if (!res.ok || !json.success || !json.data) return null;

      sessionStorage.setItem(SS_TOKEN, json.data.accessToken);
      sessionStorage.setItem(SS_REFRESH, json.data.refreshToken);
      return json.data.accessToken;
    } catch {
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

function attachAuth(init: RequestInit, token: string): RequestInit {
  return {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

/**
 * 인증이 필요한 API 요청에 사용하는 fetch 래퍼.
 * - sessionStorage의 fs_token을 Authorization 헤더에 자동 첨부한다.
 * - 401 응답 시 fs_refresh로 토큰을 갱신한 뒤 원본 요청을 한 번 재시도한다.
 * - 갱신도 실패하면 setSessionExpiredHandler()로 등록된 콜백을 호출하고
 *   원래 401 Response를 그대로 반환한다.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem(SS_TOKEN) ?? '';
  const res = await fetch(input, attachAuth(init, token));

  if (res.status !== 401) return res;

  const newToken = await tryRefresh();
  if (!newToken) {
    sessionExpiredHandler?.();
    return res;
  }

  return fetch(input, attachAuth(init, newToken));
}

/**
 * Fieldstack JSON API 호출 유틸리티.
 *
 * apiFetch 위에서 동작하며 Fieldstack 표준 응답 형식을 자동으로 파싱한다:
 *   { success: boolean; data?: T; error?: string }
 *
 * - Content-Type: application/json 헤더 자동 첨부
 * - 빈 응답(204 No Content 등)은 undefined로 반환
 * - success: false 시 error 메시지로 Error를 throw
 *
 * 모듈 api.ts에서 사용하는 표준 패턴:
 *   import { apiCall } from '@fieldstack/core/browser';
 *   const data = await apiCall<MyType>('/api/my-module/items');
 */
export async function apiCall<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  if (!text) return undefined as T;
  const json = JSON.parse(text) as { success: boolean; data?: T; error?: unknown };
  if (!json.success) throw new Error(String(json.error ?? 'API error'));
  return json.data as T;
}
