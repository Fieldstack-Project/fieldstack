import { authenticator } from 'otplib';

import type { DbProvider } from '../../db/index.js';
import type {
  TotpEnrollmentSession,
  TotpLoginChallenge,
  TotpService,
} from '../index.js';
import { generateTotpSecret } from '../totp.js';

const CHALLENGE_TTL_SECS = 5 * 60; // 5분

export class TotpServiceImpl implements TotpService {
  public constructor(
    private readonly db: DbProvider,
    private readonly issuer: string,
  ) {}

  public async startEnrollment(userId: string): Promise<TotpEnrollmentSession> {
    const secret = generateTotpSecret();

    type UserRow = { email: string };
    const [user] = await this.db.query<UserRow>('SELECT email FROM users WHERE id = $1', [userId]);
    if (!user) throw new Error('User not found');

    await this.db.query(
      `INSERT INTO totp_credentials (user_id, secret, verified)
       VALUES ($1, $2, FALSE)
       ON CONFLICT (user_id) DO UPDATE SET secret = $2, verified = FALSE`,
      [userId, secret],
    );

    const qrCodeUri = authenticator.keyuri(user.email, this.issuer, secret);
    return { userId, secret, qrCodeUri };
  }

  public async confirmEnrollment(userId: string, code: string): Promise<boolean> {
    type Row = { secret: string };
    const [row] = await this.db.query<Row>(
      'SELECT secret FROM totp_credentials WHERE user_id = $1 AND verified = FALSE',
      [userId],
    );
    if (!row) return false;

    const valid = authenticator.verify({ token: code, secret: row.secret });
    if (valid) {
      await this.db.query(
        'UPDATE totp_credentials SET verified = TRUE WHERE user_id = $1',
        [userId],
      );
    }
    return valid;
  }

  public async createLoginChallenge(userId: string): Promise<TotpLoginChallenge> {
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECS * 1000).toISOString();
    type Row = { id: string };
    const [row] = await this.db.query<Row>(
      'INSERT INTO totp_challenges (user_id, expires_at) VALUES ($1, $2) RETURNING id',
      [userId, expiresAt],
    );
    return { userId, challengeId: row.id };
  }

  public async verifyLoginChallenge(challengeId: string, code: string): Promise<boolean> {
    type ChallengeRow = { user_id: string; expires_at: string };
    const [challenge] = await this.db.query<ChallengeRow>(
      'SELECT user_id, expires_at FROM totp_challenges WHERE id = $1',
      [challengeId],
    );
    if (!challenge) return false;

    if (new Date(challenge.expires_at) < new Date()) {
      await this.db.query('DELETE FROM totp_challenges WHERE id = $1', [challengeId]);
      return false;
    }

    type SecretRow = { secret: string };
    const [cred] = await this.db.query<SecretRow>(
      'SELECT secret FROM totp_credentials WHERE user_id = $1 AND verified = TRUE',
      [challenge.user_id],
    );
    if (!cred) return false;

    const valid = authenticator.verify({ token: code, secret: cred.secret });
    if (valid) {
      await this.db.query('DELETE FROM totp_challenges WHERE id = $1', [challengeId]);
    }
    return valid;
  }
}
