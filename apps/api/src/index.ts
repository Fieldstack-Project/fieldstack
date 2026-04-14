import 'dotenv/config';

import { validateEnv } from './config/env';
import { createApp, createAppWithPublicRouter, initDb, initServices, runMigrations } from './app';

// ── 환경변수 검증 (누락·오류 시 즉시 종료) ────────────────────
const env = validateEnv(process.env);

// ── Install mode ──────────────────────────────────────────────
const BOOTSTRAP_MESSAGE = 'Fieldstack API bootstrap initialized';

console.log(BOOTSTRAP_MESSAGE);
console.log(`[fieldstack][api] env: ${env.NODE_ENV}`);
console.log(`[fieldstack][api] install mode: ${env.INSTALL_MODE ?? 'normal'}`);

if (env.INSTALL_MODE === 'bypass') {
  console.warn('[fieldstack][api] DEV INSTALL BYPASS ACTIVE');
}

// ── DB 초기화 → 마이그레이션 → 서비스 초기화 → 서버 시작 ─────
async function start() {
  let services;

  if (env.DB_PROVIDER === 'postgres' && env.DATABASE_URL) {
    const db = await initDb();
    await runMigrations(db);
    services = await initServices(db);
    console.log('[fieldstack][api] DB initialized and migrations applied');
  }

  let app;
  if (services) {
    const { getSharedLinkRenderer } = await import('@fieldstack/core');
    app = createAppWithPublicRouter(services, getSharedLinkRenderer);
  } else {
    // DB 없이 시작 (INSTALL_MODE=bypass 등) — 헬스체크만 동작
    app = createApp();
  }
  app.listen(env.PORT, () => {
    console.log(`[fieldstack][api] server listening on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('[fieldstack][api] startup failed:', err);
  process.exit(1);
});
