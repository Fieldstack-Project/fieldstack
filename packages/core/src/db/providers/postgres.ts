import pg from 'pg';

import type { DbConnectionConfig, DbProvider, DbRow } from '../index.js';

const { Pool } = pg;

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export class PostgresProvider implements DbProvider {
  public readonly name = 'postgres';
  private pool: pg.Pool | null = null;

  public constructor(private readonly config: DbConnectionConfig) {}

  public async connect(): Promise<void> {
    this.pool = new Pool({ connectionString: this.config.connectionString });

    // 연결 실패 시 지수 백오프로 재시도
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const client = await this.pool.connect();
        client.release();
        console.log('[fieldstack][db] PostgreSQL connected');
        return;
      } catch (err) {
        const isLast = attempt === MAX_RETRIES;
        console.error(
          `[fieldstack][db] PostgreSQL connection failed (attempt ${attempt}/${MAX_RETRIES}):`,
          (err as Error).message,
        );
        if (isLast) {
          await this.pool.end().catch(() => undefined);
          throw new Error('[fieldstack][db] Could not connect to PostgreSQL after max retries');
        }
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  public async disconnect(): Promise<void> {
    await this.pool?.end();
    this.pool = null;
    console.log('[fieldstack][db] PostgreSQL disconnected');
  }

  public async query<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this.pool) throw new Error('[fieldstack][db] Not connected');
    const result = await this.pool.query<T>(sql, params);
    return result.rows;
  }

  public async transaction<T>(fn: (tx: DbProvider) => Promise<T>): Promise<T> {
    if (!this.pool) throw new Error('[fieldstack][db] Not connected');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // 트랜잭션 클라이언트를 DbProvider 인터페이스로 래핑
      const tx: DbProvider = {
        name: this.name,
        connect: async () => undefined,
        disconnect: async () => undefined,
        query: async <R extends DbRow = DbRow>(s: string, p?: unknown[]) => {
          const r = await client.query<R>(s, p);
          return r.rows;
        },
        transaction: (innerFn) => innerFn(tx),
      };
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
