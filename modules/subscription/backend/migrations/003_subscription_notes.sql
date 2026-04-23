-- ── 003_subscription_notes.sql ──────────────────────────────────
-- 구독별 메모 테이블

CREATE TABLE IF NOT EXISTS subscription_notes (
  id               {{UUID_PRIMARY_KEY}},
  subscription_id  UUID           NOT NULL REFERENCES subscription_services(id) ON DELETE CASCADE,
  content          TEXT           NOT NULL,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT {{NOW}}
);

CREATE INDEX IF NOT EXISTS idx_subscription_notes_subscription_id
  ON subscription_notes (subscription_id);
