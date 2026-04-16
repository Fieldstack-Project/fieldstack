/**
 * DB 런타임 감지 모듈
 *
 * Fieldstack은 Docker, systemd, native PostgreSQL 3가지 런타임을 감지하여
 * 사용 가능한 자동 프로비저닝 경로를 Setup UI에 제공한다.
 *
 * │ 런타임   │ 자동 프로비저닝 │ 설명                                      │
 * │ docker   │ ✅ 완전 자동    │ 컨테이너 생성까지 처리                     │
 * │ systemd  │ ⚡ 서비스 시작  │ 이미 설치된 PostgreSQL 서비스만 기동        │
 * │ native   │ ℹ️ 안내만      │ 이미 실행 중인 경우 URL 자동 감지 시도     │
 */

import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const execAsync = promisify(execFile);

// ── 공통 타입 ─────────────────────────────────────────────────

export type RuntimeId = 'docker' | 'systemd' | 'native';
export type RuntimeStatus = 'ready' | 'installed_not_running' | 'not_installed';

export interface RuntimeOption {
  id: RuntimeId;
  label: string;
  description: string;
  status: RuntimeStatus;
  /** Setup UI에서 "자동 설치" 버튼을 활성화할 수 있는지 */
  canAutoProvision: boolean;
  details: Record<string, unknown>;
}

// ── Docker 감지 ───────────────────────────────────────────────

async function detectDocker(): Promise<RuntimeOption> {
  try {
    const { stdout } = await execAsync('docker', ['--version'], { timeout: 5000 });
    const version = stdout.trim();

    try {
      await execAsync('docker', ['info'], { timeout: 5000 });
      return {
        id: 'docker',
        label: 'Docker',
        description: 'PostgreSQL 컨테이너를 자동으로 생성하고 시작합니다.',
        status: 'ready',
        canAutoProvision: true,
        details: { version },
      };
    } catch {
      return {
        id: 'docker',
        label: 'Docker',
        description: 'Docker가 설치되어 있지만 데몬이 실행 중이지 않습니다.',
        status: 'installed_not_running',
        canAutoProvision: false,
        details: { version, hint: 'Docker Desktop을 시작해주세요.' },
      };
    }
  } catch {
    return {
      id: 'docker',
      label: 'Docker',
      description: 'Docker가 설치되어 있지 않습니다.',
      status: 'not_installed',
      canAutoProvision: false,
      details: {},
    };
  }
}

// ── systemd 감지 ──────────────────────────────────────────────

// 시스템 배포판에 따라 서비스 이름이 다름
const SYSTEMD_SERVICE_CANDIDATES = [
  'postgresql',
  'postgresql-17',
  'postgresql-16',
  'postgresql-15',
  'postgresql-14',
];

interface SystemdInfo {
  available: boolean;
  serviceName?: string;
  running: boolean;
}

async function detectSystemdPostgres(): Promise<SystemdInfo> {
  // systemctl 존재 여부 확인
  try {
    await execAsync('systemctl', ['--version'], { timeout: 3000 });
  } catch {
    return { available: false, running: false };
  }

  // PostgreSQL 서비스 이름 탐색
  for (const name of SYSTEMD_SERVICE_CANDIDATES) {
    try {
      const { stdout } = await execAsync('systemctl', ['is-active', name], { timeout: 3000 });
      const running = stdout.trim() === 'active';
      return { available: true, serviceName: name, running };
    } catch (err) {
      // systemctl is-active는 서비스 상태가 active가 아니면 non-zero로 종료한다.
      // 종료 코드만으로는 "서비스 없음"과 "서비스 있지만 비활성"을 구분할 수 없으므로
      // stdout 출력값으로 판별한다.
      const output = (err as { stdout?: string }).stdout?.trim() ?? '';
      if (['inactive', 'failed', 'activating'].includes(output)) {
        // 서비스 유닛이 존재하지만 현재 실행 중이지 않은 상태
        return { available: true, serviceName: name, running: false };
      }
      // stdout이 비어 있거나 'not-found' 등 → 해당 이름의 서비스 없음, 다음 후보로
    }
  }

  return { available: true, running: false }; // systemd 있지만 pg 서비스 없음
}

