import path from 'node:path';
import fs from 'node:fs';

import type express from 'express';

import type { AppServices } from './app';
import type { BackendRouteRegistration, ModuleManifest } from './loader';
import { log } from './middleware/logger';

// ── ModuleRecord ──────────────────────────────────────────────

export interface ModuleRecord {
  /** module.json의 name (또는 디렉터리 이름 폴백) */
  name: string;
  /** Express 라우터가 마운트될 경로 (예: /api/ledger) */
  basePath: string;
  /** module.json 전체 manifest */
  manifest: ModuleManifest;
  router: express.Router;
}

// ── ModuleRegistry 싱글턴 ─────────────────────────────────────
//
// Express의 app.use()로 고정 마운트한 라우터는 런타임에 제거할 수 없다.
// 대신 단일 디스패처 미들웨어를 app.use()에 한 번만 등록하고,
// 실제 라우팅은 매 요청마다 레지스트리 Map을 참조해 처리한다.
//
// ┌─────────────────────────────────────────────────────┐
// │  app.use(registry.dispatcher())  ← 한 번만 등록     │
// │                                                     │
// │  req → dispatcher → Map.get(basePath) → router      │
// └─────────────────────────────────────────────────────┘
//
// register() / unregister() 로 Map을 갱신하면 서버 재시작 없이 즉시 반영된다.

export class ModuleRegistry {
  private static _instance: ModuleRegistry | null = null;

  /** basePath → ModuleRecord */
  private readonly modules = new Map<string, ModuleRecord>();

  private constructor() {}

  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry._instance) {
      ModuleRegistry._instance = new ModuleRegistry();
    }
    return ModuleRegistry._instance;
  }

  // ── 등록 / 해제 ────────────────────────────────────────────

  public register(record: ModuleRecord): void {
    this.modules.set(record.basePath, record);
    log.success('registry', `module "${record.name}" mounted at ${record.basePath}`);
  }

  public unregister(basePath: string): boolean {
    const record = this.modules.get(basePath);
    if (!record) return false;
    this.modules.delete(basePath);
    log.info('registry', `module "${record.name}" unregistered (${basePath})`);
    return true;
  }

  /** 현재 등록된 모듈 목록 (읽기 전용 복사본) */
  public list(): ModuleRecord[] {
    return Array.from(this.modules.values());
  }

  // ── 디스패처 미들웨어 ────────────────────────────────────────
  //
  // 매 요청마다 등록된 basePath를 순회하여 일치하는 라우터로 위임한다.
  // basePath가 req.path의 접두사인 경우에만 해당 라우터를 호출한다.

  public dispatcher(): express.RequestHandler {
    return (req, res, next) => {
      for (const record of this.modules.values()) {
        const base = record.basePath.endsWith('/')
          ? record.basePath
          : record.basePath + '/';

        if (req.path === record.basePath || req.path.startsWith(base)) {
          // sub-path를 라우터에 전달하기 위해 url 재작성.
          // Express 5 / router 패키지에서 req.path는 req.url 파생 getter이므로
          // req.url만 변경하면 req.path가 자동으로 갱신된다.
          const originalUrl = req.url;

          req.url = req.url.slice(record.basePath.length) || '/';

          record.router(req, res, (err?: unknown) => {
            req.url = originalUrl;
            next(err);
          });
          return;
        }
      }
      next();
    };
  }
}

// ── 모듈 로더 (디스크 → 레지스트리 등록) ─────────────────────

interface ModuleRouterModule {
  default?: express.Router;
  // createRouter는 동기 또는 비동기 모두 허용 (모듈 마이그레이션 등 async 초기화 지원)
  createRouter?: (services: AppServices) => express.Router | Promise<express.Router>;
}

/**
 * registrations 목록을 순회해 각 모듈의 backend/index.{ts,js}를 로드하고
 * ModuleRegistry에 등록한다. 기존 mountModuleRouters()를 대체한다.
 */
