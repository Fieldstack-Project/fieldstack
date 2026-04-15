import fs from 'node:fs';
import path from 'node:path';

// 프로젝트 루트: apps/api/src/setup → ../../../../
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

export const LOCK_FILE = path.join(PROJECT_ROOT, 'installed.lock');
export const CONFIG_FILE = path.join(PROJECT_ROOT, 'fieldstack.config.json');

// ── 설치 완료 여부 ─────────────────────────────────────────────

export function isInstalled(): boolean {
  return fs.existsSync(LOCK_FILE);
}

export function markInstalled(): void {
  fs.writeFileSync(LOCK_FILE, new Date().toISOString(), 'utf-8');
}

export function clearInstalled(): void {
  if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
}

// ── fieldstack.config.json — DB 설정 영속화 ──────────────────

export interface FieldstackConfig {
  db: {
    provider: 'postgres' | 'sqlite';
    url?: string;
    sqlitePath?: string;
  };
  installedAt: string;
}

export function writeConfig(config: FieldstackConfig): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function readConfig(): FieldstackConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) as FieldstackConfig;
  } catch {
    return null;
  }
}

export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
}

/**
 * config 파일에 저장된 DB 설정을 process.env에 반영한다.
 * 이미 env var가 설정되어 있으면 env var가 우선한다.
 */
export function applyConfigToEnv(): void {
  const config = readConfig();
  if (!config) return;

  if (!process.env['DB_PROVIDER']) {
    process.env['DB_PROVIDER'] = config.db.provider;
  }
  if (config.db.url && !process.env['DATABASE_URL']) {
    process.env['DATABASE_URL'] = config.db.url;
  }
  if (config.db.sqlitePath && !process.env['SQLITE_PATH']) {
    process.env['SQLITE_PATH'] = config.db.sqlitePath;
  }
}

// ── 서버 재시작 ──────────────────────────────────────────────
// PM2/Docker/tsx watch 등 프로세스 매니저가 exit(0)을 감지해 자동 재시작한다.

export function scheduleRestart(delayMs = 500): void {
  console.log(`[fieldstack][setup] Server restart scheduled in ${delayMs}ms`);
  setTimeout(() => {
    console.log('[fieldstack][setup] Exiting for restart.');
    process.exit(0);
  }, delayMs);
}
