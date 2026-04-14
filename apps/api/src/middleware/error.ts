import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isDev = process.env['NODE_ENV'] === 'development';

  console.error('[fieldstack][api] unhandled error:', err);

  res.status(500).json({
    error: 'Internal server error',
    ...(isDev && { message: (err as Error).message }),
  });
};
