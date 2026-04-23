import 'dotenv/config';

import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

import { validateEnv } from './config/env';
import {
  createApp,
  createAppWithPublicRouter,
  createSetupApp,
  finalizeApp,
  initDb,
  initServices,
  runMigrations,
} from './app';
import { log } from './middleware/logger';
import {
  buildBackendRouteRegistrations,
  loadModulesFromDisk,
  scanBackendModules,
  validateModuleDependencies,
} from './loader';
import { loadModulesIntoRegistry } from './module-registry';
import { applyConfigToEnv, isInstalled } from './setup/mode';

// ── fieldstack.config.json → process.env 반영 (env vars 우선) ─
applyConfigToEnv();

// ── 환경변수 검증 (누락·오류 시 즉시 종료) ────────────────────
const env = validateEnv(process.env);

log.info('api', `bootstrap initialized — env: ${env.NODE_ENV}`);
// modules/ 디렉터리는 프로젝트 루트 기준 (apps/api/src → ../../../modules)
const MODULES_DIR = path.join(__dirname, '..', '..', '..', 'modules');

// ── 네트워크 인터페이스 IP 수집 ────────────────────────────────

function getLocalIPs(): string[] {
  const ips: string[] = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      // IPv4이고 루프백(127.x)이 아닌 것만
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

function printSetupBanner(apiPort: number, isDev: boolean) {
  const ips = getLocalIPs();
  // 개발 모드: Vite dev server(5173)가 프론트엔드를 서빙하므로 해당 포트를 안내
  // 프로덕션: API 서버가 직접 프론트엔드까지 서빙하므로 apiPort를 안내
  const frontendPort = isDev ? 5173 : apiPort;

  const lines = [
    '',
    '  ╔══════════════════════════════════════════════════════╗',
    '  ║         Fieldstack — 설치 마법사 모드               ║',
    '  ╠══════════════════════════════════════════════════════╣',
    '  ║  아래 주소 중 하나를 브라우저에서 열어 설치를       ║',
    '  ║  진행해 주세요.                                      ║',
    '  ╠══════════════════════════════════════════════════════╣',
    `  ║  로컬    →  http://localhost:${frontendPort}`.padEnd(56) + '║',
  ];
  for (const ip of ips) {
    lines.push(`  ║  네트워크 →  http://${ip}:${frontendPort}`.padEnd(56) + '║');
  }
  if (ips.length === 0) {
    lines.push('  ║  (네트워크 인터페이스를 감지하지 못했습니다)'.padEnd(56) + '║');
  }
  if (isDev) {
    lines.push('  ╠══════════════════════════════════════════════════════╣');
    lines.push(`  ║  API     →  http://localhost:${apiPort}  (dev only)`.padEnd(56) + '║');
  }
  lines.push('  ╚══════════════════════════════════════════════════════╝');
  lines.push('');
  for (const line of lines) {
    // 빈 줄은 스킵하고, 배너 각 줄도 동일한 공통 로그 포맷으로 남긴다.
    if (line.length > 0) {
      log.info('setup', line);
    }
  }
}

// ── Setup 모드 ─────────────────────────────────────────────────
// installed.lock 없을 때 → Setup 마법사만 서빙
async function startSetup() {
  log.warn('api', `SETUP MODE — installation wizard active`);
  const app = createSetupApp();
  finalizeApp(app);
  const server = http.createServer(app);
  server.listen(env.PORT, () => {
    printSetupBanner(env.PORT, env.NODE_ENV !== 'production');
  });
  process.once('SIGINT', () => { server.close(() => process.exit(0)); });
  process.once('SIGTERM', () => { server.close(() => process.exit(0)); });
}

// ── 앱 모드 ────────────────────────────────────────────────────
// DB 초기화 → 마이그레이션 → 서비스 초기화 → 모듈 로드 → 서버 시작
async function startApp() {
  let services: Awaited<ReturnType<typeof initServices>> | undefined;

  if (env.DB_PROVIDER === 'postgres' && env.DATABASE_URL) {
    log.info('db', `connecting (postgres)…`);
    const db = await initDb();
    log.info('db', `running migrations…`);
    await runMigrations(db);
    services = await initServices(db);
    log.success('db', `postgres ready`);
  } else if (env.DB_PROVIDER === 'sqlite') {
    log.info('db', `connecting (sqlite)…`);
    const db = await initDb();
    log.info('db', `running migrations…`);
    await runMigrations(db);
    services = await initServices(db);
    log.success('db', `sqlite ready`);
  }

  let app;
  if (services) {
    const { getSharedLinkRenderer } = await import('@fieldstack/core');
    app = createAppWithPublicRouter(services, getSharedLinkRenderer);
  } else {
    // DB 미설정 — 헬스체크만 동작
    app = createApp();
  }

  // ── 모듈 라우터 마운트 ──────────────────────────────────────
  if (services) {
    const moduleEntries = await loadModulesFromDisk(MODULES_DIR);
    const manifests = await scanBackendModules(moduleEntries);

    const depIssues = validateModuleDependencies(manifests);
    if (depIssues.length > 0) {
      log.warn('loader', `dependency issues detected`);
      for (const issue of depIssues) {
        log.warn('loader', `  "${issue.moduleName}" missing: ${issue.missingDependencies.join(', ')}`);
      }
    }

    const registrations = buildBackendRouteRegistrations(manifests);
    const enabledCount = manifests.filter((m) => m.enabled).length;
    log.info('loader', `loading ${enabledCount} module(s)…`);
    await loadModulesIntoRegistry(registrations, manifests, MODULES_DIR, services);
    log.success('loader', `${enabledCount} module(s) mounted`);
  }

  // ── Error handler (반드시 모든 라우트 등록 후 마지막) ────────
  finalizeApp(app);

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    log.success('api', `server ready → http://localhost:${env.PORT}`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────
  const shutdown = () => {
    log.info('api', `shutting down…`);
    if (services) {
      services.scheduler.stopAll();
    }
    server.close(() => {
      if (services) {
        services.db.disconnect().finally(() => process.exit(0));
      } else {
        process.exit(0);
      }
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

// ── 진입점 ──────────────────────────────────────────────────────
const shouldSetup = !isInstalled();

const boot = shouldSetup ? startSetup : startApp;

boot().catch((err) => {
  log.error('api', `startup failed`, err);
  process.exit(1);
});
