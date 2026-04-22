import fs from 'node:fs';
import path from 'node:path';

import cors from 'cors';
import express from 'express';

import type {
  AdminPinServiceImpl,
  DbProvider,
  JwtSessionManagerImpl,
  SharedLinkService,
  SystemSettingsService,
  TotpServiceImpl,
  UserAuthService,
  WhitelistServiceImpl,
} from '@fieldstack/core' with { "resolution-mode": "import" };

import type { SharedLinkRenderer } from '@fieldstack/core' with { "resolution-mode": "import" };

import { validateEnv } from './config/env';
import { errorHandler } from './middleware/error';
import { requestLogger } from './middleware/logger';
import { ModuleRegistry } from './module-registry';
import { createAdminRouter } from './routes/admin';
import { createAuthRouter } from './routes/auth';
import { createCoreRouter } from './routes/core';
import { healthRouter } from './routes/health';
import { createPublicRouter } from './routes/public';
import { createSetupRouter } from './routes/setup';
import { createShareRouter } from './routes/share';

// ── App 팩토리 ────────────────────────────────────────────────

export interface AppServices {
  jwtManager: JwtSessionManagerImpl;
  whitelist: WhitelistServiceImpl;
  adminPin: AdminPinServiceImpl;
  totpService: TotpServiceImpl;
  userAuth: UserAuthService;
  sharedLink: SharedLinkService;
  settings: SystemSettingsService;
  // 모듈 라우터에서 사용할 DB 프로바이더 (모듈이 @fieldstack/core를 직접 import하지 않아도 되도록)
  db: DbProvider;
}

export function createApp(services?: AppServices) {
  const app = express();

  // ── Middleware ────────────────────────────────────────────────
  if (process.env['NODE_ENV'] !== 'production') {
    app.use(cors());
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // ── Core routes ───────────────────────────────────────────────
  app.use('/health', healthRouter);

  // 앱 모드에서 /setup/status는 installed:true를 반환 (프론트엔드 모드 감지용)
  app.get('/setup/status', (_req, res) => {
    res.json({ success: true, data: { installed: true } });
  });

  if (services) {
    app.use('/auth', createAuthRouter(services));
    app.use('/core/share', createShareRouter(services));
    app.use('/core', createCoreRouter(services));
    app.use('/admin', createAdminRouter(services));
    // 모듈 라우터 디스패처 — ModuleRegistry에 등록된 모듈을 동적으로 서빙
    app.use(ModuleRegistry.getInstance().dispatcher());
  }

  return app;
}

// ── createApp with public routes ─────────────────────────────

export function createAppWithPublicRouter(
  services: AppServices,
  getRenderer: (resourceType: string) => SharedLinkRenderer | undefined,
) {
  const app = express();

  if (process.env['NODE_ENV'] !== 'production') {
    app.use(cors());
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use('/health', healthRouter);

  // 앱 모드에서 /setup/status는 installed:true를 반환 (프론트엔드 모드 감지용)
  app.get('/setup/status', (_req, res) => {
    res.json({ success: true, data: { installed: true } });
  });

  app.use('/auth', createAuthRouter(services));
  app.use('/core/share', createShareRouter(services));
  app.use('/core', createCoreRouter(services));
  app.use('/admin', createAdminRouter(services));
  app.use('/s', createPublicRouter(services.sharedLink, getRenderer));
  // 모듈 라우터 디스패처 — ModuleRegistry에 등록된 모듈을 동적으로 서빙
  app.use(ModuleRegistry.getInstance().dispatcher());

  return app;
}

// ── Setup 전용 앱 팩토리 (installed.lock 없을 때) ─────────────

export function createSetupApp(): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use('/health', healthRouter);
  app.use('/setup', createSetupRouter());

  // 프로덕션: 빌드된 프론트엔드 정적 파일 서빙
  // 프로덕션에서만 빌드된 프론트엔드 정적 파일 서빙
  // 개발 모드에서는 Vite dev server(port 5173)가 프론트엔드를 담당하므로 건너뜀
  const publicDir = path.join(__dirname, '..', 'public');
  if (process.env['NODE_ENV'] === 'production' && fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    // Express 5 + path-to-regexp v8: '*' 와일드카드 미지원 → app.use() 로 catch-all 처리
    app.use((_req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  return app;
}


// ── Error handler 마운트 (반드시 모든 라우트 등록 후 마지막에 호출) ──

export function finalizeApp(app: express.Application): void {
  app.use(errorHandler);
}

// ── DB 초기화 ────────────────────────────────────────────────

export async function initDb(): Promise<DbProvider> {
  const { getDb } = await import('@fieldstack/core');
  return getDb();
}

// ── 마이그레이션 실행 ─────────────────────────────────────────

export async function runMigrations(db: DbProvider): Promise<void> {
  const { FileMigrationRunner } = await import('@fieldstack/core');
  const coreDir = path.join(__dirname, 'migrations', 'core');
  const runner = new FileMigrationRunner(db, 'core', coreDir);
  await runner.run();
}

// ── 서비스 초기화 ─────────────────────────────────────────────

export async function initServices(db: DbProvider): Promise<AppServices> {
  const env = validateEnv(process.env);

  const {
    JwtSessionManagerImpl,
    WhitelistServiceImpl,
    AdminPinServiceImpl,
    TotpServiceImpl,
    UserAuthService,
    SharedLinkService,
    SystemSettingsService,
  } = await import('@fieldstack/core');

  const accessSecret = env.JWT_SECRET ?? 'dev-access-secret-change-in-production';
  const refreshSecret = env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-production';

  if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
    throw new Error('[fieldstack][api] JWT_SECRET must be set in production');
  }

  const jwtManager = new JwtSessionManagerImpl(db, accessSecret, refreshSecret);
  const whitelist = new WhitelistServiceImpl(db);
  const adminPin = new AdminPinServiceImpl(db);
  const totpService = new TotpServiceImpl(db, env.TOTP_ISSUER);
  const userAuth = new UserAuthService(db, jwtManager, whitelist, totpService);
  const settings = new SystemSettingsService(db);
  const sharedLink = new SharedLinkService(db, settings, env.PUBLIC_URL ?? null);

  return { jwtManager, whitelist, adminPin, totpService, userAuth, sharedLink, settings, db };
}
