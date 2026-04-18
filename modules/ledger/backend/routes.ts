import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { LedgerService } from './service.js';
import {
  CreateCategorySchema,
  CreateEntrySchema,
  CreatePaymentMethodSchema,
  EntryListQuerySchema,
  ExportQuerySchema,
  SummaryQuerySchema,
  UpdateEntrySchema,
  validateBody,
  validateQuery,
} from './validation.js';

// ── 인증 미들웨어 ─────────────────────────────────────────────
//
// @fieldstack/core 직접 import 시 모듈 디렉터리에서 경로 해석 실패.
// verifyAccessToken 덕 타입으로 대체한다.

type JwtManager = { verifyAccessToken(token: string): Promise<{ userId: string; email: string }> };

function createAuth(jwtManager: JwtManager) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    try {
      const token = header.slice(7);
      req.auth = await jwtManager.verifyAccessToken(token);
      next();
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  };
}

// ── 라우터 팩토리 ─────────────────────────────────────────────

export function createLedgerRouter(
  service: LedgerService,
  jwtManager: JwtManager,
): Router {
  const router = Router();
  const auth = createAuth(jwtManager);

  // ── 카테고리 ────────────────────────────────────────────────

  /** GET /api/ledger/categories */
  router.get('/categories', auth, async (req, res) => {
    try {
      const categories = await service.listCategories(req.auth!.userId);
      res.json({ success: true, data: { categories } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** POST /api/ledger/categories */
  router.post('/categories', auth, validateBody(CreateCategorySchema), async (req, res) => {
    try {
      const category = await service.createCategory(req.auth!.userId, req.body);
      res.status(201).json({ success: true, data: { category } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** DELETE /api/ledger/categories/:id */
  router.delete('/categories/:id', auth, async (req, res) => {
    try {
      const deleted = await service.deleteCategory(req.auth!.userId, req.params['id']!);
      if (!deleted) {
        res.status(404).json({ success: false, error: '카테고리를 찾을 수 없습니다.' });
        return;
      }
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ── 결제 수단 ────────────────────────────────────────────────

  /** GET /api/ledger/payment-methods */
  router.get('/payment-methods', auth, async (req, res) => {
    try {
      const methods = await service.listPaymentMethods(req.auth!.userId);
      res.json({ success: true, data: { methods } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** POST /api/ledger/payment-methods */
  router.post('/payment-methods', auth, validateBody(CreatePaymentMethodSchema), async (req, res) => {
    try {
      const method = await service.createPaymentMethod(req.auth!.userId, req.body);
      res.status(201).json({ success: true, data: { method } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** DELETE /api/ledger/payment-methods/:id */
  router.delete('/payment-methods/:id', auth, async (req, res) => {
    try {
      const deleted = await service.deletePaymentMethod(req.auth!.userId, req.params['id']!);
      if (!deleted) {
        res.status(404).json({ success: false, error: '결제 수단을 찾을 수 없습니다.' });
        return;
      }
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ── 통계 ────────────────────────────────────────────────────

  /** GET /api/ledger/summary?year=2026&month=4 */
  router.get('/summary', auth, validateQuery(SummaryQuerySchema), async (req, res) => {
    try {
      type Q = { year: number; month: number };
      const { year, month } = (req as Request & { validatedQuery: Q }).validatedQuery;
      const summary = await service.getSummary(req.auth!.userId, year, month);
      res.json({ success: true, data: { summary } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ── 가계부 항목 ──────────────────────────────────────────────

  /** GET /api/ledger/entries */
  router.get('/entries', auth, validateQuery(EntryListQuerySchema), async (req, res) => {
    try {
      type Q = {
        year?: number;
        month?: number;
        type?: 'income' | 'expense';
        categoryId?: string;
        page: number;
        limit: number;
      };
      const query = (req as Request & { validatedQuery: Q }).validatedQuery;
      const result = await service.listEntries(req.auth!.userId, query);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** POST /api/ledger/entries */
  router.post('/entries', auth, validateBody(CreateEntrySchema), async (req, res) => {
    try {
      const entry = await service.createEntry(req.auth!.userId, req.body);
      res.status(201).json({ success: true, data: { entry } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** GET /api/ledger/entries/export?year=2026&month=4&type=expense */
  router.get('/entries/export', auth, validateQuery(ExportQuerySchema), async (req, res) => {
    try {
      type Q = {
        year?: number;
        month?: number;
        type?: 'income' | 'expense';
        categoryId?: string;
      };
      const query = (req as Request & { validatedQuery: Q }).validatedQuery;
      const csv = await service.exportEntriesCsv(req.auth!.userId, query);

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const filename = `ledger-${dateStr}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // UTF-8 BOM — Excel에서 한글 깨짐 방지
      res.send('\uFEFF' + csv);
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** GET /api/ledger/entries/:id */
  router.get('/entries/:id', auth, async (req, res) => {
    try {
      const entry = await service.getEntry(req.auth!.userId, req.params['id']!);
      if (!entry) {
        res.status(404).json({ success: false, error: '항목을 찾을 수 없습니다.' });
        return;
      }
      res.json({ success: true, data: { entry } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** PUT /api/ledger/entries/:id */
  router.put('/entries/:id', auth, validateBody(UpdateEntrySchema), async (req, res) => {
    try {
      const entry = await service.updateEntry(req.auth!.userId, req.params['id']!, req.body);
      if (!entry) {
        res.status(404).json({ success: false, error: '항목을 찾을 수 없습니다.' });
        return;
      }
      res.json({ success: true, data: { entry } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** DELETE /api/ledger/entries/:id */
  router.delete('/entries/:id', auth, async (req, res) => {
    try {
      const deleted = await service.deleteEntry(req.auth!.userId, req.params['id']!);
      if (!deleted) {
        res.status(404).json({ success: false, error: '항목을 찾을 수 없습니다.' });
        return;
      }
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
