import { log } from './middleware/logger';

// ── ServiceRegistry 싱글턴 ───────────────────────────────────────
//
// 모듈이 공개한 서비스 인스턴스를 중앙에서 관리한다.
// 모듈 간 직접 import 금지 원칙을 지키면서 서비스를 공유할 수 있게 해준다.
//
// 사용 예:
//   // 등록 (모듈 초기화 시)
//   services.serviceRegistry.register('ledger', ledgerService);
//
//   // 조회 (다른 모듈에서)
//   const ledger = services.serviceRegistry.getService<LedgerPublicApi>('ledger');
//
// ⚠️ getService()는 모듈이 로드되기 전이면 undefined를 반환한다.
//    의존 모듈이 아직 없을 수 있으므로 항상 존재 여부를 확인할 것.

export class ServiceRegistry {
  private static _instance: ServiceRegistry | null = null;
  private readonly services = new Map<string, unknown>();

  private constructor() {}

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry._instance) {
      ServiceRegistry._instance = new ServiceRegistry();
    }
    return ServiceRegistry._instance;
  }

  /** 서비스 인스턴스 등록 */
  public register(name: string, service: unknown): void {
    if (this.services.has(name)) {
      log.warn('service-registry', `service "${name}" already registered — overwriting`);
    }
    this.services.set(name, service);
    log.info('service-registry', `service "${name}" registered`);
  }

  /**
   * 등록된 서비스 조회.
   * @returns 등록된 서비스 또는 undefined (미등록 시)
   */
  public getService<T>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  /** 서비스 해제 (모듈 언로드 시 호출) */
  public unregister(name: string): boolean {
    const existed = this.services.has(name);
    if (existed) {
      this.services.delete(name);
      log.info('service-registry', `service "${name}" unregistered`);
    }
    return existed;
  }

  /** 등록된 서비스 이름 목록 (디버깅용) */
  public list(): string[] {
    return Array.from(this.services.keys());
  }
}
