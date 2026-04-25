import { z } from 'zod';

const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'GBP'] as const;
const BILLING_CYCLES = ['monthly', 'yearly'] as const;
const EVENT_TYPES = ['price_change', 'cancelled', 'resumed', 'plan_change', 'memo'] as const;

export const createSubscriptionSchema = z.object({
  serviceName: z.string().min(1).max(100),
  currentAmount: z.number().nonnegative(),
  currency: z.enum(CURRENCIES),
  billingCycle: z.enum(BILLING_CYCLES),
  billingDay: z.number().int().min(1).max(31),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const updateSubscriptionSchema = createSubscriptionSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    cancelledAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  });

export const createNoteSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const createHistoryEventSchema = z.discriminatedUnion('eventType', [
  // 금액 변경을 수반하는 이벤트 (price_change, plan_change)
  z.object({
    eventType: z.enum(['price_change', 'plan_change']),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    amount: z.number().nonnegative(),
    currency: z.enum(CURRENCIES),
    reason: z.string().max(200).optional(),
    note: z.string().max(500).optional(),
  }),
  // 금액 변경 없는 이벤트
  z.object({
    eventType: z.enum(['cancelled', 'resumed', 'memo']),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().max(200).optional(),
    note: z.string().max(500).optional(),
  }),
]);

/** @deprecated createPriceHistorySchema → createHistoryEventSchema 로 대체 */
export const createPriceHistorySchema = createHistoryEventSchema;

export { EVENT_TYPES };
