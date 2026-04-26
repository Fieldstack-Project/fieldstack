import { Router } from 'express';
import { z } from 'zod';

import { requireAdmin } from '../middleware/require-admin';
import { requireAuth } from '../middleware/require-auth';
import { clearConfig, clearInstalled, scheduleRestart } from '../setup/mode';
import { tunnelManager } from '../tunnel/cloudflare-tunnel';
import type { AppServices } from '../app';

// ── 입력 스키마 ───────────────────────────────────────────────

const ResetBody = z.object({
  pin: z.string().min(4),
});

const ChangePinBody = z.object({
  currentPin: z.string().min(4),
  newPin: z.string().min(4),
});

const CreateUserBody = z.object({
  email: z.string().email(),
  isAdmin: z.boolean().optional(),
  addToWhitelist: z.boolean().optional(),
});

const PatchUserBody = z
  .object({
    isActive: z.boolean().optional(),
    isAdmin: z.boolean().optional(),
  })
  .refine((d) => d.isActive !== undefined || d.isAdmin !== undefined, {
    message: 'At least one of isActive or isAdmin is required',
  });

const DeleteUserBody = z.object({
  pin: z.string().min(4),
});

const WhitelistAddBody = z.object({
  type: z.enum(['email', 'domain']),
  value: z.string().min(1),
  enabled: z.boolean().optional(),
});

const WhitelistPatchBody = z.object({
  enabled: z.boolean(),
});

const UuidParam = z.string().uuid();

// ── 완전 초기화: 삭제할 테이블 목록 (FK 의존성 역순) ──────────

const ALL_TABLES = [
  'shared_link_logs',
  'shared_links',
  'system_settings',
  'password_recovery_tokens',
  'totp_challenges',
  'totp_credentials',
  'sessions',
  'whitelist_rules',
  'admin_pin',
  'users',
  '_migrations',
];

// ── 부분 초기화: 데이터 테이블만 삭제 (계정·설정 유지) ──────────

const DATA_TABLES = ['shared_link_logs', 'shared_links'];

// ── 라우터 팩토리 ──────────────────────────────────────────────

