import type { DbConnectionConfig, DbProvider, DbRow } from '../index.js';
import { coreLog } from '../../logging.js';

/** MongoDB Provider — scaffold (미구현, Phase later) */
export class MongoDbProvider implements DbProvider {
  public readonly name = 'mongodb';

  public constructor(private readonly config: DbConnectionConfig) {}

  public async connect(): Promise<void> {
    coreLog.warn('db', `MongoDB provider is not yet implemented. uri="${this.config.connectionString}"`);
  }

  public async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  public async query<T extends DbRow = DbRow>(_sql: string, _params?: unknown[]): Promise<T[]> {
    throw new Error('MongoDB provider is not yet implemented');
  }

  public async transaction<T>(_fn: (tx: DbProvider) => Promise<T>): Promise<T> {
    throw new Error('MongoDB provider is not yet implemented');
  }
}
