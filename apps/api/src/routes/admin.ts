import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../middleware/require-auth';
import { clearConfig, clearInstalled, scheduleRestart } from '../setup/mode';
import type { AppServices } from '../app';

// ── 입력 스키마 ───────────────────────────────────────────────

const ResetBody = z.object({
  pin: z.string().min(4),
});

const ChangePinBody = z.object({
  currentPin: z.string().min(4),
  newPin: z.string().min(4),
});

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

  return router;
}
