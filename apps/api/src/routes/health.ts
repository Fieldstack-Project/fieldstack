import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    version: process.env['npm_package_version'] ?? '0.0.0',
    timestamp: new Date().toISOString(),
  });
});
