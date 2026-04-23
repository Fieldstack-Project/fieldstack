import type { RouteKey } from "./components/AppShell";
import { MODULE_ROUTES } from "./moduleRegistry";

// 코어 라우트 목록 (앱 shell 없이 전체 화면으로 렌더되는 것 제외)
export const CORE_ROUTES = [
  "login",
  "forgot-password",
  "home",
  "marketplace",
  "admin",
  "change-password",
] as const;

const AUTHENTICATED_APP_ROUTES = ["home", "marketplace", "admin"] as const;

// 인증 후 접근 가능한 모든 앱 라우트(코어 + 모듈)의 단일 소스.
// 로그인 전 딥링크 저장/복귀 여부 판단에서 재사용한다.
export const APP_ROUTES: string[] = [...AUTHENTICATED_APP_ROUTES, ...MODULE_ROUTES];

// "#ledger/import" 같은 해시에서 베이스 라우트("ledger")만 추출한다.
function getBaseHashRoute(rawHash: string): string {
  const hash = rawHash.replace("#", "");
  return hash.split("/")[0] ?? hash;
}

/** 해시에서 베이스 라우트만 추출 ("ledger/import" → "ledger") */
export function getRouteFromHash(rawHash: string): RouteKey {
  const base = getBaseHashRoute(rawHash);
  if (base === "settings") return "home";
  if ((CORE_ROUTES as readonly string[]).includes(base)) return base as RouteKey;
  if (MODULE_ROUTES.includes(base)) return base as RouteKey;
  return "login";
}

/** 해시에서 서브 라우트만 추출 ("ledger/import" → "import", "ledger" → "") */
export function getSubRouteFromHash(rawHash: string): string {
  const hash = rawHash.replace("#", "");
  const parts = hash.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : "";
}

// 딥 링크: 비인증 상태에서 진입한 app route 반환 (모듈 라우트 포함)
export function getDeepLinkTarget(rawHash: string): RouteKey | null {
  const base = getBaseHashRoute(rawHash);
  return APP_ROUTES.includes(base) ? (base as RouteKey) : null;
}

// 비인증 상태에서 redirectAfterLogin으로 보관 가능한 라우트인지 판별.
export function canStoreRedirectTarget(route: RouteKey): boolean {
  return APP_ROUTES.includes(route);
}
