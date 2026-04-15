import crypto from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ── 설정 상수 ─────────────────────────────────────────────────

export const POSTGRES_IMAGE = 'postgres:16-alpine';
export const CONTAINER_NAME = 'fieldstack-postgres';
const POSTGRES_USER = 'fieldstack';
const POSTGRES_DB = 'fieldstack';
const DEFAULT_PORT = 5432;

// ── Docker 데몬 감지 ──────────────────────────────────────────

export interface DockerStatus {
  available: boolean;
  version?: string;
  daemonRunning: boolean;
}

export async function detectDocker(): Promise<DockerStatus> {
  try {
    const { stdout } = await execFileAsync('docker', ['--version'], { timeout: 5000 });
    const version = stdout.trim();
    try {
      await execFileAsync('docker', ['info'], { timeout: 5000 });
      return { available: true, version, daemonRunning: true };
    } catch {
      return { available: true, version, daemonRunning: false };
    }
  } catch {
    return { available: false, daemonRunning: false };
  }
}

// ── 컨테이너 상태 확인 ─────────────────────────────────────────

export type ContainerStatus = 'running' | 'stopped' | 'not_found';

export async function getContainerStatus(): Promise<ContainerStatus> {
  try {
    const { stdout } = await execFileAsync('docker', [
      'inspect',
      '--format',
      '{{.State.Status}}',
      CONTAINER_NAME,
    ]);
    return stdout.trim() === 'running' ? 'running' : 'stopped';
  } catch {
    return 'not_found';
  }
}

// ── 이미지 존재 여부 ──────────────────────────────────────────

export async function isImagePulled(): Promise<boolean> {
  try {
    await execFileAsync('docker', ['image', 'inspect', POSTGRES_IMAGE]);
    return true;
  } catch {
    return false;
  }
}

// ── 이미지 pull (진행 스트리밍) ───────────────────────────────

export function pullDockerImage(onProgress: (msg: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('docker', ['pull', POSTGRES_IMAGE]);

    proc.stdout.on('data', (chunk: Buffer) => {
      const msg = chunk.toString().trim();
      if (msg) onProgress(msg);
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      const msg = chunk.toString().trim();
      if (msg) onProgress(msg);
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`docker pull ${POSTGRES_IMAGE} failed (exit ${code ?? '?'})`));
    });

    proc.on('error', reject);
  });
}

// ── 포트 충돌 대응 후보 포트 목록 ────────────────────────────

const PORT_CANDIDATES = [5432, 5433, 5434, 5435];

/**
 * 이미 실행 중인 컨테이너가 없는 포트를 순서대로 반환.
 * 모두 사용 중이면 기본 포트를 그대로 사용 (Docker가 에러를 낸다).
 */
async function pickAvailablePort(): Promise<number> {
  for (const port of PORT_CANDIDATES) {
    try {
      // 해당 포트를 점유한 컨테이너가 없는지 확인
      const { stdout } = await execFileAsync('docker', [
        'ps',
        '--filter',
        `publish=${port}`,
        '--format',
        '{{.ID}}',
      ]);
      if (!stdout.trim()) return port;
    } catch {
      return port;
    }
  }
  return DEFAULT_PORT;
}

// ── PostgreSQL 컨테이너 프로비저닝 ───────────────────────────

export interface ProvisionResult {
  connectionUrl: string;
  port: number;
}

export async function provisionPostgresContainer(): Promise<ProvisionResult> {
  const password = crypto.randomBytes(16).toString('hex');
  const port = await pickAvailablePort();

  await execFileAsync('docker', [
    'run',
    '-d',
    '--name',
    CONTAINER_NAME,
    '--restart',
    'unless-stopped',
    '-e',
    `POSTGRES_USER=${POSTGRES_USER}`,
    '-e',
    `POSTGRES_PASSWORD=${password}`,
    '-e',
    `POSTGRES_DB=${POSTGRES_DB}`,
    '-p',
    `${port}:5432`,
    POSTGRES_IMAGE,
  ]);

  const connectionUrl = `postgresql://${POSTGRES_USER}:${password}@localhost:${port}/${POSTGRES_DB}`;
  return { connectionUrl, port };
}

// ── PostgreSQL 준비 대기 (연결 폴링) ─────────────────────────

export async function waitForPostgres(
  url: string,
  maxAttempts = 24,
  intervalMs = 2500,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { PostgresProvider } = await import('@fieldstack/core');
      const db = new PostgresProvider({ connectionString: url });
      await db.connect();
      await db.disconnect();
      return;
    } catch {
      await new Promise<void>((r) => setTimeout(r, intervalMs));
    }
  }
  throw new Error('PostgreSQL이 제한 시간 내에 준비되지 않았습니다. 컨테이너 로그를 확인하세요.');
}