async function detectSystemd(): Promise<RuntimeOption> {
  const info = await detectSystemdPostgres();

  if (!info.available) {
    return {
      id: 'systemd',
      label: 'systemd (시스템 서비스)',
      description: 'Linux systemd 환경이 아닙니다.',
      status: 'not_installed',
      canAutoProvision: false,
      details: {},
    };
  }

  if (!info.serviceName) {
    return {
      id: 'systemd',
      label: 'systemd (시스템 서비스)',
      description: 'systemd는 있지만 PostgreSQL 서비스를 찾을 수 없습니다.',
      status: 'not_installed',
      canAutoProvision: false,
      details: { hint: 'apt install postgresql 등으로 PostgreSQL을 먼저 설치해주세요.' },
    };
  }

  return {
    id: 'systemd',
    label: `systemd — ${info.serviceName}`,
    description: info.running
      ? 'PostgreSQL 시스템 서비스가 실행 중입니다.'
      : 'PostgreSQL 시스템 서비스가 설치되어 있습니다. 서비스를 시작합니다.',
    status: info.running ? 'ready' : 'installed_not_running',
    canAutoProvision: true, // 서비스 시작 + DB/유저 생성 시도
    details: { serviceName: info.serviceName, running: info.running },
  };
}

// ── Native PostgreSQL 감지 (binary / pg_isready) ──────────────

interface NativeInfo {
  available: boolean;
  version?: string;
  running: boolean;
  defaultUrl?: string;
}

async function detectNativePostgres(): Promise<NativeInfo> {
  let running = false;
  let version: string | undefined;

  // pg_isready: 로컬 PostgreSQL 응답 여부 확인
  try {
    await execAsync('pg_isready', ['-q'], { timeout: 3000 });
    running = true;
  } catch {
    // pg_isready 없거나 응답 없음
  }

  // postgres --version
  try {
    const { stdout } = await execAsync('postgres', ['--version'], { timeout: 3000 });
    version = stdout.trim();
  } catch {
    try {
      const { stdout } = await execAsync('pg_config', ['--version'], { timeout: 3000 });
      version = stdout.trim();
    } catch {
      // 바이너리 없음
    }
  }

  if (!version && !running) {
    return { available: false, running: false };
  }

  const defaultUrl = running ? 'postgresql://localhost:5432/postgres' : undefined;
  return { available: true, version, running, defaultUrl };
}

async function detectNative(): Promise<RuntimeOption> {
  const info = await detectNativePostgres();

  if (!info.available) {
    return {
      id: 'native',
      label: '로컬 PostgreSQL',
      description: '로컬에 설치된 PostgreSQL을 찾을 수 없습니다.',
      status: 'not_installed',
      canAutoProvision: false,
      details: {},
    };
  }

  return {
    id: 'native',
    label: '로컬 PostgreSQL',
    description: info.running
      ? '로컬 PostgreSQL이 실행 중입니다. 연결 정보를 입력해주세요.'
      : 'PostgreSQL이 설치되어 있지만 실행 중이지 않습니다.',
    status: info.running ? 'ready' : 'installed_not_running',
    // native: 실행 중일 때만 자동 프로비저닝 시도.
    // postgres 슈퍼유저 peer 인증 또는 sudo 권한이 없으면 실패할 수 있으며,
    // 그 경우 연결 URL 직접 입력 안내로 폴백한다.
    canAutoProvision: info.running,
    details: { version: info.version, running: info.running, defaultUrl: info.defaultUrl },
  };
}

// ── 전체 런타임 감지 (병렬) ───────────────────────────────────

export async function detectAllRuntimes(): Promise<RuntimeOption[]> {
  const [docker, systemd, native] = await Promise.all([
    detectDocker(),
    detectSystemd(),
    detectNative(),
  ]);

  // not_installed인 항목도 포함해서 UI가 안내를 표시할 수 있도록 반환
  return [docker, systemd, native];
}

// ── systemd 프로비저닝 ────────────────────────────────────────

export interface ProvisionResult {
  connectionUrl: string;
  port: number;
}

/**
 * systemd로 PostgreSQL 서비스를 시작하고, postgres 슈퍼유저로 접속해
 * fieldstack 전용 유저 + DB를 생성한다.
 *
 * pg_hba.conf가 local peer/trust 인증을 허용하는 표준 설치라면 대부분 동작한다.
 */
