import type { DbConnectionConfig, DbProvider, DbRow } from '../index.js';
import { coreLog } from '../../logging.js';

/** Supabase Provider — scaffold (미구현, Phase later) */
export class SupabaseProvider implements DbProvider {
  public readonly name = 'supabase';

  public constructor(private readonly config: DbConnectionConfig) {}

  public async connect(): Promise<void> {
    coreLog.warn('db', `Supabase provider is not yet implemented. url="${this.config.connectionString}"`);
  }

  public async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  public async query<T extends DbRow = DbRow>(_sql: string, _params?: unknown[]): Promise<T[]> {
    throw new Error('Supabase provider is not yet implemented');
  }

  public async transaction<T>(_fn: (tx: DbProvider) => Promise<T>): Promise<T> {
    throw new Error('Supabase provider is not yet implemented');
  }
}
