import type { Router } from 'express';

import type { DbProvider } from '@fieldstack/core' with { 'resolution-mode': 'import' };

import { SubscriptionService } from './service.js';
import { createSubscriptionRouter } from './routes.js';

// ── 모듈 서비스 계약 (duck-type) ──────────────────────────────────
interface JwtManager {
  verifyAccessToken(token: string): Promise<{ userId: string; email: string }>;
}

interface EventBus {
  emit(event: string, payload: unknown): void;
  on(event: string, handler: (payload: unknown) => void): () => void;
}

interface Scheduler {
  register(def: {
    name: string;
    cronExpr: string;
    handler: () => Promise<void> | void;
    timezone?: string;
  }): void;
  unregister(name: string): boolean;
}

interface ModuleServices {
  db: DbProvider;
  jwtManager: JwtManager;
  eventBus: EventBus;
  scheduler: Scheduler;
}

// ── 리스너 해제 함수 보관 ─────────────────────────────────────────
let unsubscribePaymentListener: (() => void) | null = null;

export function createRouter(services: ModuleServices): Router {
  const { db, jwtManager, eventBus, scheduler } = services;
  const service = new SubscriptionService(db);

  // ── Scheduler: 매일 자정 결제일 체크 ──────────────────────────
  scheduler.register({
    name: 'subscription-payment-check',
    cronExpr: '0 0 * * *',
    timezone: 'Asia/Seoul',
    handler: async () => {
      const dueSubs = await service.findDueToday();
      for (const sub of dueSubs) {
        eventBus.emit('subscription:payment', {
          subscriptionId: sub.id,
          userId: sub.userId,
          serviceName: sub.serviceName,
          amount: sub.currentAmount,
          currency: sub.currency,
          date: sub.nextPaymentDate,
          priceHistoryId: null,
        });
        // 다음 결제일 자동 갱신
        await service.advanceNextPaymentDate(sub.id);
      }
    },
  });

  // ── EventBus: Ledger 자동 기록을 위한 이벤트 발행 확인 ──────────
  // (Ledger 모듈이 'subscription:payment'를 구독해 자동 기록)
  // 이 모듈은 발행 측이므로 별도 구독 불필요.
  //
  // 추후 'subscription:price-changed' 이벤트 수신 측 연동 예시:
  // unsubscribePaymentListener = eventBus.on('ledger:created', (payload) => { ... });

  return createSubscriptionRouter(service, jwtManager);
}

/** 모듈 언로드 시 호출 (graceful shutdown) */
export function shutdown(services: Pick<ModuleServices, 'scheduler'>): void {
  services.scheduler.unregister('subscription-payment-check');
  unsubscribePaymentListener?.();
  unsubscribePaymentListener = null;
}
