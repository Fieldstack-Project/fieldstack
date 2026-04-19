import type { NextFunction, Request, Response } from 'express';
import express, { Router } from 'express';

import { LedgerService } from './service.js';
import {
  CreateCategorySchema,
  CreateEntrySchema,
  CreatePaymentMethodSchema,
  EntryListQuerySchema,
  ExportQuerySchema,
  ImportCommitSchema,
  ImportMappingSchema,
  SummaryQuerySchema,
  UpdateCategorySchema,
  UpdateEntrySchema,
  UpdatePaymentMethodSchema,
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

  // raw body (CSV / 이진 파일) — 영수증 업로드 및 CSV 가져오기 엔드포인트에만 적용
  const rawBody = express.raw({ type: '*/*', limit: '10mb' });

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

  /** PATCH /api/ledger/categories/:id */
  router.patch('/categories/:id', auth, validateBody(UpdateCategorySchema), async (req, res) => {
    try {
      const category = await service.updateCategory(req.auth!.userId, req.params['id']!, req.body);
      if (!category) {
        res.status(404).json({ success: false, error: '카테고리를 찾을 수 없습니다.' });
        return;
      }
      res.json({ success: true, data: { category } });
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

  /** PATCH /api/ledger/payment-methods/:id */
  router.patch('/payment-methods/:id', auth, validateBody(UpdatePaymentMethodSchema), async (req, res) => {
    try {
      const method = await service.updatePaymentMethod(req.auth!.userId, req.params['id']!, req.body);
      if (!method) {
        res.status(404).json({ success: false, error: '수단을 찾을 수 없습니다.' });
        return;
      }
      res.json({ success: true, data: { method } });
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

  // ── 영수증 ───────────────────────────────────────────────────

  /** POST /api/ledger/entries/:id/receipt  (Content-Type: application/octet-stream) */
  router.post('/entries/:id/receipt', auth, rawBody, async (req, res) => {
    try {
      const filename = decodeURIComponent(
        (req.headers['x-filename'] as string | undefined) ?? 'receipt.jpg',
      );
      const buf = req.body as Buffer;
      if (!Buffer.isBuffer(buf) || buf.length === 0) {
        res.status(400).json({ success: false, error: '파일 데이터가 없습니다.' });
        return;
      }
      const entry = await service.uploadReceipt(req.auth!.userId, req.params['id']!, buf, filename);
      if (!entry) {
        res.status(404).json({ success: false, error: '항목을 찾을 수 없습니다.' });
        return;
      }
      res.json({ success: true, data: { entry } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** GET /api/ledger/entries/:id/receipt */
  router.get('/entries/:id/receipt', auth, async (req, res) => {
    try {
      const filePath = await service.getReceiptFilePath(req.auth!.userId, req.params['id']!);
      if (!filePath) {
        res.status(404).json({ success: false, error: '영수증이 없습니다.' });
        return;
      }
      res.sendFile(filePath);
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** DELETE /api/ledger/entries/:id/receipt */
  router.delete('/entries/:id/receipt', auth, async (req, res) => {
    try {
      const entry = await service.deleteReceipt(req.auth!.userId, req.params['id']!);
      if (!entry) {
        res.status(404).json({ success: false, error: '항목을 찾을 수 없습니다.' });
        return;
      }
      res.json({ success: true, data: { entry } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ── CSV 가져오기 ─────────────────────────────────────────────

  /**
   * POST /api/ledger/import/preview
   * Body: raw CSV bytes (application/octet-stream)
   * Header: X-Override-Mapping (optional JSON ImportMapping)
   */
  router.post('/import/preview', auth, rawBody, async (req, res) => {
    try {
      const buf = req.body as Buffer;
      if (!Buffer.isBuffer(buf) || buf.length === 0) {
        res.status(400).json({ success: false, error: 'CSV 파일 데이터가 없습니다.' });
        return;
      }

      let overrideMapping = undefined;
      const mappingHeader = req.headers['x-override-mapping'];
      if (mappingHeader) {
        try {
          const parsed = JSON.parse(mappingHeader as string);
          const result = ImportMappingSchema.safeParse(parsed);
          if (result.success) overrideMapping = result.data;
        } catch {
          // 잘못된 JSON 무시
        }
      }

      const preview = await service.importPreview(req.auth!.userId, buf, overrideMapping);
      res.json({ success: true, data: preview });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /api/ledger/import/commit
   * Body: multipart 아닌 JSON { mapping, skipDuplicates } + raw CSV in header X-Csv-Data (base64)
   * — 단순화를 위해 preview와 동일하게 raw bytes body + JSON header로 처리
   *
   * 실제 구현: body = CSV bytes, X-Import-Mapping = JSON string
   */
  router.post('/import/commit', auth, rawBody, async (req, res) => {
    try {
      const buf = req.body as Buffer;
      if (!Buffer.isBuffer(buf) || buf.length === 0) {
        res.status(400).json({ success: false, error: 'CSV 파일 데이터가 없습니다.' });
        return;
      }

      const mappingHeader = req.headers['x-import-mapping'];
      if (!mappingHeader) {
        res.status(400).json({ success: false, error: 'X-Import-Mapping 헤더가 필요합니다.' });
        return;
      }

      let body: { mapping: unknown; skipDuplicates: boolean };
      try {
        body = JSON.parse(mappingHeader as string);
      } catch {
        res.status(400).json({ success: false, error: 'X-Import-Mapping JSON 파싱 오류' });
        return;
      }

      const parsed = ImportCommitSchema.safeParse(body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.flatten() });
        return;
      }

      const result = await service.importCommit(
        req.auth!.userId,
        buf,
        parsed.data.mapping,
        parsed.data.skipDuplicates,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
