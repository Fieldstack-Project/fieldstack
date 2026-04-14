-- ── 001_auth_schema.sql ─────────────────────────────────────────
-- Core 인증 스키마: users, sessions, totp, whitelist, admin_pin, recovery

CREATE TABLE IF NOT EXISTS users (
  id               {{UUID_PRIMARY_KEY}},
  email            TEXT        NOT NULL UNIQUE,
  password_hash    TEXT        NOT NULL,
  is_temp_password BOOLEAN     NOT NULL DEFAULT {{BOOLEAN_FALSE}},
  created_at       TIMESTAMPTZ NOT NULL DEFAULT {{NOW}},
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT {{NOW}}
);

CREATE TABLE IF NOT EXISTS sessions (
  id                 UUID        PRIMARY KEY,
  user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT        NOT NULL UNIQUE,
  expires_at         TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT {{NOW}}
);

CREATE TABLE IF NOT EXISTS totp_credentials (
  user_id    UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret     TEXT        NOT NULL,
  verified   BOOLEAN     NOT NULL DEFAULT {{BOOLEAN_FALSE}},
  created_at TIMESTAMPTZ NOT NULL DEFAULT {{NOW}}
);

CREATE TABLE IF NOT EXISTS totp_challenges (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT {{NOW}}
);

CREATE TABLE IF NOT EXISTS whitelist_rules (
  id         {{UUID_PRIMARY_KEY}},
  type       TEXT        NOT NULL CHECK (type IN ('email', 'domain')),
  value      TEXT        NOT NULL,
  enabled    BOOLEAN     NOT NULL DEFAULT {{BOOLEAN_TRUE}},
  created_at TIMESTAMPTZ NOT NULL DEFAULT {{NOW}}
);

-- 관리자 PIN (단일 행 보장)
CREATE TABLE IF NOT EXISTS admin_pin (
  id         INT         PRIMARY KEY DEFAULT 1,
  pin_hash   TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT {{NOW}},
  CHECK      (id = 1)
);

CREATE TABLE IF NOT EXISTS password_recovery_tokens (
  id         {{UUID_PRIMARY_KEY}},
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT {{BOOLEAN_FALSE}},
  created_at TIMESTAMPTZ NOT NULL DEFAULT {{NOW}}
);
