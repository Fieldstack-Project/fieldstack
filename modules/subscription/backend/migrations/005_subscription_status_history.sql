-- ── 005_subscription_status_history.sql ────────────────────────────
-- 구독 상태 이력: 해지/재개 기록 (누적 계산 시 비활성 기간 제외용)

CREATE TABLE IF NOT EXISTS subscription_status_history (
  id              {{UUID_PRIMARY_KEY}},
  subscription_id UUID           NOT NULL REFERENCES subscription_services(id) ON DELETE CASCADE,
  status          TEXT           NOT NULL CHECK (status IN ('active', 'cancelled')),
  changed_at      DATE           NOT NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT {{NOW}}
);

CREATE INDEX IF NOT EXISTS idx_subscription_status_history_sub_id
  ON subscription_status_history (subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_status_history_changed_at
  ON subscription_status_history (changed_at);