export async function loadModulesIntoRegistry(
  registrations: BackendRouteRegistration[],
  manifests: ModuleManifest[],
  modulesDir: string,
  services: AppServices,
): Promise<void> {
  const registry = ModuleRegistry.getInstance();
  const manifestMap = new Map(manifests.map((m) => [m.name, m]));

  if (registrations.length === 0) {
    log.warn('registry', `no enabled modules found`);
    return;
  }

  for (const reg of registrations) {
    if (!reg.apiBasePath) {
      log.warn('registry', `module "${reg.moduleName}" has no apiBasePath, skipping`);
      continue;
    }

    // 라우터 파일 탐색: backend/index.ts (dev) → backend/index.js (prod)
    const baseDir = path.join(modulesDir, reg.moduleName, 'backend');
    const candidatePaths = [
      path.join(baseDir, 'index.ts'),
      path.join(baseDir, 'index.js'),
    ];

    const routerFile = candidatePaths.find((p) => fs.existsSync(p));
    if (!routerFile) {
      log.warn('registry', `module "${reg.moduleName}" has no backend router at ${baseDir}/index.{ts,js}`);
      continue;
    }

    try {
      // apps/api는 @fieldstack/core에 접근 가능하므로 여기서 마이그레이션 실행
      const migrationsDir = path.join(modulesDir, reg.moduleName, 'backend', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const { FileMigrationRunner } = await import('@fieldstack/core');
        const runner = new FileMigrationRunner(services.db, reg.moduleName, migrationsDir);
        await runner.run();
        log.info('registry', `migrations applied for module "${reg.moduleName}"`);
      }

      const mod = (await import(routerFile)) as ModuleRouterModule;
      let router: express.Router | undefined;

      if (typeof mod.createRouter === 'function') {
        // async createRouter도 지원
        router = await Promise.resolve(mod.createRouter(services));
      } else if (mod.default) {
        router = mod.default;
      }

      if (!router) {
        log.warn('registry', `module "${reg.moduleName}" has no default export or createRouter`);
        continue;
      }

      const manifest = manifestMap.get(reg.moduleName);
      if (!manifest) continue; // scanBackendModules를 거친 manifests에 반드시 존재해야 함

      registry.register({ name: reg.moduleName, basePath: reg.apiBasePath, manifest, router });
    } catch (err) {
      log.error('registry', `failed to load module "${reg.moduleName}"`, err);
    }
  }
}

/**
 * 모듈 디렉터리를 재스캔하여 레지스트리를 갱신한다.
 * - 새로 추가된 모듈: 등록
 * - 삭제/비활성화된 모듈: 해제
 * - 이미 등록된 모듈: 변경 없음 (라우터 핫리로드 미지원)
 */
export async function reloadModules(
  modulesDir: string,
  services: AppServices,
): Promise<{ added: string[]; removed: string[] }> {
  const { loadModulesFromDisk, scanBackendModules, buildBackendRouteRegistrations } =
    await import('./loader/index.js');

  const entries = await loadModulesFromDisk(modulesDir);
  const manifests = await scanBackendModules(entries);
  const registrations = buildBackendRouteRegistrations(manifests);

  const registry = ModuleRegistry.getInstance();
  const currentPaths = new Set(registry.list().map((r: ModuleRecord) => r.basePath));
  const newPaths = new Set(
    registrations.map((r: BackendRouteRegistration) => r.apiBasePath).filter(Boolean),
  );

  // 제거된 모듈 해제
  const removed: string[] = [];
  for (const existing of registry.list()) {
    if (!newPaths.has(existing.basePath)) {
      registry.unregister(existing.basePath);
      removed.push(existing.name);
    }
  }

  // 새 모듈 등록
  const toAdd = registrations.filter(
    (r: BackendRouteRegistration) => r.apiBasePath && !currentPaths.has(r.apiBasePath),
  );
  await loadModulesIntoRegistry(toAdd, manifests, modulesDir, services);
  const added = toAdd.map((r: BackendRouteRegistration) => r.moduleName);

  return { added, removed };
}