export async function provisionViaSystemd(
  serviceName: string,
  onProgress: (msg: string) => void,
): Promise<ProvisionResult> {
  const password = crypto.randomBytes(16).toString('hex');
  const port = 5432;

  // 1. 서비스 시작 (이미 running이면 무시)
  onProgress(`systemctl start ${serviceName} 실행 중...`);
  try {
    await execAsync('systemctl', ['start', serviceName], { timeout: 15000 });
  } catch (err) {
    throw new Error(
      `서비스 시작 실패: ${(err as Error).message}\n` +
      'sudo systemctl start postgresql 을 직접 실행해보세요.',
    );
  }

  // 2. pg_isready로 준비 대기
  onProgress('PostgreSQL 초기화 대기 중...');
  for (let i = 0; i < 20; i++) {
    try {
      await execAsync('pg_isready', ['-q'], { timeout: 2000 });
      break;
    } catch {
      await new Promise<void>((r) => setTimeout(r, 1500));
      if (i === 19) throw new Error('PostgreSQL이 제한 시간 내에 준비되지 않았습니다.');
    }
  }

  // 3. postgres 슈퍼유저로 접속해 유저 + DB 생성
  onProgress('fieldstack 데이터베이스 및 사용자를 생성하는 중...');

  // DO $$ BEGIN ... END $$: PL/pgSQL 익명 블록으로 조건부 DDL 실행.
  // IF NOT EXISTS 체크로 중복 실행 시 기존 role을 덮어쓰지 않고 비밀번호만 업데이트한다.
  const createUserSql = `
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fieldstack') THEN
        CREATE ROLE fieldstack LOGIN PASSWORD '${password}';
      ELSE
        ALTER ROLE fieldstack WITH PASSWORD '${password}';
      END IF;
    END $$;
  `;
  const createDbSql = `
    SELECT 'CREATE DATABASE fieldstack OWNER fieldstack'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fieldstack')\\gexec
  `;

  try {
    // peer 인증: 현재 프로세스 유저가 postgres면 바로 접속 가능
    await execAsync('psql', ['-U', 'postgres', '-c', createUserSql], { timeout: 10000 });
    await execAsync('psql', ['-U', 'postgres', '-tc', createDbSql], { timeout: 10000 });
  } catch {
    // peer 실패 시 trust 소켓으로 재시도 (일부 배포판 기본값)
    try {
      await execAsync(
        'sudo',
        ['-u', 'postgres', 'psql', '-c', createUserSql],
        { timeout: 10000 },
      );
      await execAsync(
        'sudo',
        ['-u', 'postgres', 'psql', '-tc', createDbSql],
        { timeout: 10000 },
      );
    } catch (innerErr) {
      throw new Error(
        '데이터베이스 생성에 실패했습니다. PostgreSQL 설치 후 아래 명령을 수동으로 실행해주세요:\n' +
        `  sudo -u postgres psql -c "CREATE ROLE fieldstack LOGIN PASSWORD 'YOUR_PASSWORD';"\n` +
        `  sudo -u postgres psql -c "CREATE DATABASE fieldstack OWNER fieldstack;"`,
      );
    }
  }

  const connectionUrl = `postgresql://fieldstack:${password}@localhost:${port}/fieldstack`;
  return { connectionUrl, port };
}

/**
 * 이미 실행 중인 native PostgreSQL에서 postgres 슈퍼유저로 접속해
 * fieldstack 전용 유저 + DB를 생성한다.
 */
export async function provisionViaNative(
  onProgress: (msg: string) => void,
): Promise<ProvisionResult> {
  // provisionViaSystemd는 서비스 이름을 받아 `systemctl start <name>`을 시도하는데,
  // '(none)'을 전달하면 start 단계가 즉시 실패하고 나머지 로직(DB/유저 생성)으로 진행한다.
  // 즉, native는 "서비스 시작 생략 + DB/유저 생성"만 수행하는 셈이다.
  return provisionViaSystemd('(none)', onProgress).catch(() => {
    throw new Error(
      'native PostgreSQL에서 데이터베이스 자동 생성에 실패했습니다.\n' +
      '연결 URL을 직접 입력하거나, 수동으로 fieldstack 유저/DB를 생성해주세요.',
    );
  });
}
