import { Router } from 'express';

import type { SubscriptionService } from './service.js';
import {
  createNoteSchema,
  createPriceHistorySchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from './validation.js';

type JwtManager = {
  verifyAccessToken(token: string): Promise<{ userId: string; email: string }>;
};

// ── 인증 미들웨어 (Ledger 패턴 동일) ─────────────────────────────

function makeAuth(jwtManager: JwtManager) {
  return async (
    req: Parameters<Router['use']>[0] extends (...args: infer A) => unknown ? A[0] : never,
    res: Parameters<Router['use']>[0] extends (...args: infer A) => unknown ? A[1] : never,
    next: Parameters<Router['use']>[0] extends (...args: infer A) => unknown ? A[2] : never,
  ): Promise<void> => {
    const header = (req as { headers: Record<string, string | undefined> }).headers['authorization'];
    if (!header?.startsWith('Bearer ')) {
      (res as { status: (n: number) => { json: (b: unknown) => void } })
        .status(401)
        .json({ success: false, error: 'Unauthorized' });
      return;
    }
    try {
      const token = header.slice(7);
      const payload = await jwtManager.verifyAccessToken(token);
      (req as Record<string, unknown>)['userId'] = payload.userId;
      (next as () => void)();
    } catch {
      (res as { status: (n: number) => { json: (b: unknown) => void } })
        .status(401)
        .json({ success: false, error: 'Unauthorized' });
    }
  };
}

export function createSubscriptionRouter(
  service: SubscriptionService,
  jwtManager: JwtManager,
): Router {
  const router = Router();
  const auth = makeAuth(jwtManager);

  // ── 구독 목록 / 생성 ──────────────────────────────────────────
  router.get('/services', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const items = await service.findAll(userId);
    res.json({ success: true, data: items });
  });

  router.post('/services', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const parsed = createSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }
    const sub = await service.create(userId, parsed.data);
    res.status(201).json({ success: true, data: sub });
  });

  // ── 구독 상세 / 수정 / 삭제 ──────────────────────────────────
  router.get('/services/:id', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const sub = await service.findById(userId, req.params['id']);
    if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: sub });
  });

  router.put('/services/:id', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const parsed = updateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }
    const sub = await service.update(userId, req.params['id'], parsed.data);
    if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: sub });
  });

  router.delete('/services/:id', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const ok = await service.delete(userId, req.params['id']);
    if (!ok) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true });
  });

  // ── 요약 통계 ─────────────────────────────────────────────────
  router.get('/summary', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const summary = await service.getSummary(userId);
    res.json({ success: true, data: summary });
  });

  // ── 가격 히스토리 ─────────────────────────────────────────────
  router.post('/services/:id/price', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const sub = await service.findById(userId, req.params['id']);
    if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }

    const parsed = createPriceHistorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }

    const history = await service.addPriceHistory(req.params['id'], parsed.data);
    res.status(201).json({ success: true, data: history });
  });

  router.get('/services/:id/history', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const sub = await service.findById(userId, req.params['id']);
    if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }

    const history = await service.getPriceHistory(req.params['id']);
    res.json({ success: true, data: history });
  });

  // ── 메모 ──────────────────────────────────────────────────────
  router.get('/services/:id/notes', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const sub = await service.findById(userId, req.params['id']);
    if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const notes = await service.getNotes(req.params['id']);
    res.json({ success: true, data: notes });
  });

  router.post('/services/:id/notes', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const sub = await service.findById(userId, req.params['id']);
    if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const parsed = createNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.message });
      return;
    }
    const note = await service.addNote(req.params['id'], parsed.data);
    res.status(201).json({ success: true, data: note });
  });

  router.delete('/services/:id/notes/:noteId', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const sub = await service.findById(userId, req.params['id']);
    if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const ok = await service.deleteNote(req.params['id'], req.params['noteId']);
    if (!ok) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true });
  });

  // ── 누적 결제 금액 ────────────────────────────────────────────
  router.get('/services/:id/cumulative', auth, async (req, res) => {
    const userId = (req as Record<string, string>)['userId'];
    const result = await service.getCumulative(userId, req.params['id']);
    if (!result) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: result });
  });

  return router;
}
