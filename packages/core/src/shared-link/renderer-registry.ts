// ── Renderer Registry ─────────────────────────────────────────
// 각 모듈이 자신의 resourceType에 대한 렌더 핸들러를 등록한다.
// GET /s/:token 요청 시 코어가 해당 핸들러를 호출해 데이터를 반환한다.

export type SharedLinkRenderContext = {
  ip: string;
  userAgent: string;
};

export type SharedLinkRenderer = (
  resourceId: string,
  ctx: SharedLinkRenderContext,
) => Promise<unknown>;

const registry = new Map<string, SharedLinkRenderer>();

export function registerSharedLinkRenderer(
  resourceType: string,
  renderer: SharedLinkRenderer,
): void {
  registry.set(resourceType, renderer);
}

export function getSharedLinkRenderer(resourceType: string): SharedLinkRenderer | undefined {
  return registry.get(resourceType);
}
