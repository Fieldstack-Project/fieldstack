// ── 공통 타입 ─────────────────────────────────────────────────

export type DbRow = Record<string, unknown>;

export interface DbProvider {
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(fn: (tx: DbProvider) => Promise<T>): Promise<T>;
}

export interface DbConnectionConfig {
  connectionString: string;
}

export interface MigrationRunner {
  up(): Promise<void>;
  down(): Promise<void>;
}

// ── 팩토리 & 싱글턴 ──────────────────────────────────────────

let _db: DbProvider | null = null;

export async function getDb(): Promise<DbProvider> {
  if (_db) return _db;

  const provider = process.env['DB_PROVIDER'] ?? 'postgres';

  if (provider === 'postgres') {
    const url = process.env['DATABASE_URL'];
    if (!url) throw new Error('DATABASE_URL is required for postgres provider');
    const { PostgresProvider } = await import('./providers/postgres.js');
    _db = new PostgresProvider({ connectionString: url });
  } else if (provider === 'sqlite') {
    const path = process.env['SQLITE_PATH'] ?? './data/database.db';
    const { SqliteProvider } = await import('./providers/sqlite.js');
    _db = new SqliteProvider({ connectionString: path });
  } else {
    throw new Error(`Unknown DB_PROVIDER: "${provider}"`);
  }

  await _db.connect();
  return _db;
}

/** 테스트 등에서 싱글턴 초기화 */
export function resetDb(): void {
  _db = null;
}

export * from './migrations/index.js';
export * from './providers/postgres.js';
export * from './providers/sqlite.js';