export function createAdminRouter(services: AppServices): Router {
  const router = Router();
  const adminGuard = requireAdmin(services.jwtManager, services.userAuth);

  // ── 사용자 관리 ─────────────────────────────────────────────

  /** GET /admin/users — 사용자 목록 */
  router.get('/users', adminGuard, async (_req, res) => {
    try {
      const users = await services.userAuth.listUsers();
      res.json({ success: true, data: { users } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /admin/users — 사용자 생성 + 일회용 초대 토큰 발급
   *
   * 응답의 `inviteToken`은 1회만 표시한다.
   * 사용자는 ForgotPasswordView 토큰 경로로 비밀번호를 직접 설정한다.
   */
  router.post('/users', adminGuard, async (req, res) => {
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const { email, isAdmin = false, addToWhitelist = false } = parsed.data;

    try {
      const existing = await services.userAuth.findUserIdByEmail(email);
      if (existing) {
        res.status(409).json({ success: false, error: '이미 존재하는 이메일입니다.' });
        return;
      }

      const { userId, inviteToken } = await services.userAuth.createUserWithInvite(email, isAdmin);

      if (addToWhitelist) {
        // 활성 룰이 하나라도 있으면 화이트리스트가 강제 적용되므로,
        // 새 사용자가 즉시 로그인할 수 있도록 룰을 추가한다.
        await services.whitelist.addRule({ type: 'email', value: email, enabled: true });
      }

      res.json({
        success: true,
        data: { userId, email, inviteToken, adminToken: inviteToken, expiresInMinutes: 30 },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** PATCH /admin/users/:id — 활성/관리자 토글 */
  router.patch('/users/:id', adminGuard, async (req, res) => {
    const idParse = UuidParam.safeParse(req.params['id']);
    if (!idParse.success) {
      res.status(400).json({ success: false, error: 'Invalid user id' });
      return;
    }
    const parsed = PatchUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const targetId = idParse.data;
    const requesterId = req.auth!.userId;
    const { isActive, isAdmin } = parsed.data;

    try {
      // 자기 자신 보호 — 강등/비활성으로 락아웃되는 사고 방지
      if (targetId === requesterId) {
        if (isActive === false) {
          res.status(400).json({ success: false, error: '본인 계정은 비활성화할 수 없습니다.' });
          return;
        }
        if (isAdmin === false) {
          res.status(400).json({ success: false, error: '본인의 관리자 권한은 해제할 수 없습니다.' });
          return;
        }
      }

      // 마지막 활성 관리자 보호
      if (isAdmin === false || isActive === false) {
        const adminCount = await services.userAuth.countAdmins();
        const targetIsAdmin = await services.userAuth.isUserAdmin(targetId);
        if (targetIsAdmin && adminCount <= 1) {
          res.status(400).json({
            success: false,
            error: '마지막 관리자는 강등하거나 비활성화할 수 없습니다.',
          });
          return;
        }
      }

      if (isActive !== undefined) {
        await services.userAuth.setUserActive(targetId, isActive);
      }
      if (isAdmin !== undefined) {
        await services.userAuth.setUserAdmin(targetId, isAdmin);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** POST /admin/users/:id/invite — 초대/복구 토큰 재발급 */
  router.post('/users/:id/invite', adminGuard, async (req, res) => {
    const idParse = UuidParam.safeParse(req.params['id']);
    if (!idParse.success) {
      res.status(400).json({ success: false, error: 'Invalid user id' });
      return;
    }

    try {
      const { adminToken } = await services.userAuth.issueRecoveryToken(idParse.data);
      res.json({ success: true, data: { inviteToken: adminToken, adminToken, expiresInMinutes: 30 } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** DELETE /admin/users/:id — 사용자 삭제 (PIN 재확인 필수) */
  router.delete('/users/:id', adminGuard, async (req, res) => {
    const idParse = UuidParam.safeParse(req.params['id']);
    if (!idParse.success) {
      res.status(400).json({ success: false, error: 'Invalid user id' });
      return;
    }
    const parsed = DeleteUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const targetId = idParse.data;
    const requesterId = req.auth!.userId;

    try {
      const pinOk = await services.adminPin.verifyPin(parsed.data.pin);
      if (!pinOk) {
        res.status(403).json({ success: false, error: 'PIN이 올바르지 않습니다.' });
        return;
      }

      if (targetId === requesterId) {
        res.status(400).json({ success: false, error: '본인 계정은 삭제할 수 없습니다.' });
        return;
      }

      const targetIsAdmin = await services.userAuth.isUserAdmin(targetId);
      if (targetIsAdmin) {
        const adminCount = await services.userAuth.countAdmins();
        if (adminCount <= 1) {
          res.status(400).json({
            success: false,
            error: '마지막 관리자는 삭제할 수 없습니다.',
          });
          return;
        }
      }

      await services.userAuth.deleteUser(targetId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ── Whitelist 관리 ──────────────────────────────────────────

  /** GET /admin/whitelist — 룰 목록 */
  router.get('/whitelist', adminGuard, async (_req, res) => {
    try {
      const rules = await services.whitelist.listRules();
      res.json({ success: true, data: { rules } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** POST /admin/whitelist — 룰 추가 */
  router.post('/whitelist', adminGuard, async (req, res) => {
    const parsed = WhitelistAddBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }
    try {
      const rule = await services.whitelist.addRule({
        type: parsed.data.type,
        value: parsed.data.value,
        enabled: parsed.data.enabled ?? true,
      });
      res.json({ success: true, data: { rule } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** PATCH /admin/whitelist/:id — enabled 토글 */
  router.patch('/whitelist/:id', adminGuard, async (req, res) => {
    const idParse = UuidParam.safeParse(req.params['id']);
    if (!idParse.success) {
      res.status(400).json({ success: false, error: 'Invalid rule id' });
      return;
    }
    const parsed = WhitelistPatchBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }
    try {
      await services.whitelist.setEnabled(idParse.data, parsed.data.enabled);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** DELETE /admin/whitelist/:id — 룰 삭제 */
  router.delete('/whitelist/:id', adminGuard, async (req, res) => {
    const idParse = UuidParam.safeParse(req.params['id']);
    if (!idParse.success) {
      res.status(400).json({ success: false, error: 'Invalid rule id' });
      return;
    }
    try {
      await services.whitelist.removeRule(idParse.data);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /admin/change-pin — 관리자 PIN 변경
   *
   * 현재 PIN 검증 후 새 PIN으로 교체한다.
   * rotatePin()이 내부에서 현재 PIN 검증 + setPin을 원자적으로 처리한다.
   */
  router.post('/change-pin', requireAuth(services.jwtManager), async (req, res) => {
    const parsed = ChangePinBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      await services.adminPin.rotatePin(parsed.data.currentPin, parsed.data.newPin);
      res.json({ success: true });
    } catch (err) {
      const msg = (err as Error).message;
      const status = msg.includes('incorrect') ? 403 : 500;
      res.status(status).json({ success: false, error: msg });
    }
  });

  /**
   * POST /admin/verify-pin — 관리자 PIN 단독 검증
   *
   * 프론트엔드 AdminPinModal에서 PIN 인증 전용으로 호출한다.
   * 성공 시 { success: true }만 반환하며 세션/토큰을 별도로 발급하지 않는다.
   * 실제 인가는 각 관리자 액션 API에서 PIN을 재검증한다.
   */
  router.post('/verify-pin', requireAuth(services.jwtManager), async (req, res) => {
    const parsed = ResetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    const pinOk = await services.adminPin.verifyPin(parsed.data.pin);
    if (!pinOk) {
      res.status(403).json({ success: false, error: 'PIN이 올바르지 않습니다.' });
      return;
    }

    res.json({ success: true });
  });

  /**
   * POST /admin/factory-reset — 완전 초기화
   *
   * 모든 테이블 삭제 → installed.lock + fieldstack.config.json 제거
   * → 서버 재시작 → Setup 모드로 복귀
   *
   * 필수: JWT 인증 + 관리자 PIN
   */
  router.post('/factory-reset', requireAuth(services.jwtManager), async (req, res) => {
    const parsed = ResetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    // PIN 검증
    const pinOk = await services.adminPin.verifyPin(parsed.data.pin);
    if (!pinOk) {
      res.status(403).json({ success: false, error: 'PIN이 올바르지 않습니다.' });
      return;
    }

    try {
      const { getDb } = await import('@fieldstack/core');
      const db = await getDb();

      // 모든 테이블 삭제 — 오류가 나도 나머지 계속 진행
      for (const table of ALL_TABLES) {
        try {
          await db.query(`DROP TABLE IF EXISTS "${table}"`);
        } catch {
          // 테이블 부재 또는 권한 문제 → 무시하고 다음 테이블로
        }
      }

      // lock + config 삭제 → Setup 모드로 복귀
      clearInstalled();
      clearConfig();

      res.json({ success: true, data: { message: '완전 초기화 완료. 서버가 재시작됩니다.' } });

      // 응답 전송 후 재시작 (클라이언트가 응답을 받을 시간 확보)
      scheduleRestart(800);
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /admin/partial-reset — 부분 초기화
   *
   * 공유 링크 등 데이터 테이블만 삭제.
   * 사용자 계정·화이트리스트·관리자 PIN·시스템 설정은 유지.
   * installed.lock은 유지되므로 앱 모드가 그대로 계속된다.
   *
   * 필수: JWT 인증 + 관리자 PIN
   */
  router.post('/partial-reset', requireAuth(services.jwtManager), async (req, res) => {
    const parsed = ResetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    // PIN 검증
    const pinOk = await services.adminPin.verifyPin(parsed.data.pin);
    if (!pinOk) {
      res.status(403).json({ success: false, error: 'PIN이 올바르지 않습니다.' });
      return;
    }

    try {
      const { getDb } = await import('@fieldstack/core');
      const db = await getDb();

      // 데이터 테이블만 비움 — 계정·설정 테이블은 건드리지 않음
      for (const table of DATA_TABLES) {
        try {
          await db.query(`DELETE FROM "${table}"`);
        } catch {
          // 테이블이 없으면 무시
        }
      }

      res.json({ success: true, data: { message: '부분 초기화 완료.' } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ── Cloudflare Tunnel ─────────────────────────────────────────

  /** GET /admin/tunnel/status */
  router.get('/tunnel/status', requireAuth(services.jwtManager), (_req, res) => {
    res.json({ success: true, data: tunnelManager.status });
  });

  /** GET /admin/tunnel/config */
  router.get('/tunnel/config', requireAuth(services.jwtManager), (_req, res) => {
    res.json({ success: true, data: tunnelManager.getConfig() });
  });

  /** PUT /admin/tunnel/config */
  const TunnelConfigBody = z.object({
    mode: z.enum(['quick', 'named']),
    token: z.string(),
  });

  router.put('/tunnel/config', requireAuth(services.jwtManager), (req, res) => {
    const parsed = TunnelConfigBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }
    tunnelManager.setConfig(parsed.data);
    res.json({ success: true });
  });

  /** POST /admin/tunnel/start */
  router.post('/tunnel/start', requireAuth(services.jwtManager), async (_req, res) => {
    try {
      const { url } = await tunnelManager.start();
      res.json({ success: true, data: { url } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /** POST /admin/tunnel/stop */
  router.post('/tunnel/stop', requireAuth(services.jwtManager), (_req, res) => {
    try {
      tunnelManager.stop();
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
