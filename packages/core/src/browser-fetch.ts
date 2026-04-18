/**
 * apiFetch — 인증 토큰 자동 첨부 + 만료 시 자동 갱신
 *
 * Fieldstack 플랫폼의 모든 모듈이 공유하는 인증 fetch 래퍼.
 * Vite 번들 내에서 모듈 싱글턴을 공유하므로 main.tsx에서 등록한
 * setSessionExpiredHandler가 모든 모듈의 apiFetch 호출에 적용된다.
 *
 * 사용법:
 *   import { apiFetch, setSessionExpiredHandler } from '@fieldstack/core/browser';
 */

const SS_TOKEN = 'fs_token';
const SS_REFRESH = 'fs_refresh';

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
