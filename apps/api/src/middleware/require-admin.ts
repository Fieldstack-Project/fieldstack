import type { NextFunction, Request, Response } from 'express';

import type {
  JwtSessionManagerImpl,
  UserAuthService,
} from '@fieldstack/core' with { "resolution-mode": "import" };

import { requireAuth } from './require-auth';

/**
 * JWT 검증 후 DB에서 `is_admin` 플래그를 재확인한다.
 * JWT에 admin claim을 넣지 않고 매번 DB를 조회하는 이유:
 * - 토큰 발급 후 권한이 강등될 수 있고
 * - 관리자 라우트 호출 빈도는 낮아 DB 1회 조회 비용이 무시 가능
 */
export function requireAdmin(jwtManager: JwtSessionManagerImpl, userAuth: UserAuthService) {
  const auth = requireAuth(jwtManager);
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await auth(req, res, async () => {
      try {
        const isAdmin = await userAuth.isUserAdmin(req.auth!.userId);
        if (!isAdmin) {
          res.status(403).json({ success: false, error: 'Admin privilege required' });
          return;
        }
        next();
      } catch (err) {
        res.status(500).json({ success: false, error: (err as Error).message });
      }
    });
  };
}
