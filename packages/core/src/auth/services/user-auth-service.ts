import crypto from 'node:crypto';

import type { DbProvider } from '../../db/index.js';
import type { SessionToken } from '../index.js';
import type { JwtSessionManagerImpl } from './jwt-manager.js';
import { hashPassword, verifyPassword } from './password.js';
import type { TotpServiceImpl } from './totp-service.js';
import type { WhitelistServiceImpl } from './whitelist-service.js';

export type LoginResult =
  | { type: 'session'; tokens: SessionToken; isTempPassword: boolean }
  | { type: 'totp_required'; challengeId: string; userId: string };

export type PasswordRecoveryResult = {
  adminToken: string;
  userId: string;
};

export class UserAuthService {
  public constructor(
    private readonly db: DbProvider,
    private readonly jwtManager: JwtSessionManagerImpl,
    private readonly whitelist: WhitelistServiceImpl,
    private readonly totpService: TotpServiceImpl,
  ) {}

  // ── 로그인 ──────────────────────────────────────────────────────

  public async login(email: string, password: string): Promise<LoginResult> {
    const allowed = await this.whitelist.isAllowed(email);
    if (!allowed) throw new Error('Email not allowed');

    type UserRow = { id: string; password_hash: string; is_temp_password: boolean };
    const [user] = await this.db.query<UserRow>(
      'SELECT id, password_hash, is_temp_password FROM users WHERE email = $1',
      [email],
    );
    if (!user) throw new Error('Invalid credentials');

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    // TOTP 등록 여부 확인
    type TotpRow = { verified: boolean };
    const [totp] = await this.db.query<TotpRow>(
      'SELECT verified FROM totp_credentials WHERE user_id = $1 AND verified = TRUE',
      [user.id],
    );

    if (totp) {
      const challenge = await this.totpService.createLoginChallenge(user.id);
      return { type: 'totp_required', challengeId: challenge.challengeId, userId: user.id };
    }

    const sessionId = crypto.randomUUID();
    const tokens = await this.jwtManager.issueTokens({ userId: user.id, sessionId });
    return { type: 'session', tokens, isTempPassword: user.is_temp_password };
  }

  // ── TOTP 인증 완료 후 세션 발급 ──────────────────────────────────

  public async completeTotpLogin(challengeId: string, code: string): Promise<SessionToken & { isTempPassword: boolean }> {
    type ChallengeRow = { user_id: string };
    const [challenge] = await this.db.query<ChallengeRow>(
      'SELECT user_id FROM totp_challenges WHERE id = $1',
      [challengeId],
    );
    if (!challenge) throw new Error('Invalid or expired challenge');

    const verified = await this.totpService.verifyLoginChallenge(challengeId, code);
    if (!verified) throw new Error('Invalid OTP code');

    type UserRow = { is_temp_password: boolean };
    const [user] = await this.db.query<UserRow>(
      'SELECT is_temp_password FROM users WHERE id = $1',
      [challenge.user_id],
    );

    const sessionId = crypto.randomUUID();
    const tokens = await this.jwtManager.issueTokens({
      userId: challenge.user_id,
      sessionId,
    });
    return { ...tokens, isTempPassword: user?.is_temp_password ?? false };
  }

  // ── 유저 생성 ────────────────────────────────────────────────────

  public async createUser(
    email: string,
    rawPassword: string,
    isTempPassword = false,
  ): Promise<string> {
    const passwordHash = await hashPassword(rawPassword);
    type Row = { id: string };
    const [row] = await this.db.query<Row>(
      `INSERT INTO users (email, password_hash, is_temp_password)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [email, passwordHash, isTempPassword],
    );
    return row.id;
  }

  // ── 비밀번호 변경 ─────────────────────────────────────────────────

  public async changePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPassword(newPassword);
    await this.db.query(
      'UPDATE users SET password_hash = $1, is_temp_password = FALSE, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId],
    );
  }

  // ── 비밀번호 복구 — 관리자 토큰 발급 (SMTP 없이) ─────────────────

  public async issueRecoveryToken(userId: string): Promise<PasswordRecoveryResult> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30분

    await this.db.query(
      `INSERT INTO password_recovery_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );
    return { adminToken: rawToken, userId };
  }

  public async consumeRecoveryToken(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    type Row = { id: string; user_id: string; expires_at: string; used: boolean };
    const [record] = await this.db.query<Row>(
      'SELECT id, user_id, expires_at, used FROM password_recovery_tokens WHERE token_hash = $1',
      [tokenHash],
    );
    if (!record) throw new Error('Invalid or expired recovery token');
    if (record.used) throw new Error('Recovery token already used');
    if (new Date(record.expires_at) < new Date()) throw new Error('Recovery token expired');

    await this.db.transaction(async (tx) => {
      await tx.query(
        'UPDATE password_recovery_tokens SET used = TRUE WHERE id = $1',
        [record.id],
      );
      const passwordHash = await hashPassword(newPassword);
      await tx.query(
        'UPDATE users SET password_hash = $1, is_temp_password = FALSE, updated_at = NOW() WHERE id = $2',
        [passwordHash, record.user_id],
      );
    });
  }
}
