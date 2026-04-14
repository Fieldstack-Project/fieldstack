import express from 'express';
import cors from 'cors';

import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/error';

export function createApp() {
  const app = express();

  // ── Middleware ────────────────────────────────────────────────
  // 개발: 모든 origin 허용 / 프로덕션: 단일 포트 통합 서빙이므로 CORS 불필요
  if (process.env['NODE_ENV'] !== 'production') {
    app.use(cors());
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Core routes ───────────────────────────────────────────────
  app.use('/health', healthRouter);

  // TODO(Phase 1.9.3): 인증 라우트 마운트 (POST /auth/login 등)
  // TODO(Phase 1.9.2): 모듈 라우트 마운트 (DB 초기화 완료 후)

  // ── Error handler (반드시 마지막) ─────────────────────────────
  app.use(errorHandler);

  return app;
}

// ── DB 초기화 (서버 시작 시 호출) ────────────────────────────

export async function initDb(): Promise<void> {
  const { getDb } = await import('@fieldstack/core');
  await getDb();
}
