import { Router } from 'express';
import { z } from 'zod';

import type {
  AdminPinServiceImpl,
  JwtSessionManagerImpl,
  TotpServiceImpl,
  UserAuthService,
  WhitelistServiceImpl,
} from '@fieldstack/core' with { "resolution-mode": "import" };

import { log } from '../middleware/logger';
import { requireAuth } from '../middleware/require-auth';

// ── Zod 입력 스키마 ────────────────────────────────────────────

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const TotpVerifyBody = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

const PinVerifyBody = z.object({
  pin: z.string().min(4).max(12),
});

const PasswordChangeBody = z.object({
  newPassword: z.string().min(8),
});

const RecoveryIssueBody = z.object({
  userId: z.string().uuid(),
  adminPin: z.string().min(1),
});

const RecoveryConfirmBody = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const RefreshBody = z.object({
  refreshToken: z.string().min(1),
});

// ── 라우터 팩토리 ──────────────────────────────────────────────

export interface AuthRouterDeps {
  userAuth: UserAuthService;
  jwtManager: JwtSessionManagerImpl;
  whitelist: WhitelistServiceImpl;
  adminPin: AdminPinServiceImpl;
  totpService: TotpServiceImpl;
}

export function createAuthRouter(deps: AuthRouterDeps): Router {
  const router = Router();
  // whitelist는 userAuth 내부에서 사용되므로 여기서 직접 참조 불필요
  const { userAuth, jwtManager, adminPin, totpService } = deps;
  const auth = requireAuth(jwtManager);

  // POST /auth/login
  // 응답 data.type === 'session' → 즉시 로그인 완료
  // 응답 data.type === 'totp_required' → challengeId를 가지고 /auth/totp/verify 호출 필요
  router.post('/login', async (req, res) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      const result = await userAuth.login(parsed.data.email, parsed.data.password);
      if (result.type === 'session') {
        log.success('auth', `login success`, { email: parsed.data.email });
      } else {
        log.info('auth', `login → TOTP required`, { email: parsed.data.email });
      }
      res.json({ success: true, data: result });
    } catch (err) {
      log.warn('auth', `login failed`, { email: parsed.data.email, reason: (err as Error).message });
      res.status(401).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /auth/totp/verify — TOTP 챌린지 완료 후 세션 발급
  router.post('/totp/verify', async (req, res) => {
    const parsed = TotpVerifyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      const result = await userAuth.completeTotpLogin(parsed.data.challengeId, parsed.data.code);
      log.success('auth', `TOTP verified — session issued`, { challengeId: parsed.data.challengeId });
      res.json({ success: true, data: result });
    } catch (err) {
      log.warn('auth', `TOTP verify failed`, { challengeId: parsed.data.challengeId, reason: (err as Error).message });
      res.status(401).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /auth/pin/verify — 관리자 PIN 검증 (세션 불필요, PIN 자체가 인증)
  router.post('/pin/verify', async (req, res) => {
    const parsed = PinVerifyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      const valid = await adminPin.verifyPin(parsed.data.pin);
      if (!valid) {
        res.status(401).json({ success: false, error: 'Invalid PIN' });
        return;
      }
      res.json({ success: true, data: { verified: true } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /auth/password/change — 임시 비밀번호 강제 변경 (인증 필요)
  router.post('/password/change', auth, async (req, res) => {
    const parsed = PasswordChangeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      await userAuth.changePassword(req.auth!.userId, parsed.data.newPassword);
      res.json({ success: true, data: { changed: true } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /auth/password/recovery/issue — 관리자가 복구 토큰 발급
  router.post('/password/recovery/issue', async (req, res) => {
    const parsed = RecoveryIssueBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      const pinValid = await adminPin.verifyPin(parsed.data.adminPin);
      if (!pinValid) {
        res.status(401).json({ success: false, error: 'Invalid admin PIN' });
        return;
      }
      const result = await userAuth.issueRecoveryToken(parsed.data.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /auth/password/recovery/confirm — 복구 토큰으로 비밀번호 재설정
  router.post('/password/recovery/confirm', async (req, res) => {
    const parsed = RecoveryConfirmBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      await userAuth.consumeRecoveryToken(parsed.data.token, parsed.data.newPassword);
      res.json({ success: true, data: { reset: true } });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /auth/refresh — 리프레시 토큰 회전
  router.post('/refresh', async (req, res) => {
    const parsed = RefreshBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      const tokens = await jwtManager.rotateRefreshToken(parsed.data.refreshToken);
      log.info('auth', `token refreshed`);
      res.json({ success: true, data: tokens });
    } catch (err) {
      log.warn('auth', `token refresh failed`, { reason: (err as Error).message });
      res.status(401).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /auth/logout — 세션 폐기 (인증 필요)
  router.post('/logout', auth, async (req, res) => {
    try {
      await jwtManager.revokeSession(req.auth!.sessionId);
      log.info('auth', `logout`, { userId: req.auth!.userId });
      res.json({ success: true, data: { loggedOut: true } });
    } catch (err) {
      log.error('auth', `logout failed`, err);
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /auth/totp/enroll — TOTP 등록 시작 (인증 필요)
  router.post('/totp/enroll', auth, async (req, res) => {
    try {
      const session = await totpService.startEnrollment(req.auth!.userId);
      res.json({ success: true, data: session });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /auth/totp/confirm — TOTP 등록 확인 (인증 필요)
  router.post('/totp/confirm', auth, async (req, res) => {
    const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      const ok = await totpService.confirmEnrollment(req.auth!.userId, parsed.data.code);
      if (!ok) {
        res.status(400).json({ success: false, error: 'Invalid OTP code' });
        return;
      }
      res.json({ success: true, data: { enrolled: true } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
