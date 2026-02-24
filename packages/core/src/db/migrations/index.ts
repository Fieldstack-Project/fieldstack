import type { MigrationRunner } from "../index";

export interface MigrationDefinition {
  id: string;
  upSql: string;
  downSql: string;
}

export class InMemoryMigrationRunner implements MigrationRunner {
  private readonly applied: string[] = [];

  public constructor(private readonly migrations: MigrationDefinition[]) {}

  public async up(): Promise<void> {
    this.applied.splice(0, this.applied.length, ...this.migrations.map((item) => item.id));
  }

  public async down(): Promise<void> {
    this.applied.splice(0, this.applied.length);
  }

  public listApplied(): string[] {
    return [...this.applied];
  }
}
