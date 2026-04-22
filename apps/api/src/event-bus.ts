import { EventEmitter } from 'node:events';

// ── 이벤트 페이로드 타입 정의 ────────────────────────────────────
//
// 새 이벤트 추가 시 이 인터페이스에만 추가하면 emit/on/once 전체에 자동 반영.

export interface EventPayloads {
  /** 구독 결제일 도래 — Scheduler가 매일 자정 발행 */
  'subscription:payment': {
    subscriptionId: string;
    userId: string;
    serviceName: string;
    amount: number;
    currency: string;
    date: string;           // YYYY-MM-DD
    priceHistoryId: string | null;
  };
  /** 구독 가격 변경 */
  'subscription:price-changed': {
    subscriptionId: string;
    userId: string;
    previousAmount: number;
    newAmount: number;
    currency: string;
    effectiveDate: string;  // YYYY-MM-DD
  };
  /** 가계부 항목 생성 완료 */
  'ledger:created': {
    entryId: string;
    userId: string;
  };
}

export type EventName = keyof EventPayloads;

type Handler<K extends EventName> = (payload: EventPayloads[K]) => void;

// ── EventBus 싱글턴 ───────────────────────────────────────────────
//
// Node.js EventEmitter 위에 타입-안전 래퍼를 얹은 구조.
// 모든 모듈은 services.eventBus를 통해 접근한다.
//
// on() 반환값(unsubscribe 함수)을 모듈 종료 시 반드시 호출해
// 메모리 누수를 방지할 것.

export class EventBus {
  private static _instance: EventBus | null = null;
  private readonly emitter = new EventEmitter();

  private constructor() {
    // EventEmitter 기본 리스너 한도(10)를 늘려 대규모 모듈 환경 대비
    this.emitter.setMaxListeners(100);
  }

  public static getInstance(): EventBus {
    if (!EventBus._instance) {
      EventBus._instance = new EventBus();
    }
    return EventBus._instance;
  }

  /** 이벤트 발행 */
  public emit<K extends EventName>(event: K, payload: EventPayloads[K]): void {
    this.emitter.emit(event, payload);
  }

  /**
   * 이벤트 구독.
   * @returns unsubscribe 함수 — 모듈 종료 시 반드시 호출할 것.
   */
  public on<K extends EventName>(event: K, handler: Handler<K>): () => void {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
    return () => this.off(event, handler);
  }

  /**
   * 단발 이벤트 구독 (한 번 수신 후 자동 해제).
   * @returns unsubscribe 함수
   */
  public once<K extends EventName>(event: K, handler: Handler<K>): () => void {
    this.emitter.once(event, handler as (...args: unknown[]) => void);
    return () => this.off(event, handler);
  }

  /** 특정 핸들러 해제 */
  public off<K extends EventName>(event: K, handler: Handler<K>): void {
    this.emitter.off(event, handler as (...args: unknown[]) => void);
  }

  /** 특정 이벤트의 모든 리스너 해제 (모듈 언로드 시 활용) */
  public removeAllListeners(event?: EventName): void {
    this.emitter.removeAllListeners(event);
  }

  /** 현재 등록된 리스너 수 (디버깅용) */
  public listenerCount(event: EventName): number {
    return this.emitter.listenerCount(event);
  }
}
