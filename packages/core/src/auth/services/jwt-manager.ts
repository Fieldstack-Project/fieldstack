import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import type { DbProvider } from '../../db/index.js';
import type { JwtSessionManager, JwtSessionPayload, SessionToken } from '../index.js';

const ACCESS_TTL_SECS = 15 * 60;         // 15분
const REFRESH_TTL_SECS = 7 * 24 * 3600; // 7일

export class JwtSessionManagerImpl implements JwtSessionManager {
  public constructor(
    private readonly db: DbProvider,
    private readonly accessSecret: string,
    private readonly refreshSecret: string,
  ) {}

  public async issueTokens(payload: JwtSessionPayload): Promise<SessionToken> {
    const refreshToken = crypto.randomBytes(48).toString('base64url');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECS * 1000).toISOString();

    // sessions 테이블에 저장 (sessionId가 PK)
    await this.db.query(
      'INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at) VALUES ($1, $2, $3, $4)',
      [payload.sessionId, payload.userId, refreshHash, expiresAt],
    );

    const accessToken = jwt.sign(
      { userId: payload.userId, sessionId: payload.sessionId },
      this.accessSecret,
      { expiresIn: ACCESS_TTL_SECS },
    );

    return { accessToken, refreshToken };
  }

  public async verifyAccessToken(token: string): Promise<JwtSessionPayload> {
    const decoded = jwt.verify(token, this.accessSecret) as JwtSessionPayload;
    return { userId: decoded.userId, sessionId: decoded.sessionId };
  }

  public async rotateRefreshToken(refreshToken: string): Promise<SessionToken> {
    const oldHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    type Row = { id: string; user_id: string; expires_at: string };
    const [session] = await this.db.query<Row>(
      'SELECT id, user_id, expires_at FROM sessions WHERE refresh_token_hash = $1',
      [oldHash],
    );
    if (!session) throw new Error('Invalid refresh token');
    if (new Date(session.expires_at) < new Date()) throw new Error('Refresh token expired');

    await this.db.query('DELETE FROM sessions WHERE id = $1', [session.id]);

    const newSessionId = crypto.randomUUID();
    return this.issueTokens({ userId: session.user_id, sessionId: newSessionId });
  }

  public async revokeSession(sessionId: string): Promise<void> {
    await this.db.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  }
}
