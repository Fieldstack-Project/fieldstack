import express, { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';

import type { SubscriptionService } from './service.js';
import {
  createHistoryEventSchema,
  createNoteSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
} from './validation.js';
import { parseSubscriptionFile } from './file-import.js';

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
  const rawBody = express.raw({ type: '*/*', limit: '10mb' });

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

  // ── 파일 가져오기 ─────────────────────────────────────────────

  /**
   * POST /api/subscription/import/preview
   * Body: raw file bytes (CSV / XLSX / XLS)
   * Header: X-Filename — 확장자 판별에 사용 (예: subscriptions.csv)
   */
  router.post('/import/preview', auth, rawBody, async (req, res) => {
    try {
      const buf = req.body as Buffer;
      if (!Buffer.isBuffer(buf) || buf.length === 0) {
        res.status(400).json({ success: false, error: '파일 데이터가 없습니다.' });
        return;
      }

      const filename = decodeURIComponent(
        (req.headers['x-filename'] as string | undefined) ?? 'import.csv',
      );
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'csv';

      const result = parseSubscriptionFile(buf, ext);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /api/subscription/import/commit
   * Body: raw file bytes
   * Header: X-Filename — 확장자 판별
   */
  router.post('/import/commit', auth, rawBody, async (req, res) => {
    try {
      const userId = (req as AuthRequest).userId;
      const buf = req.body as Buffer;
      if (!Buffer.isBuffer(buf) || buf.length === 0) {
        res.status(400).json({ success: false, error: '파일 데이터가 없습니다.' });
        return;
      }

      const filename = decodeURIComponent(
        (req.headers['x-filename'] as string | undefined) ?? 'import.csv',
      );
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'csv';

      const { rows, errors } = parseSubscriptionFile(buf, ext);

      let imported = 0;
      for (const row of rows) {
        const parsed = createSubscriptionSchema.safeParse(row);
        if (parsed.success) {
          await service.create(userId, parsed.data);
          imported++;
        }
      }

      res.json({ success: true, data: { imported, skipped: rows.length - imported, errors } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
