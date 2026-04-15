import 'dotenv/config';

import path from 'node:path';

import { validateEnv } from './config/env';
import {
  createApp,
  createAppWithPublicRouter,
  createSetupApp,
  finalizeApp,
  initDb,
  initServices,
  mountModuleRouters,
  runMigrations,
} from './app';
import {
  buildBackendRouteRegistrations,
  loadModulesFromDisk,
  scanBackendModules,
  validateModuleDependencies,
} from './loader';
import { applyConfigToEnv, isInstalled } from './setup/mode';

// ── fieldstack.config.json → process.env 반영 (env vars 우선) ─
applyConfigToEnv();

// ── 환경변수 검증 (누락·오류 시 즉시 종료) ────────────────────
const env = validateEnv(process.env);

const BOOTSTRAP_MESSAGE = 'Fieldstack API bootstrap initialized';

console.log(BOOTSTRAP_MESSAGE);
console.log(`[fieldstack][api] env: ${env.NODE_ENV}`);
console.log(`[fieldstack][api] install mode: ${env.INSTALL_MODE ?? 'normal'}`);

if (env.INSTALL_MODE === 'bypass') {
  console.warn('[fieldstack][api] DEV INSTALL BYPASS ACTIVE');
}

// modules/ 디렉터리는 프로젝트 루트 기준 (apps/api/src → ../../../modules)
const MODULES_DIR = path.join(__dirname, '..', '..', '..', 'modules');

// ── Setup 모드 ─────────────────────────────────────────────────
// installed.lock 없고 bypass 아닐 때 → Setup 마법사만 서빙
async function startSetup() {
  console.log('[fieldstack][api] *** SETUP MODE — installation wizard active ***');
  const app = createSetupApp();
  finalizeApp(app);
  app.listen(env.PORT, () => {
    console.log(`[fieldstack][api] setup server listening on http://localhost:${env.PORT}`);
  });
}

// ── 앱 모드 ────────────────────────────────────────────────────
// DB 초기화 → 마이그레이션 → 서비스 초기화 → 모듈 로드 → 서버 시작
async function startApp() {
  let services;

  if (env.DB_PROVIDER === 'postgres' && env.DATABASE_URL) {
    const db = await initDb();
    await runMigrations(db);
    services = await initServices(db);
    console.log('[fieldstack][api] DB initialized and migrations applied');
  } else if (env.DB_PROVIDER === 'sqlite') {
    const db = await initDb();
    await runMigrations(db);
    services = await initServices(db);
    console.log('[fieldstack][api] SQLite DB initialized and migrations applied');
  }

  let app;
  if (services) {
    const { getSharedLinkRenderer } = await import('@fieldstack/core');
    app = createAppWithPublicRouter(services, getSharedLinkRenderer);
  } else {
    // DB 없이 시작 (INSTALL_MODE=bypass, DB 미설정) — 헬스체크만 동작
    app = createApp();
  }

  // ── 모듈 라우터 마운트 ──────────────────────────────────────
  if (services) {
    const moduleEntries = await loadModulesFromDisk(MODULES_DIR);
    const manifests = await scanBackendModules(moduleEntries);

    const depIssues = validateModuleDependencies(manifests);
    if (depIssues.length > 0) {
      console.warn('[fieldstack][loader] dependency issues detected:');
      for (const issue of depIssues) {
        console.warn(
          `  - "${issue.moduleName}" missing: ${issue.missingDependencies.join(', ')}`,
        );
      }
    }

    const registrations = buildBackendRouteRegistrations(manifests);
    await mountModuleRouters(app, registrations, MODULES_DIR, services);
  }

  // ── Error handler (반드시 모든 라우트 등록 후 마지막) ────────
  finalizeApp(app);

  app.listen(env.PORT, () => {
    console.log(`[fieldstack][api] server listening on http://localhost:${env.PORT}`);
  });
}

// ── 진입점 ──────────────────────────────────────────────────────
const shouldSetup = !isInstalled() && env.INSTALL_MODE !== 'bypass';

const boot = shouldSetup ? startSetup : startApp;

boot().catch((err) => {
  console.error('[fieldstack][api] startup failed:', err);
  process.exit(1);
});
