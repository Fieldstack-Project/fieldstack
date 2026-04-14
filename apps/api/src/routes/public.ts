import { Router } from 'express';

import type { SharedLinkService, SharedLinkRenderer } from '@fieldstack/core' with { "resolution-mode": "import" };

// ── 공개 링크 라우터 ──────────────────────────────────────────
// 비인증 접근 — GET /s/:token

export function createPublicRouter(
  sharedLink: SharedLinkService,
  getRenderer: (resourceType: string) => SharedLinkRenderer | undefined,
): Router {
  const router = Router();

  router.get('/:token', async (req, res) => {
    const token = req.params['token']!;
    const password = typeof req.query['password'] === 'string' ? req.query['password'] : undefined;
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';

    const result = await sharedLink.access(token, password, ip, userAgent);

    if (!result.ok) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        REVOKED: 410,
        EXPIRED: 410,
        ACCESS_LIMIT_EXCEEDED: 429,
        PASSWORD_REQUIRED: 401,
        PASSWORD_MISMATCH: 401,
      };
      res.status(statusMap[result.error] ?? 500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    const renderer = getRenderer(result.resourceType);
    if (!renderer) {
      // 모듈 핸들러 미등록 — resourceType과 resourceId만 반환 (모듈 구현 후 교체)
      res.json({
        success: true,
        data: {
          resourceType: result.resourceType,
          resourceId: result.resourceId,
          _note: 'No renderer registered for this resource type',
        },
      });
      return;
    }

    try {
      const data = await renderer(result.resourceId, { ip, userAgent });
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
