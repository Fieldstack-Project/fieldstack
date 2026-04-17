import path from 'node:path';

import { Router } from 'express';
import { z } from 'zod';

import type { AppServices } from '../app';
import { requireAuth } from '../middleware/require-auth';
import { ModuleRegistry, reloadModules } from '../module-registry';

// modules/ 디렉터리 위치: apps/api/src/routes → ../../../../modules
const MODULES_DIR = path.join(__dirname, '..', '..', '..', '..', 'modules');

// ── 라우터 팩토리 ──────────────────────────────────────────────

export function createCoreRouter(services: AppServices): Router {
  const router = Router();
  const auth = requireAuth(services.jwtManager);

  /**
   * GET /core/modules — 현재 등록된 모듈 목록 반환 (어드민 전용)
   *
   * 레지스트리에 실제로 로드된 모듈만 반환한다.
   * 설치는 됐지만 비활성화(enabled: false)된 모듈은 포함되지 않는다.
   */
  router.get('/modules', auth, (_req, res) => {
    const registry = ModuleRegistry.getInstance();
    const modules = registry.list().map((record) => ({
      name: record.name,
      basePath: record.basePath,
      version: record.manifest.version,
      dependencies: record.manifest.dependencies,
    }));
    res.json({ success: true, data: { modules } });
  });

  /**
   * POST /core/modules/reload — modules/ 디렉터리 재스캔 후 레지스트리 갱신 (어드민 전용)
   *
   * - 새로 추가된 모듈(module.json enabled: true): 레지스트리에 등록
   * - 삭제되거나 disabled된 모듈: 레지스트리에서 해제
   * - 이미 등록된 모듈: 변경 없음 (라우터 코드 핫리로드는 서버 재시작 필요)
   */
  router.post('/modules/reload', auth, async (_req, res) => {
    try {
      const { added, removed } = await reloadModules(MODULES_DIR, services);
      res.json({
        success: true,
        data: {
          added,
          removed,
          message: `모듈 갱신 완료. 추가: ${added.length}개, 해제: ${removed.length}개`,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // ── 유저별 모듈 활성화 API ─────────────────────────────────────

  /**
   * GET /core/modules/me — 현재 유저의 모듈 활성화 목록 반환
   *
   * user_modules 테이블에서 현재 유저의 레코드를 반환한다.
   * 레지스트리에 등록된 모듈 중 유저 레코드가 없는 항목은 기본 활성(enabled: true)으로 간주한다.
   */
  router.get('/modules/me', auth, async (req, res) => {
    // services에 db가 직접 노출되지 않으므로 core의 getDb() 싱글턴을 사용한다
    try {
      const { getDb } = await import('@fieldstack/core');
      const database = await getDb();

      type Row = { module_name: string; enabled: boolean };
      const rows = await database.query<Row>(
        'SELECT module_name, enabled FROM user_modules WHERE user_id = $1',
        [req.auth!.userId],
      );

      // 레지스트리 목록과 조합해 전체 모듈 상태를 반환
      const registry = ModuleRegistry.getInstance();
      const registryModules = registry.list();
      const userMap = new Map(rows.map((r) => [r.module_name, r.enabled]));

      const result = registryModules.map((mod) => ({
        name: mod.name,
        displayName: mod.manifest.displayName,
        basePath: mod.basePath,
        version: mod.manifest.version,
        // user_modules 레코드 없으면 기본 활성
        enabled: userMap.has(mod.name) ? userMap.get(mod.name) : true,
      }));

      res.json({ success: true, data: { modules: result } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * PATCH /core/modules/:name/toggle — 현재 유저의 모듈 활성화/비활성화 전환
   */
  router.patch('/modules/:name/toggle', auth, async (req, res) => {
    const { name } = req.params;

    try {
      const { getDb } = await import('@fieldstack/core');
      const database = await getDb();

      // 레지스트리에 등록된 모듈인지 확인
      const registry = ModuleRegistry.getInstance();
      const exists = registry.list().some((m) => m.name === name);
      if (!exists) {
        res.status(404).json({ success: false, error: `모듈 '${name}'이 레지스트리에 없습니다.` });
        return;
      }

      type Row = { enabled: boolean };
      const [current] = await database.query<Row>(
        'SELECT enabled FROM user_modules WHERE user_id = $1 AND module_name = $2',
        [req.auth!.userId, name],
      );

      // 레코드 없으면 기본 활성 → 비활성으로 삽입
      const newEnabled = current ? !current.enabled : false;

      await database.query(
        `INSERT INTO user_modules (user_id, module_name, enabled)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, module_name) DO UPDATE SET enabled = $3`,
        [req.auth!.userId, name, newEnabled],
      );

      res.json({ success: true, data: { name, enabled: newEnabled } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  /**
   * POST /core/modules/:name/install — 모듈 설치
   *
   * 레지스트리에 모듈을 등록하고 설치한 유저의 user_modules 레코드를 생성한다.
   * 현재는 modules/ 디렉터리에 이미 파일이 있어야 한다 (마켓플레이스 다운로드 미구현).
   */
  router.post('/modules/:name/install', auth, async (req, res) => {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.params);

    try {
      const { added } = await reloadModules(MODULES_DIR, services);
      const wasAdded = added.includes(name);

      if (!wasAdded) {
        // 이미 등록돼 있거나 파일이 없는 경우
        const registry = ModuleRegistry.getInstance();
        const alreadyExists = registry.list().some((m) => m.name === name);
        if (!alreadyExists) {
          res.status(404).json({
            success: false,
            error: `모듈 '${name}' 파일을 찾을 수 없습니다.`,
          });
          return;
        }
      }

      const { getDb } = await import('@fieldstack/core');
      const database = await getDb();

      // 설치한 유저의 레코드 생성 (이미 있으면 enabled: true로 업데이트)
      await database.query(
        `INSERT INTO user_modules (user_id, module_name, enabled)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (user_id, module_name) DO UPDATE SET enabled = TRUE`,
        [req.auth!.userId, name],
      );

      res.json({ success: true, data: { name, installed: true } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
