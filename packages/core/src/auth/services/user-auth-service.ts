import crypto from 'node:crypto';

import type { DbProvider } from '../../db/index.js';
import type { SessionToken } from '../index.js';
import type { JwtSessionManagerImpl } from './jwt-manager.js';
import { hashPassword, verifyPassword } from './password.js';
import type { TotpServiceImpl } from './totp-service.js';
import type { WhitelistServiceImpl } from './whitelist-service.js';

export type LoginResult =
  | { type: 'session'; tokens: SessionToken; isTempPassword: boolean; isAdmin: boolean }
  | { type: 'totp_required'; challengeId: string; userId: string };

export type PasswordRecoveryResult = {
  adminToken: string;
  userId: string;
};

export interface AdminUserSummary {
  id: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  isTempPassword: boolean;
  createdAt: string;
}

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

    type UserRow = {
      id: string;
      password_hash: string;
      is_temp_password: boolean;
      is_admin: boolean;
      is_active: boolean;
    };
    const [user] = await this.db.query<UserRow>(
      'SELECT id, password_hash, is_temp_password, is_admin, is_active FROM users WHERE email = $1',
      [email],
    );
    if (!user) throw new Error('Invalid credentials');

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    if (!user.is_active) throw new Error('Account is disabled');

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
    return { type: 'session', tokens, isTempPassword: user.is_temp_password, isAdmin: user.is_admin };
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
    isAdmin = false,
  ): Promise<string> {
    const passwordHash = await hashPassword(rawPassword);
    type Row = { id: string };
    const [row] = await this.db.query<Row>(
      `INSERT INTO users (email, password_hash, is_temp_password, is_admin)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [email, passwordHash, isTempPassword, isAdmin],
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

  // ── 관리자: 사용자 관리 ─────────────────────────────────────────

  public async listUsers(): Promise<AdminUserSummary[]> {
    type Row = {
      id: string;
      email: string;
      is_admin: boolean;
      is_active: boolean;
      is_temp_password: boolean;
      created_at: string;
    };
    const rows = await this.db.query<Row>(
      `SELECT id, email, is_admin, is_active, is_temp_password, created_at
       FROM users
       ORDER BY created_at`,
    );
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      isAdmin: r.is_admin,
      isActive: r.is_active,
      isTempPassword: r.is_temp_password,
      createdAt: r.created_at,
    }));
  }

  public async findUserIdByEmail(email: string): Promise<string | null> {
    type Row = { id: string };
    const [row] = await this.db.query<Row>(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );
    return row?.id ?? null;
  }

  public async isUserAdmin(userId: string): Promise<boolean> {
    type Row = { is_admin: boolean };
    const [row] = await this.db.query<Row>(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId],
    );
    return row?.is_admin ?? false;
  }

  public async countAdmins(): Promise<number> {
    type Row = { count: string | number };
    const [row] = await this.db.query<Row>(
      'SELECT COUNT(*) AS count FROM users WHERE is_admin = TRUE AND is_active = TRUE',
    );
    return Number(row?.count ?? 0);
  }

  public async setUserActive(userId: string, isActive: boolean): Promise<void> {
    await this.db.query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
      [isActive, userId],
    );
  }

  public async setUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
    await this.db.query(
      'UPDATE users SET is_admin = $1, updated_at = NOW() WHERE id = $2',
      [isAdmin, userId],
    );
  }

  public async deleteUser(userId: string): Promise<void> {
    // ON DELETE CASCADE가 sessions / totp_credentials / totp_challenges /
    // password_recovery_tokens에 설정되어 있으므로 users 한 행 삭제로 정리됨.
    await this.db.query('DELETE FROM users WHERE id = $1', [userId]);
  }

  /**
   * 신규 사용자 생성 + 일회용 초대 토큰 발급.
   *
   * SMTP 미연결 단계의 기본 가입 흐름.
   * 비밀번호는 임의 hash로 채워 로그인 차단 → 사용자가 토큰으로 직접 비밀번호 설정.
   * 반환된 `inviteToken`은 1회만 화면에 표시하며 재호출 시 새 토큰을 발급한다.
   */
  public async createUserWithInvite(
    email: string,
    isAdmin = false,
  ): Promise<{ userId: string; inviteToken: string }> {
    const placeholderPassword = crypto.randomBytes(32).toString('hex');
    const userId = await this.createUser(email, placeholderPassword, true, isAdmin);
    const { adminToken } = await this.issueRecoveryToken(userId);
    return { userId, inviteToken: adminToken };
  }
}
