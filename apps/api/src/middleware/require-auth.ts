import type { NextFunction, Request, Response } from 'express';

import type { JwtSessionManagerImpl } from '@fieldstack/core' with { "resolution-mode": "import" };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; sessionId: string };
    }
  }
}

export function requireAuth(jwtManager: JwtSessionManagerImpl) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const token = header.slice(7);
      req.auth = await jwtManager.verifyAccessToken(token);
      next();
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  };
}
