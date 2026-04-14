import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { DbProvider, DbRow } from '../index.js';

// ── _migrations 테이블 ────────────────────────────────────────

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS _migrations (
    id        SERIAL PRIMARY KEY,
    module    TEXT        NOT NULL,
    filename  TEXT        NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
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
  },
  sqlite: {
    '{{UUID_PRIMARY_KEY}}': 'TEXT PRIMARY KEY',
    '{{NOW}}': "datetime('now')",
    '{{BOOLEAN_TRUE}}': '1',
    '{{BOOLEAN_FALSE}}': '0',
  },
};

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

    console.log(
      `[fieldstack][migrations] ${this.moduleName}: ${files.length} pending migration(s)`,
    );

    for (const filename of files) {
      await this.applyFile(filename);
    }
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.db.query(CREATE_MIGRATIONS_TABLE);
  }

  private async getPendingFiles(): Promise<string[]> {
    let allFiles: string[];
    try {
      allFiles = (await readdir(this.migrationsDir))
        .filter((f) => f.endsWith('.sql'))
        .sort();
    } catch {
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
      await tx.query(sql);
      await tx.query(
        'INSERT INTO _migrations (module, filename) VALUES ($1, $2)',
        [this.moduleName, filename],
      );
    });

    console.log(`[fieldstack][migrations] ${this.moduleName}: applied ${filename}`);
  }
}

// ── 하위 호환 (기존 InMemoryMigrationRunner 유지) ─────────────

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
