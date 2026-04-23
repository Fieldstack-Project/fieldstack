import type { NextFunction, Request, Response } from 'express';

import { LOG_COLORS, formatLogLine } from '../logging/format';

// ── 스킵 경로 ────────────────────────────────────────────────
// health 체크는 매 30초마다 호출되어 로그를 오염시키므로 제외

const SKIP_PATHS = new Set(['/health', '/health/']);

// ── 상태코드 → 색상 ───────────────────────────────────────────

function statusColor(status: number): string {
  if (status >= 500) return LOG_COLORS.red;
  if (status >= 400) return LOG_COLORS.yellow;
  if (status >= 300) return LOG_COLORS.cyan;
  return LOG_COLORS.green;
}

// ── HTTP 메서드 → 색상 ────────────────────────────────────────

function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return LOG_COLORS.blue;
    case 'POST':
      return LOG_COLORS.green;
    case 'PUT':
    case 'PATCH':
      return LOG_COLORS.yellow;
    case 'DELETE':
      return LOG_COLORS.red;
    default:
      return LOG_COLORS.gray;
  }
}

// ── HTTP 요청 로거 미들웨어 ────────────────────────────────────

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_PATHS.has(req.path)) {
    next();
    return;
  }

  const start = Date.now();
  const method = req.method.toUpperCase().padEnd(6);
  const path = req.path;
  const query = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query as Record<string, string>)}` : '';
  // 메서드/쿼리 문자열은 메시지 본문에서만 색상을 주고,
  // 공통 포맷(formatLogLine)의 timestamp/tag 포맷은 그대로 유지한다.
  const methodStyled = `${methodColor(req.method)}${method}${LOG_COLORS.reset}`;
  const queryStyled = query.length > 0 ? `${LOG_COLORS.dim}${query}${LOG_COLORS.reset}` : '';

  // 요청 수신 로그
  console.log(formatLogLine('http', `${LOG_COLORS.dim}→${LOG_COLORS.reset} ${methodStyled} ${path}${queryStyled}`));

  // 응답 완료 후 로그
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const durationStr = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

    const statusStyled = `${statusColor(status)}${status}${LOG_COLORS.reset}`;
    console.log(
      formatLogLine(
        'http',
        `${LOG_COLORS.dim}←${LOG_COLORS.reset} ${statusStyled} ${methodStyled} ${path} ${LOG_COLORS.dim}(${durationStr})${LOG_COLORS.reset}`,
      ),
    );
  });

  next();
}

// ── 구조화 로그 헬퍼 ─────────────────────────────────────────
// 라우트에서 이벤트성 로그를 찍을 때 사용

export const log = {
  info(tag: string, msg: string, meta?: Record<string, unknown>): void {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(formatLogLine(tag, `${msg}${metaStr}`, 'info'));
  },

  warn(tag: string, msg: string, meta?: Record<string, unknown>): void {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.warn(formatLogLine(tag, `${msg}${metaStr}`, 'warn'));
  },

  error(tag: string, msg: string, err?: unknown): void {
    const errStr = err == null
      ? ''
      : err instanceof Error
        ? ` — ${err.stack ?? err.message}`
        : ` — ${String(err)}`;
    console.error(formatLogLine(tag, `${msg}${errStr}`, 'error'));
  },

  success(tag: string, msg: string, meta?: Record<string, unknown>): void {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(formatLogLine(tag, `${msg}${metaStr}`, 'success'));
  },
};
