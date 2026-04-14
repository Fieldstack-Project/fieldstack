import type { DbConnectionConfig, DbProvider, DbRow } from '../index.js';

/**
 * SQLite Provider — 경량 단독 인스턴스용 (2순위 구현 대상)
 * Phase 1.9.2에서는 인터페이스 계약만 맞추고, 실제 구현은 추후 `better-sqlite3` 또는 `bun:sqlite`로 진행.
 */
export class SqliteProvider implements DbProvider {
  public readonly name = 'sqlite';

  public constructor(private readonly config: DbConnectionConfig) {}

  public async connect(): Promise<void> {
    // TODO(Phase later): better-sqlite3 연결 구현
    console.warn(
      `[fieldstack][db] SQLite provider is not yet implemented. path="${this.config.connectionString}"`,
    );
  }

  public async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  public async query<T extends DbRow = DbRow>(_sql: string, _params?: unknown[]): Promise<T[]> {
    throw new Error('[fieldstack][db] SQLite provider is not yet implemented');
  }

  public async transaction<T>(_fn: (tx: DbProvider) => Promise<T>): Promise<T> {
    throw new Error('[fieldstack][db] SQLite provider is not yet implemented');
  }
}
