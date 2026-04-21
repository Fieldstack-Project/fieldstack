import type { NextFunction, Request, Response } from 'express';

// ── ANSI 색상 (개발 모드용) ────────────────────────────────────

const IS_DEV = process.env['NODE_ENV'] !== 'production';

const c = IS_DEV
  ? {
      reset: '\x1b[0m',
      dim: '\x1b[2m',
      bold: '\x1b[1m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      cyan: '\x1b[36m',
      magenta: '\x1b[35m',
      blue: '\x1b[34m',
      gray: '\x1b[90m',
    }
  : Object.fromEntries(
      ['reset', 'dim', 'bold', 'green', 'yellow', 'red', 'cyan', 'magenta', 'blue', 'gray'].map(
        (k) => [k, ''],
      ),
    );

// ── 타임스탬프 ────────────────────────────────────────────────

function ts(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

// ── 상태코드 → 색상 ───────────────────────────────────────────

function statusColor(status: number): string {
  if (status >= 500) return c['red'] as string;
  if (status >= 400) return c['yellow'] as string;
  if (status >= 300) return c['cyan'] as string;
  return c['green'] as string;
}

// ── HTTP 메서드 → 색상 ────────────────────────────────────────

function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return c['blue'] as string;
    case 'POST':
      return c['green'] as string;
    case 'PUT':
    case 'PATCH':
      return c['yellow'] as string;
    case 'DELETE':
      return c['red'] as string;
    default:
      return c['gray'] as string;
  }
}

// ── 스킵 경로 ────────────────────────────────────────────────
// health 체크는 매 30초마다 호출되어 로그를 오염시키므로 제외

const SKIP_PATHS = new Set(['/health', '/health/']);

// ── HTTP 요청 로거 미들웨어 ────────────────────────────────────

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_PATHS.has(req.path)) {
    next();
    return;
  }

  const start = Date.now();
  const method = req.method.padEnd(6);
  const path = req.path;
  const query = Object.keys(req.query).length > 0 ? `?${new URLSearchParams(req.query as Record<string, string>)}` : '';

  // 요청 수신 로그
  console.log(
    `${c['gray']}${ts()}${c['reset']} ${c['dim']}→${c['reset']} ${methodColor(req.method)}${method}${c['reset']} ${path}${c['dim']}${query}${c['reset']}`,
  );

  // 응답 완료 후 로그
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const durationStr = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

    console.log(
      `${c['gray']}${ts()}${c['reset']} ${c['dim']}←${c['reset']} ${statusColor(status)}${status}${c['reset']} ${methodColor(req.method)}${method}${c['reset']} ${path} ${c['dim']}(${durationStr})${c['reset']}`,
    );
  });

  next();
}

// ── 구조화 로그 헬퍼 ─────────────────────────────────────────
// 라우트에서 이벤트성 로그를 찍을 때 사용

export const log = {
  info(tag: string, msg: string, meta?: Record<string, unknown>): void {
    const metaStr = meta ? ` ${c['dim']}${JSON.stringify(meta)}${c['reset']}` : '';
    console.log(
      `${c['gray']}${ts()}${c['reset']} ${c['cyan']}[${tag}]${c['reset']} ${msg}${metaStr}`,
    );
  },

  warn(tag: string, msg: string, meta?: Record<string, unknown>): void {
    const metaStr = meta ? ` ${c['dim']}${JSON.stringify(meta)}${c['reset']}` : '';
    console.warn(
      `${c['gray']}${ts()}${c['reset']} ${c['yellow']}[${tag}]${c['reset']} ${c['yellow']}${msg}${c['reset']}${metaStr}`,
    );
  },

  error(tag: string, msg: string, err?: unknown): void {
    const errStr =
      err instanceof Error
        ? ` — ${err.message}${IS_DEV && err.stack ? `\n${c['dim']}${err.stack}${c['reset']}` : ''}`
        : err != null
          ? ` — ${String(err)}`
          : '';
    console.error(
      `${c['gray']}${ts()}${c['reset']} ${c['red']}[${tag}]${c['reset']} ${c['red']}${msg}${c['reset']}${errStr}`,
    );
  },

  success(tag: string, msg: string, meta?: Record<string, unknown>): void {
    const metaStr = meta ? ` ${c['dim']}${JSON.stringify(meta)}${c['reset']}` : '';
    console.log(
      `${c['gray']}${ts()}${c['reset']} ${c['green']}[${tag}]${c['reset']} ${c['green']}${msg}${c['reset']}${metaStr}`,
    );
  },
};
