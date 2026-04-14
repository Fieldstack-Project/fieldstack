-- ── 002_shared_links.sql ────────────────────────────────────────
-- 공유 링크 + 접근 로그 + 시스템 설정 테이블

CREATE TABLE IF NOT EXISTS system_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT {{NOW}}
);

-- 초기값: 공유 링크 on (도메인 감지는 서버 시작 시 별도 검사)
INSERT INTO system_settings (key, value)
VALUES ('shared_links_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS shared_links (
  id             {{UUID_PRIMARY_KEY}},
  token          TEXT        NOT NULL UNIQUE,
  resource_type  TEXT        NOT NULL,
  resource_id    TEXT        NOT NULL,
  password_hash  TEXT,
  max_access     INTEGER,
  access_count   INTEGER     NOT NULL DEFAULT 0,
  expires_at     TIMESTAMPTZ,
  created_by     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT {{NOW}},
  revoked_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS shared_link_logs (
  id           {{UUID_PRIMARY_KEY}},
  token        TEXT        NOT NULL,
  accessed_at  TIMESTAMPTZ NOT NULL DEFAULT {{NOW}},
  ip_address   TEXT,
  user_agent   TEXT
);

CREATE INDEX IF NOT EXISTS idx_shared_link_logs_token
  ON shared_link_logs (token);
