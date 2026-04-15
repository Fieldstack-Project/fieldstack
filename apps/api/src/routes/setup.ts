import path from 'node:path';

import { Router } from 'express';
import { z } from 'zod';

import {
  CONTAINER_NAME,
  getContainerStatus,
  isImagePulled,
  provisionPostgresContainer,
  pullDockerImage,
  waitForPostgres,
} from '../setup/docker';
import { markInstalled, scheduleRestart, writeConfig } from '../setup/mode';
import {
  detectAllRuntimes,
  provisionViaNative,
  provisionViaSystemd,
} from '../setup/runtime';

// ── 진행 이벤트 타입 ──────────────────────────────────────────

export type SetupStep =
  | 'db_connect'
  | 'db_migrate'
  | 'admin_create'
  | 'config_save'
  | 'lock_write'
  | 'restart';

interface ProgressEvent {
  step: SetupStep;
  status: 'running' | 'done' | 'error';
  message: string;
  error?: string;
}

// ── 입력 스키마 ───────────────────────────────────────────────

const DbTestBody = z.object({
  provider: z.enum(['postgres', 'sqlite']),
  url: z.string().optional(),
  sqlitePath: z.string().optional(),
});

const SetupCompleteBody = z.object({
  admin: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    pin: z.string().min(4).max(12),
  }),
  db: z.object({
    provider: z.enum(['postgres', 'sqlite']),
    url: z.string().optional(),
    sqlitePath: z.string().optional(),
  }),
  options: z
    .object({
      telemetry: z.boolean().default(false),
    })
    .optional(),
});

// ── DB 연결 헬퍼 (싱글턴 getDb() 를 우회, setup 전용 인스턴스) ──

async function openDb(config: z.infer<typeof DbTestBody>) {
  if (config.provider === 'postgres') {
    if (!config.url) throw new Error('PostgreSQL URL이 필요합니다.');
    const { PostgresProvider } = await import('@fieldstack/core');
    const db = new PostgresProvider({ connectionString: config.url });
    await db.connect();
    return db;
  } else {
    const { SqliteProvider } = await import('@fieldstack/core');
    const dbPath = config.sqlitePath ?? './data/database.db';
    const db = new SqliteProvider({ connectionString: dbPath });
    await db.connect();
    return db;
  }
}

// ── 라우터 팩토리 ──────────────────────────────────────────────

