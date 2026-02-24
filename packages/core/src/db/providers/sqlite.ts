import type { DbConnectionConfig, DbProvider } from "../index";

export class SqliteProvider implements DbProvider {
  public readonly name = "sqlite";

  public constructor(private readonly config: DbConnectionConfig) {}

  public async connect(): Promise<void> {
    void this.config.connectionString;
  }

  public async disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
