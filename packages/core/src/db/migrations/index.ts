import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { DbProvider, DbRow } from '../index.js';
import { coreLog } from '../../logging.js';

// ── _migrations 테이블 ────────────────────────────────────────

// {{SERIAL_PK}} / {{NOW}} 은 applyDialect()로 치환됨 (ensureMigrationsTable 참고)
const CREATE_MIGRATIONS_TABLE_TEMPLATE = `
  CREATE TABLE IF NOT EXISTS _migrations (
    id         {{SERIAL_PK}},
    module     TEXT NOT NULL,
    filename   TEXT NOT NULL,
    applied_at TEXT DEFAULT ({{NOW}}),
    UNIQUE (module, filename)
  )
`;

// ── Dialect 전처리기 ──────────────────────────────────────────

const DIALECT_TOKENS: Record<string, Record<string, string>> = {
  postgres: {
    '{{UUID_PRIMARY_KEY}}': 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    '{{NOW}}': 'NOW()',
    '{{BOOLEAN_TRUE}}': 'TRUE',
    '{{BOOLEAN_FALSE}}': 'FALSE',
    '{{SERIAL_PK}}': 'SERIAL PRIMARY KEY',
  },
  sqlite: {
    // UUID PK: DEFAULT 에 등록된 gen_random_uuid() 유저 함수 사용 (SqliteProvider.connect()에서 등록)
    '{{UUID_PRIMARY_KEY}}': 'TEXT PRIMARY KEY DEFAULT (gen_random_uuid())',
    '{{NOW}}': "datetime('now')",
    '{{BOOLEAN_TRUE}}': '1',
    '{{BOOLEAN_FALSE}}': '0',
    '{{SERIAL_PK}}': 'INTEGER PRIMARY KEY AUTOINCREMENT',
  },
};

/**
 * SQL 템플릿의 방언 토큰을 대상 DB에 맞는 실제 SQL로 치환한다.
 *
 * 토큰은 서로 중첩되거나 겹치지 않도록 설계되어 있어 reduce 순서에 무관하다.
 * 알 수 없는 dialect이 전달되면 토큰을 치환하지 않고 원본 SQL을 반환한다.
 */
export function applyDialect(sql: string, dialect: string): string {
  const tokens = DIALECT_TOKENS[dialect] ?? {};
  return Object.entries(tokens).reduce((s, [token, value]) => s.replaceAll(token, value), sql);
}

// ── 파일 기반 마이그레이션 러너 ───────────────────────────────

export class FileMigrationRunner {
  public constructor(
    private readonly db: DbProvider,
    private readonly moduleName: string,
    private readonly migrationsDir: string,
  ) {}

  public async run(): Promise<void> {
    await this.ensureMigrationsTable();

    const files = await this.getPendingFiles();
    if (files.length === 0) return;

    coreLog.info('migrations', `${this.moduleName}: ${files.length} pending migration(s)`);

    for (const filename of files) {
      await this.applyFile(filename);
    }
  }

  private async ensureMigrationsTable(): Promise<void> {
    const sql = applyDialect(CREATE_MIGRATIONS_TABLE_TEMPLATE, this.db.name);
    await this.db.query(sql);
  }

  private async getPendingFiles(): Promise<string[]> {
    let allFiles: string[];
    try {
      // .sql 파일을 알파벳 순으로 정렬 — 파일명 앞에 001_, 002_ 같은 번호를 붙이면
      // 사전순 정렬이 곧 적용 순서가 된다. 번호 없이 만들면 순서 보장이 안 됨에 주의.
      allFiles = (await readdir(this.migrationsDir))
        .filter((f) => f.endsWith('.sql'))
        .sort();
    } catch {
      // 모듈에 migrations 디렉터리가 없는 경우도 정상 시나리오이므로 빈 목록 반환.
      return [];
    }

    type Row = { filename: string };
    const applied = await this.db.query<Row>(
      'SELECT filename FROM _migrations WHERE module = $1',
      [this.moduleName],
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    return allFiles.filter((f) => !appliedSet.has(f));
  }

  private async applyFile(filename: string): Promise<void> {
    const filePath = join(this.migrationsDir, filename);
    const rawSql = await readFile(filePath, 'utf-8');
    const sql = applyDialect(rawSql, this.db.name);

    await this.db.transaction(async (tx) => {
      // SQL 실행과 _migrations 기록을 하나의 트랜잭션으로 묶어
      // 중간 실패 시 "실행은 됐는데 기록은 없는" 불일치를 막는다.
      await tx.query(sql);
      await tx.query(
        'INSERT INTO _migrations (module, filename) VALUES ($1, $2)',
        [this.moduleName, filename],
      );
    });

    coreLog.info('migrations', `${this.moduleName}: applied ${filename}`);
  }
}

// ── 하위 호환 (기존 InMemoryMigrationRunner 유지) ─────────────
// 실제 DB 없이 "마이그레이션이 실행됐다"는 상태만 메모리에 유지하는 더미 러너.
// 테스트 코드나 초기 개발 시 DB 없이도 마이그레이션 목록을 조회해야 할 때 사용한다.

export interface MigrationDefinition {
  id: string;
  upSql: string;
  downSql: string;
}

export class InMemoryMigrationRunner {
  private readonly applied: string[] = [];

  public constructor(private readonly migrations: MigrationDefinition[]) {}

  public async up(): Promise<void> {
    this.applied.splice(0, this.applied.length, ...this.migrations.map((m) => m.id));
  }

  public async down(): Promise<void> {
    this.applied.splice(0, this.applied.length);
  }

  public listApplied(): string[] {
    return [...this.applied];
  }
}

// ── 전체 모듈 마이그레이션 실행 헬퍼 ─────────────────────────

export async function runModuleMigrations(
  db: DbProvider,
  moduleName: string,
  migrationsDir: string,
): Promise<void> {
  const runner = new FileMigrationRunner(db, moduleName, migrationsDir);
  await runner.run();
}

/** 여러 모듈의 마이그레이션을 순서대로 실행 */
export async function runAllMigrations(
  db: DbProvider,
  modules: Array<{ name: string; migrationsDir: string }>,
): Promise<void> {
  for (const mod of modules) {
    await runModuleMigrations(db, mod.name, mod.migrationsDir);
  }
}

// ── DB Row 타입 재export (하위 호환) ──────────────────────────
export type { DbRow };
