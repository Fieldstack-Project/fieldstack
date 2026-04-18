import { z } from 'zod';
import type { NextFunction, Request, Response } from 'express';

// ── 카테고리 ──────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['income', 'expense', 'both']),
  color: z.string().max(20).optional(),
  icon: z.string().max(10).optional(),
});

// ── 결제 수단 ─────────────────────────────────────────────────

export const CreatePaymentMethodSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['cash', 'credit_card', 'debit_card', 'transfer', 'other']),
});

// ── 가계부 항목 ───────────────────────────────────────────────

export const CreateEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  amount: z.number().positive('금액은 0보다 커야 합니다'),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(200).default(''),
  paymentMethodId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const UpdateEntrySchema = CreateEntrySchema.partial();

// ── 쿼리 파라미터 ─────────────────────────────────────────────

export const EntryListQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const ExportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().uuid().optional(),
});

// ── 미들웨어 헬퍼 ─────────────────────────────────────────────

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error.flatten() });
      return;
    }
    // 검증된 쿼리 파라미터를 req에 저장 (타입 단언)
    (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
}
