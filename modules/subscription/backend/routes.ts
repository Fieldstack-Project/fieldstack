import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';

import type { SubscriptionService } from './service.js';
import {
  createHistoryEventSchema,
  createNoteSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from './validation.js';

type JwtManager = {
  verifyAccessToken(token: string): Promise<{ userId: string; email: string }>;
};

type AuthRequest = Request & { userId: string };

// ── 인증 미들웨어 ─────────────────────────────────────────────────

function makeAuth(jwtManager: JwtManager) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    try {
      const token = header.slice(7);
      const payload = await jwtManager.verifyAccessToken(token);
      (req as AuthRequest).userId = payload.userId;
      next();
    } catch {
      res.status(401).json({ success: false, error: 'Unauthorized' });
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
    try {
      const userId = (req as AuthRequest).userId;
      const items = await service.findAll(userId);
      res.json({ success: true, data: items });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  router.post('/services', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const parsed = createSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.message });
        return;
      }
      const sub = await service.create(userId, parsed.data);
      res.status(201).json({ success: true, data: sub });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ── 구독 상세 / 수정 / 삭제 ──────────────────────────────────
  router.get('/services/:id', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const sub = await service.findById(userId, req.params['id']);
      if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      res.json({ success: true, data: sub });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  router.put('/services/:id', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const parsed = updateSubscriptionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.message });
        return;
      }
      const sub = await service.update(userId, req.params['id'], parsed.data);
      if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      res.json({ success: true, data: sub });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  router.delete('/services/:id', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const ok = await service.delete(userId, req.params['id']);
      if (!ok) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ── 요약 통계 ─────────────────────────────────────────────────
  router.get('/summary', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const summary = await service.getSummary(userId);
      res.json({ success: true, data: summary });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ── 히스토리 이벤트 ───────────────────────────────────────────
  router.post('/services/:id/history', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const parsed = createHistoryEventSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.message });
        return;
      }
      const event = await service.addHistoryEvent(userId, req.params['id'], parsed.data);
      res.status(201).json({ success: true, data: event });
    } catch (err) {
      const isForbidden = err instanceof Error && err.message === 'Forbidden';
      res.status(isForbidden ? 404 : 500).json({ success: false, error: 'Not found' });
    }
  });

  router.delete('/services/:id/history/:historyId', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const ok = await service.deleteHistoryEvent(userId, req.params['id'], req.params['historyId']);
      if (!ok) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      res.json({ success: true });
    } catch (err) {
      const isForbidden = err instanceof Error && err.message === 'Forbidden';
      res.status(isForbidden ? 404 : 500).json({ success: false, error: 'Not found' });
    }
  });

  router.get('/services/:id/history', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const sub = await service.findById(userId, req.params['id']);
      if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      const history = await service.getHistory(req.params['id']);
      res.json({ success: true, data: history });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ── 메모 ──────────────────────────────────────────────────────
  router.get('/services/:id/notes', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const sub = await service.findById(userId, req.params['id']);
      if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      const notes = await service.getNotes(req.params['id']);
      res.json({ success: true, data: notes });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  router.post('/services/:id/notes', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const sub = await service.findById(userId, req.params['id']);
      if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      const parsed = createNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.message });
        return;
      }
      const note = await service.addNote(req.params['id'], parsed.data);
      res.status(201).json({ success: true, data: note });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  router.delete('/services/:id/notes/:noteId', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const sub = await service.findById(userId, req.params['id']);
      if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      const ok = await service.deleteNote(req.params['id'], req.params['noteId']);
      if (!ok) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ── 상태 이력 ─────────────────────────────────────────────────
  router.get('/services/:id/status-history', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const sub = await service.findById(userId, req.params['id']);
      if (!sub) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      const history = await service.getStatusHistory(req.params['id']);
      res.json({ success: true, data: history });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // ── 누적 결제 금액 ────────────────────────────────────────────
  router.get('/services/:id/cumulative', auth, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const result = await service.getCumulative(userId, req.params['id']);
      if (!result) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      res.json({ success: true, data: result });
    } catch {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return router;
}
