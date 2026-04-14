import type { DbProvider } from '../db/index.js';

export class SystemSettingsService {
  public constructor(private readonly db: DbProvider) {}

  public async get(key: string): Promise<string | null> {
    type Row = { value: string };
    const [row] = await this.db.query<Row>(
      'SELECT value FROM system_settings WHERE key = $1',
      [key],
    );
    return row?.value ?? null;
  }

  public async set(key: string, value: string): Promise<void> {
    await this.db.query(
      `INSERT INTO system_settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value],
    );
  }

  public async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    const val = await this.get(key);
    if (val === null) return defaultValue;
    return val === 'true';
  }

  public async setBoolean(key: string, value: boolean): Promise<void> {
    await this.set(key, value ? 'true' : 'false');
  }
}
