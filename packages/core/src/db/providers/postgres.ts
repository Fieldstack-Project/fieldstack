import pg from 'pg';

import type { DbConnectionConfig, DbProvider, DbRow } from '../index.js';

const { Pool } = pg;

const _isProd = process.env['NODE_ENV'] === 'production';
const _gray   = _isProd ? '' : '\x1b[90m';
const _green  = _isProd ? '' : '\x1b[32m';
const _red    = _isProd ? '' : '\x1b[31m';
const _reset  = _isProd ? '' : '\x1b[0m';
function ts(): string { return new Date().toISOString().replace('T', ' ').slice(0, 23); }
function dbLog(msg: string): void {
  console.log(`${_gray}${ts()}${_reset} ${_green}[db]${_reset} ${_green}${msg}${_reset}`);
}
function dbError(msg: string): void {
  console.error(`${_gray}${ts()}${_reset} ${_red}[db]${_reset} ${_red}${msg}${_reset}`);
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export class PostgresProvider implements DbProvider {
  public readonly name = 'postgres';
  private pool: pg.Pool | null = null;

  public constructor(private readonly config: DbConnectionConfig) {}

  public async connect(): Promise<void> {
    this.pool = new Pool({ connectionString: this.config.connectionString });

    // 지수 백오프 재시도 — attempt 1: 2s, 2: 4s, 3: 6s, 4: 8s, 5: 실패 (최대 20s 대기)
    // Docker 컨테이너 초기화처럼 DB가 늦게 올라오는 환경을 위한 여유 시간 확보
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const client = await this.pool.connect();
        client.release();
        dbLog(`PostgreSQL connected`);
        return;
      } catch (err) {
        const isLast = attempt === MAX_RETRIES;
        dbError(`PostgreSQL connection failed (attempt ${attempt}/${MAX_RETRIES}): ${(err as Error).message}`);
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
    dbLog(`PostgreSQL disconnected`);
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
      // 트랜잭션 클라이언트를 DbProvider 인터페이스로 래핑.
      // connect/disconnect는 no-op — 트랜잭션 내부에서는 커넥션 관리 불필요.
      // 중첩 transaction() 호출은 동일 클라이언트로 위임하지만 savepoint는 미지원.
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
