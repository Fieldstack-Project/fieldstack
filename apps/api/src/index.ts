import 'dotenv/config';

import { validateEnv } from './config/env';
import { createApp } from './app';

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

// ── 서버 시작 ─────────────────────────────────────────────────
const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[fieldstack][api] server listening on http://localhost:${env.PORT}`);
});
