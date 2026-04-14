import bcrypt from 'bcryptjs';

import type { DbProvider } from '../../db/index.js';
import type { AdminPinService } from '../index.js';

const SALT_ROUNDS = 12;

export class AdminPinServiceImpl implements AdminPinService {
  public constructor(private readonly db: DbProvider) {}

  public async setPin(rawPin: string): Promise<void> {
    const pinHash = await bcrypt.hash(rawPin, SALT_ROUNDS);
    await this.db.query(
      `INSERT INTO admin_pin (id, pin_hash)
       VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET pin_hash = $1, updated_at = NOW()`,
      [pinHash],
    );
  }

  public async verifyPin(rawPin: string): Promise<boolean> {
    type Row = { pin_hash: string };
    const [row] = await this.db.query<Row>('SELECT pin_hash FROM admin_pin WHERE id = 1');
    if (!row) return false;
    return bcrypt.compare(rawPin, row.pin_hash);
  }

  public async rotatePin(currentPin: string, nextPin: string): Promise<void> {
    const valid = await this.verifyPin(currentPin);
    if (!valid) throw new Error('Current PIN is incorrect');
    await this.setPin(nextPin);
  }
}
