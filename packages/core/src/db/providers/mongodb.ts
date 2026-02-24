import type { DbConnectionConfig, DbProvider } from "../index";

export class MongoDbProvider implements DbProvider {
  public readonly name = "mongodb";

  public constructor(private readonly config: DbConnectionConfig) {}

  public async connect(): Promise<void> {
    void this.config.connectionString;
  }

  public async disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