export function createSetupRouter(): Router {
  const router = Router();

  // GET /setup/status — 미설치 상태 응답 (설치 후엔 app.ts에서 installed:true 반환)
  router.get('/status', (_req, res) => {
    res.json({ success: true, data: { installed: false } });
  });

  // GET /setup/db/detect — 사용 가능한 DB 런타임 전체 감지 (Docker/systemd/native 병렬)
  router.get('/db/detect', async (_req, res) => {
    const runtimes = await detectAllRuntimes();
    // Docker 컨테이너 상태는 docker 런타임이 ready일 때만 조회
    const dockerRuntime = runtimes.find((r) => r.id === 'docker');
    const containerStatus =
      dockerRuntime?.status === 'ready' ? await getContainerStatus() : 'unknown';
    res.json({ success: true, data: { runtimes, dockerContainer: containerStatus } });
  });

  // POST /setup/db/provision — 런타임별 PostgreSQL 자동 프로비저닝 (SSE 스트리밍)
  // body: { runtime: 'docker' | 'systemd' | 'native' }
  router.post('/db/provision', async (req, res) => {
    const { runtime = 'docker' } = req.body as { runtime?: string };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    function emit(step: string, status: 'running' | 'done' | 'error', message: string, extra?: object) {
      res.write(`data: ${JSON.stringify({ step, status, message, ...extra })}\n\n`);
    }

    try {
      if (runtime === 'docker') {
        // ── Docker 프로비저닝 ──────────────────────────────────

        // 기존 컨테이너 확인
        emit('container', 'running', '기존 컨테이너를 확인하는 중...');
        const containerStatus = await getContainerStatus();
        if (containerStatus === 'running') {
          emit('container', 'error', `'${CONTAINER_NAME}' 컨테이너가 이미 실행 중입니다. 연결 URL을 직접 입력해주세요.`);
          res.end();
          return;
        }

        // 이미지 pull (최초 1회)
        const alreadyPulled = await isImagePulled();
        if (!alreadyPulled) {
          emit('pull', 'running', 'PostgreSQL 이미지를 다운로드하는 중입니다. 최초 실행 시 수 분이 소요될 수 있습니다.');
          await pullDockerImage((msg) => {
            const trimmed = msg.length > 80 ? msg.slice(0, 80) + '…' : msg;
            emit('pull', 'running', trimmed);
          });
        }
        emit('pull', 'done', 'PostgreSQL 이미지 준비 완료');

        // 컨테이너 생성 및 시작
        emit('container', 'running', 'PostgreSQL 컨테이너를 시작하는 중...');
        const { connectionUrl, port } = await provisionPostgresContainer();
        emit('container', 'done', `컨테이너 시작 완료 (포트 ${port})`);

        // 연결 준비 대기
        emit('ready', 'running', 'PostgreSQL 초기화 대기 중... (최대 60초)');
        await waitForPostgres(connectionUrl);
        emit('ready', 'done', '연결 준비 완료', { connectionUrl });
      } else if (runtime === 'systemd') {
        // ── systemd 프로비저닝 ────────────────────────────────
        // 감지 단계에서 이미 serviceName을 알고 있지만, 여기서는 재감지
        const { detectAllRuntimes: refresh } = await import('../setup/runtime.js');
        const runtimes = await refresh();
        const systemdInfo = runtimes.find((r: { id: string }) => r.id === 'systemd');
        const serviceName = (systemdInfo?.details['serviceName'] as string | undefined) ?? 'postgresql';

        emit('service', 'running', `systemctl start ${serviceName} 실행 중...`);
        const { connectionUrl, port } = await provisionViaSystemd(serviceName, (msg) => {
          emit('service', 'running', msg);
        });
        emit('service', 'done', `서비스 시작 및 DB 생성 완료 (포트 ${port})`);
        emit('ready', 'done', '연결 준비 완료', { connectionUrl });
      } else if (runtime === 'native') {
        // ── Native 프로비저닝 ────────────────────────────────
        emit('native', 'running', '로컬 PostgreSQL에서 DB와 사용자를 생성하는 중...');
        const { connectionUrl, port } = await provisionViaNative((msg) => {
          emit('native', 'running', msg);
        });
        emit('native', 'done', `완료 (포트 ${port})`);
        emit('ready', 'done', '연결 준비 완료', { connectionUrl });
      } else {
        emit('error', 'error', `알 수 없는 런타임: ${runtime}`);
      }

      res.end();
    } catch (err) {
      emit('error', 'error', '자동 설치 중 오류가 발생했습니다.', {
        error: (err as Error).message,
      });
      res.end();
    }
  });

  // POST /setup/db/test — DB 연결 테스트
  router.post('/db/test', async (req, res) => {
    const parsed = DbTestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    try {
      const db = await openDb(parsed.data);
      await db.disconnect();
      res.json({ success: true, data: { connected: true } });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  });

  // POST /setup/complete — 설치 완료 (Server-Sent Events 스트리밍)
  router.post('/complete', async (req, res) => {
    const parsed = SetupCompleteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.flatten() });
      return;
    }

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let currentStep: SetupStep = 'db_connect';

    function emit(event: ProgressEvent) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const { admin, db: dbConfig } = parsed.data;

    try {
      // 1. DB 연결
      currentStep = 'db_connect';
      emit({ step: 'db_connect', status: 'running', message: 'DB에 연결하는 중...' });
      const db = await openDb(dbConfig);
      emit({ step: 'db_connect', status: 'done', message: 'DB 연결 완료' });

      // 2. 마이그레이션
      currentStep = 'db_migrate';
      emit({ step: 'db_migrate', status: 'running', message: '마이그레이션을 적용하는 중...' });
      const { FileMigrationRunner } = await import('@fieldstack/core');
      // __dirname: apps/api/src/routes → ../db/migrations/core
      const coreDir = path.join(__dirname, '..', 'db', 'migrations', 'core');
      const runner = new FileMigrationRunner(db, 'core', coreDir);
      await runner.run();
      emit({ step: 'db_migrate', status: 'done', message: '마이그레이션 완료' });

      // 3. 관리자 계정 생성
      currentStep = 'admin_create';
      emit({ step: 'admin_create', status: 'running', message: '관리자 계정을 생성하는 중...' });
      const {
        UserAuthService,
        JwtSessionManagerImpl,
        WhitelistServiceImpl,
        TotpServiceImpl,
        AdminPinServiceImpl,
      } = await import('@fieldstack/core');

      // Setup 전용 임시 JWT 시크릿 (토큰 발급 용도가 아니므로 무방)
      const jwtManager = new JwtSessionManagerImpl(db, 'setup-temp', 'setup-temp-refresh');
      const whitelist = new WhitelistServiceImpl(db);
      const totp = new TotpServiceImpl(db, 'Fieldstack');
      const userAuth = new UserAuthService(db, jwtManager, whitelist, totp);
      const adminPin = new AdminPinServiceImpl(db);

      await userAuth.createUser(admin.email, admin.password, false);
      // 관리자 이메일을 화이트리스트에 추가 (rules가 1개라도 있으면 체크됨)
      await whitelist.addRule({ type: 'email', value: admin.email, enabled: true });
      // 관리자 PIN 설정
      await adminPin.setPin(admin.pin);

      emit({ step: 'admin_create', status: 'done', message: '관리자 계정 생성 완료' });

      // 4. Config 파일 저장
      currentStep = 'config_save';
      emit({ step: 'config_save', status: 'running', message: '설정을 저장하는 중...' });
      writeConfig({
        db: {
          provider: dbConfig.provider,
          url: dbConfig.url,
          sqlitePath: dbConfig.sqlitePath,
        },
        installedAt: new Date().toISOString(),
      });
      await db.disconnect();
      emit({ step: 'config_save', status: 'done', message: '설정 저장 완료' });

      // 5. Lock 파일 생성
      currentStep = 'lock_write';
      emit({ step: 'lock_write', status: 'running', message: '설치를 마무리하는 중...' });
      markInstalled();
      emit({ step: 'lock_write', status: 'done', message: '설치 완료' });

      // 6. 재시작 알림 후 프로세스 종료
      currentStep = 'restart';
      emit({
        step: 'restart',
        status: 'done',
        message: '서버를 재시작합니다. 잠시 후 로그인 페이지로 이동하세요.',
      });
      res.end();

      scheduleRestart();
    } catch (err) {
      emit({
        step: currentStep,
        status: 'error',
        message: '설치 중 오류가 발생했습니다.',
        error: (err as Error).message,
      });
      res.end();
    }
  });

  return router;
}
