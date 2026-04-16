import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';

import type { DbProvider } from '../db/index.js';
import type { SystemSettingsService } from './system-settings-service.js';

// 16바이트 = 128비트 난수 → hex 32자 토큰.
// URL에 포함되는 공개 식별자이므로 충돌 가능성이 충분히 낮아야 한다.
// 128비트는 UUID v4와 동일한 엔트로피로 보안상 적절한 수준이다.
const TOKEN_BYTES = 16; // 32자 hex
const SALT_ROUNDS = 12;

// ── 타입 ──────────────────────────────────────────────────────

export interface IssueSharedLinkOptions {
  resourceType: string;
  resourceId: string;
  createdBy: string;
  expiresAt?: string;      // ISO 8601
  password?: string;
  maxAccessCount?: number;
}

export interface SharedLinkRecord {
  id: string;
  token: string;
  resourceType: string;
  resourceId: string;
  maxAccess: number | null;
  accessCount: number;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  revokedAt: string | null;
}

export type SharedLinkAccessError =
  | 'NOT_FOUND'
  | 'REVOKED'
  | 'EXPIRED'
  | 'ACCESS_LIMIT_EXCEEDED'
  | 'PASSWORD_REQUIRED'
  | 'PASSWORD_MISMATCH';

export type SharedLinkAccessResult =
  | { ok: true; resourceType: string; resourceId: string }
  | { ok: false; error: SharedLinkAccessError };

// ── 서비스 ────────────────────────────────────────────────────

export class SharedLinkService {
  public constructor(
    private readonly db: DbProvider,
    private readonly settings: SystemSettingsService,
    private readonly publicUrl: string | null,
  ) {}

  // ── 도메인 가용성 확인 ────────────────────────────────────────

  public isAvailable(): boolean {
    if (!this.publicUrl) return false;
    try {
      const url = new URL(this.publicUrl);
      const host = url.hostname;
      // IP 주소 또는 localhost 차단 — 공유 링크는 외부에서 접근 가능한 도메인 필요.
      // IPv6는 현재 미지원. 추후 필요 시 /^[\dA-Fa-f:]+$/ 패턴 추가.
      if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  public buildPublicUrl(token: string): string {
    return `${this.publicUrl}/s/${token}`;
  }

  // ── 링크 발행 ─────────────────────────────────────────────────

  public async issue(opts: IssueSharedLinkOptions): Promise<{ token: string; url: string }> {
    const enabled = await this.settings.getBoolean('shared_links_enabled', true);
    // Object.assign으로 error.code를 설정 — 호출자가 instanceof 대신 code로 에러 종류를 판별한다.
    if (!enabled) throw Object.assign(new Error('Shared link feature is disabled'), { code: 'FEATURE_DISABLED' });
    if (!this.isAvailable()) throw Object.assign(new Error('Domain not configured'), { code: 'DOMAIN_REQUIRED' });

    const token = crypto.randomBytes(TOKEN_BYTES).toString('hex');
    const passwordHash = opts.password
      ? await bcrypt.hash(opts.password, SALT_ROUNDS)
      : null;

    await this.db.query(
      `INSERT INTO shared_links
         (token, resource_type, resource_id, password_hash, max_access, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        token,
        opts.resourceType,
        opts.resourceId,
        passwordHash,
        opts.maxAccessCount ?? null,
        opts.expiresAt ?? null,
        opts.createdBy,
      ],
    );

    return { token, url: this.buildPublicUrl(token) };
  }

  // ── 링크 접근 검증 ────────────────────────────────────────────

  public async access(
    token: string,
    password: string | undefined,
    ip: string,
    userAgent: string,
  ): Promise<SharedLinkAccessResult> {
    type Row = {
      id: string; resource_type: string; resource_id: string;
      password_hash: string | null; max_access: number | null;
      access_count: number; expires_at: string | null; revoked_at: string | null;
    };
    const [link] = await this.db.query<Row>(
      `SELECT id, resource_type, resource_id, password_hash, max_access,
              access_count, expires_at, revoked_at
       FROM shared_links WHERE token = $1`,
      [token],
    );

    if (!link) return { ok: false, error: 'NOT_FOUND' };
    if (link.revoked_at) return { ok: false, error: 'REVOKED' };
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return { ok: false, error: 'EXPIRED' };
    }
    if (link.max_access !== null && link.access_count >= link.max_access) {
      return { ok: false, error: 'ACCESS_LIMIT_EXCEEDED' };
    }
    if (link.password_hash) {
      if (!password) return { ok: false, error: 'PASSWORD_REQUIRED' };
      const match = await bcrypt.compare(password, link.password_hash);
      if (!match) return { ok: false, error: 'PASSWORD_MISMATCH' };
    }

    // 접근 카운트 증가 + 로그 기록
    await this.db.transaction(async (tx) => {
      await tx.query(
        'UPDATE shared_links SET access_count = access_count + 1 WHERE id = $1',
        [link.id],
      );
      await tx.query(
        'INSERT INTO shared_link_logs (token, ip_address, user_agent) VALUES ($1, $2, $3)',
        [token, ip, userAgent],
      );
    });

    return { ok: true, resourceType: link.resource_type, resourceId: link.resource_id };
  }

  // ── 링크 무효화 ───────────────────────────────────────────────

  public async revoke(token: string, requestedBy: string, isAdmin: boolean): Promise<void> {
    type Row = { created_by: string; revoked_at: string | null };
    const [link] = await this.db.query<Row>(
      'SELECT created_by, revoked_at FROM shared_links WHERE token = $1',
      [token],
    );
    if (!link) throw new Error('Link not found');
    if (link.revoked_at) throw new Error('Link already revoked');
    if (!isAdmin && link.created_by !== requestedBy) throw new Error('Forbidden');

    await this.db.query(
      'UPDATE shared_links SET revoked_at = NOW() WHERE token = $1',
      [token],
    );
  }

  // ── 내 링크 목록 ──────────────────────────────────────────────

  public async listByUser(userId: string): Promise<SharedLinkRecord[]> {
    type Row = {
      id: string; token: string; resource_type: string; resource_id: string;
      max_access: number | null; access_count: number;
      expires_at: string | null; created_by: string; created_at: string; revoked_at: string | null;
    };
    const rows = await this.db.query<Row>(
      `SELECT id, token, resource_type, resource_id, max_access, access_count,
              expires_at, created_by, created_at, revoked_at
       FROM shared_links WHERE created_by = $1
       ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map((r) => ({
      id: r.id,
      token: r.token,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      maxAccess: r.max_access,
      accessCount: r.access_count,
      expiresAt: r.expires_at,
      createdBy: r.created_by,
      createdAt: r.created_at,
      revokedAt: r.revoked_at,
    }));
  }
}
