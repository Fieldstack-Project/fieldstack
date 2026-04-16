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

// ── 포트 후보 목록 ────────────────────────────────────────────
// Windows Hyper-V/WSL2는 "동적 포트 예약" 기능으로 5432 등 일부 포트를 부팅 시점에
// 선점해버린다. Node.js의 net.listen() 테스트는 WSL2 ↔ Windows 네트워크 스택 경계에서
// 결과가 일치하지 않아 신뢰할 수 없으므로, docker run 자체를 시도하고 포트 충돌 에러
// 메시지로 실패를 판별한다. 5433부터 시작하며, 고정 범위 실패 시 15432 대역을 시도한다.

const PORT_CANDIDATES = [5433, 5434, 5435, 5436, 5437, 15432, 15433, 15434];

// ── PostgreSQL 컨테이너 프로비저닝 ───────────────────────────

export interface ProvisionResult {
  connectionUrl: string;
  port: number;
}

export async function provisionPostgresContainer(): Promise<ProvisionResult> {
  // stopped 상태로 남아있는 동일 이름 컨테이너 제거 (이전 실패 잔여물)
  const existing = await getContainerStatus();
  if (existing === 'stopped') {
    await execFileAsync('docker', ['rm', CONTAINER_NAME]);
  }

  const password = crypto.randomBytes(16).toString('hex');

  // 포트 후보를 순서대로 시도 — Docker 실행 결과로 직접 판별한다.
  // WSL2 ↔ Windows 네트워크 스택 차이로 Node.js 바인딩 테스트는 신뢰할 수 없으므로
  // docker run을 실제로 시도하고 포트 충돌 에러 시 다음 포트로 넘어간다.
  for (const port of PORT_CANDIDATES) {
    try {
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
      // 성공
      const connectionUrl = `postgresql://${POSTGRES_USER}:${password}@localhost:${port}/${POSTGRES_DB}`;
      return { connectionUrl, port };
    } catch (err) {
      const msg = (err as Error).message ?? '';
      // Docker 버전/OS마다 포트 충돌 메시지가 다르므로 여러 패턴을 포함해 체크한다.
      // - Linux Docker: "address already in use" / "bind:"
      // - Docker Desktop (Windows/Mac): "ports are not available" / "access permissions"
      const isPortError =
        msg.includes('ports are not available') ||
        msg.includes('address already in use') ||
        msg.includes('bind:') ||
        msg.includes('access permissions');

      if (!isPortError) throw err; // 포트 문제가 아니면 즉시 실패

      // 포트 문제 → 컨테이너가 절반만 생성됐을 수 있으므로 정리 후 다음 포트 시도
      try { await execFileAsync('docker', ['rm', '-f', CONTAINER_NAME]); } catch { /* ignore */ }
    }
  }

  throw new Error(
    `후보 포트(${PORT_CANDIDATES.join(', ')}) 모두 사용 불가. ` +
    'PostgreSQL 연결 URL을 직접 입력해주세요.',
  );
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
