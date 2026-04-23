import type { ErrorRequestHandler } from 'express';
import { formatLogLine } from '../logging/format';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isDev = process.env['NODE_ENV'] === 'development';

  const detail = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error(formatLogLine('api', `unhandled error: ${detail}`, 'error'));

  res.status(500).json({
    error: 'Internal server error',
    ...(isDev && { message: (err as Error).message }),
  });
};
