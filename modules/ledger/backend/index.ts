import type { Router } from 'express';

import type { DbProvider } from '@fieldstack/core' with { "resolution-mode": "import" };

import { LedgerService } from './service.js';
import { createLedgerRouter } from './routes.js';

// ── Module Loader 계약 ────────────────────────────────────────
//
// module-registry.ts가 이 파일을 동적으로 import하고
// `createRouter(services)` 를 호출해 Express Router를 얻는다.
//
// ⚠️ @fieldstack/core에서 값(value)을 import하면 모듈 디렉터리에서
//    경로를 찾지 못해 런타임 오류가 발생한다.
//    마이그레이션 실행은 module-registry.ts에서 처리하고,
//    DB 프로바이더는 services.db를 통해 주입받는다.

interface ModuleServices {
  jwtManager: { verifyAccessToken(token: string): Promise<{ userId: string; email: string }> };
  db: DbProvider;
}

export function createRouter(services: ModuleServices): Router {
  const service = new LedgerService(services.db);
  return createLedgerRouter(service, services.jwtManager);
}
