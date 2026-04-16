import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type BetterSqlite3 from 'better-sqlite3';

import type { DbConnectionConfig, DbProvider, DbRow } from '../index.js';

/**
 * SQLite Provider — 개발/테스트 전용
 *
 * ⚠️  프로덕션 환경에서는 PostgreSQL을 사용하세요.
 *     SQLite → PostgreSQL 마이그레이션은 별도 데이터 이전 작업이 필요합니다.
 *
 * - better-sqlite3 기반 (동기 API를 DbProvider async 인터페이스로 래핑)
 * - PostgreSQL 호환 함수 등록: gen_random_uuid(), now()
 * - $1/$2 파라미터 스타일 → ? 자동 변환
 * - RETURNING 절 지원 (SQLite 3.35.0+)
 * - 데이터 디렉터리 자동 생성
 */
export class SqliteProvider implements DbProvider {
  public readonly name = 'sqlite';

  // import type으로 선언, 런타임에 동적 import로 로드
  private db: BetterSqlite3.Database | null = null;

  public constructor(private readonly config: DbConnectionConfig) {}

  public async connect(): Promise<void> {
    // 동적 import — better-sqlite3 가 설치되지 않으면 이 시점에 오류 발생
    const { default: Database } = await import('better-sqlite3');

    // 데이터 디렉터리 자동 생성
    const dbDir = path.dirname(path.resolve(this.config.connectionString));
    fs.mkdirSync(dbDir, { recursive: true });

    this.db = new Database(this.config.connectionString);

    // 성능 최적화 + 외래 키 제약 활성화
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // ── PostgreSQL 호환 함수 등록 ─────────────────────────────
    // migration SQL / 서비스 코드가 PostgreSQL 함수를 그대로 쓸 수 있도록 한다
    this.db.function('gen_random_uuid', () => crypto.randomUUID());
    this.db.function('now', () => new Date().toISOString());

    console.log(`[fieldstack][db] SQLite connected: ${this.config.connectionString}`);
  }

  public async disconnect(): Promise<void> {
    this.db?.close();
    this.db = null;
    console.log('[fieldstack][db] SQLite disconnected');
  }

  public async query<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this.db) throw new Error('[fieldstack][db] SQLite: not connected');

    const hasParams = Boolean(params && params.length > 0);

    // $1, $2, ... → ? 변환 (PostgreSQL 파라미터 → SQLite 스타일)
    const converted = hasParams ? sql.replace(/\$\d+/g, '?') : sql;
    const trimmed = converted.trimStart();

    // 결과 행을 반환하는 구문 판별.
    // SELECT/WITH로 시작하거나 RETURNING 절을 포함하면 all()로 결과 행을 가져온다.
    // INSERT/UPDATE/DELETE without RETURNING, DDL(CREATE/ALTER/DROP) 등은 run()/exec()로 처리.
    const returnsRows =
      /^(SELECT|WITH)\b/i.test(trimmed) ||
      /\bRETURNING\b/i.test(converted);

    if (hasParams) {
      const stmt = this.db.prepare(converted);
      if (returnsRows) {
        return stmt.all(...(params as unknown[])) as T[];
      } else {
        stmt.run(...(params as unknown[]));
        return [];
      }
    } else {
      // 파라미터 없음 → exec() 사용 (마이그레이션 등 멀티 구문 지원)
      if (returnsRows) {
        const stmt = this.db.prepare(trimmed);
        return stmt.all() as T[];
      } else {
        this.db.exec(trimmed);
        return [];
      }
    }
  }

  public async transaction<T>(fn: (tx: DbProvider) => Promise<T>): Promise<T> {
    if (!this.db) throw new Error('[fieldstack][db] SQLite: not connected');

    // better-sqlite3는 동기 API지만 DbProvider 인터페이스는 async를 요구한다.
    // BEGIN/COMMIT을 수동 관리하여 async callback을 지원한다.
    // 트랜잭션 fn() 내부에서 await하면 이론상 다른 쿼리가 끼어들 수 있으나,
    // Node.js 싱글 스레드 특성상 실제 DB 접근은 직렬화되어 안전하게 동작한다.
    this.db.exec('BEGIN');
    try {
      const result = await fn(this);
      this.db.exec('COMMIT');
      return result;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        // ROLLBACK 실패는 무시 (이미 오류 상태이므로)
      }
      throw err;
    }
  }
}
