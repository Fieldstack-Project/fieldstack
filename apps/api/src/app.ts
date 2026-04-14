import path from 'node:path';

import cors from 'cors';
import express from 'express';

import type {
  AdminPinServiceImpl,
  DbProvider,
  JwtSessionManagerImpl,
  TotpServiceImpl,
  UserAuthService,
  WhitelistServiceImpl,
} from '@fieldstack/core' with { "resolution-mode": "import" };

import { validateEnv } from './config/env';
import { errorHandler } from './middleware/error';
import { createAuthRouter } from './routes/auth';
import { healthRouter } from './routes/health';

// ── App 팩토리 ────────────────────────────────────────────────

export interface AppServices {
  jwtManager: JwtSessionManagerImpl;
  whitelist: WhitelistServiceImpl;
  adminPin: AdminPinServiceImpl;
  totpService: TotpServiceImpl;
  userAuth: UserAuthService;
}

export function createApp(services?: AppServices) {
  const app = express();

  // ── Middleware ────────────────────────────────────────────────
  if (process.env['NODE_ENV'] !== 'production') {
    app.use(cors());
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Core routes ───────────────────────────────────────────────
  app.use('/health', healthRouter);

  if (services) {
    app.use('/auth', createAuthRouter(services));
  }

  // ── Error handler (반드시 마지막) ─────────────────────────────
  app.use(errorHandler);

  return app;
}

// ── DB 초기화 ────────────────────────────────────────────────

export async function initDb(): Promise<DbProvider> {
  const { getDb } = await import('@fieldstack/core');
  return getDb();
}

// ── 마이그레이션 실행 ─────────────────────────────────────────

export async function runMigrations(db: DbProvider): Promise<void> {
  const { FileMigrationRunner } = await import('@fieldstack/core');
  const coreDir = path.join(__dirname, 'db', 'migrations', 'core');
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

  return { jwtManager, whitelist, adminPin, totpService, userAuth };
}
