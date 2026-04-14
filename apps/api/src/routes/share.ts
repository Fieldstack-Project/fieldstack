import { Router } from 'express';
import { z } from 'zod';

import type {
  JwtSessionManagerImpl,
  SharedLinkService,
  SystemSettingsService,
} from '@fieldstack/core' with { "resolution-mode": "import" };

import { requireAuth } from '../middleware/require-auth';

// ── Zod 스키마 ────────────────────────────────────────────────

const IssueBody = z.object({
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  password: z.string().min(1).optional(),
  maxAccessCount: z.number().int().positive().optional(),
});

// ── 라우터 팩토리 ──────────────────────────────────────────────

export interface ShareRouterDeps {
  sharedLink: SharedLinkService;
  settings: SystemSettingsService;
  jwtManager: JwtSessionManagerImpl;
}

export function createShareRouter(deps: ShareRouterDeps): Router {
  const router = Router();
  const { sharedLink, settings, jwtManager } = deps;
  const auth = requireAuth(jwtManager);

  // POST /core/share — 링크 발행
  router.post('/', auth, async (req, res) => {
    const parsed = IssueBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      const result = await sharedLink.issue({
        ...parsed.data,
        createdBy: req.auth!.userId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      const code = (err as { code?: string }).code;
      const status = code === 'FEATURE_DISABLED' || code === 'DOMAIN_REQUIRED' ? 403 : 500;
      res.status(status).json({ success: false, error: (err as Error).message, code });
    }
  });

  // GET /core/share — 내가 발행한 링크 목록
  router.get('/', auth, async (req, res) => {
    try {
      const links = await sharedLink.listByUser(req.auth!.userId);
      res.json({ success: true, data: links });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // DELETE /core/share/:token — 링크 무효화
  router.delete('/:token', auth, async (req, res) => {
    try {
      // TODO(Phase 2): isAdmin 플래그는 JWT payload에 역할 추가 후 사용
      const token = Array.isArray(req.params['token']) ? req.params['token'][0]! : req.params['token']!;
      await sharedLink.revoke(token, req.auth!.userId, false);
      res.json({ success: true, data: { revoked: true } });
    } catch (err) {
      const msg = (err as Error).message;
      const status = msg === 'Link not found' ? 404 : msg === 'Forbidden' ? 403 : 500;
      res.status(status).json({ success: false, error: msg });
    }
  });

  // GET /core/share/settings — 공유 링크 기능 상태 조회 (관리자용)
  router.get('/settings', auth, async (req, res) => {
    const enabled = await settings.getBoolean('shared_links_enabled', true);
    res.json({
      success: true,
      data: {
        enabled,
        domainConfigured: sharedLink.isAvailable(),
      },
    });
  });

  // PATCH /core/share/settings — 공유 링크 on/off 토글 (관리자용)
  router.patch('/settings', auth, async (req, res) => {
    const parsed = z.object({ enabled: z.boolean() }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }
    await settings.setBoolean('shared_links_enabled', parsed.data.enabled);
    res.json({ success: true, data: { enabled: parsed.data.enabled } });
  });

  return router;
}
