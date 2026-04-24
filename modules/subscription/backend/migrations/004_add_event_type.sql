-- ── 004_add_event_type.sql ───────────────────────────────────────
-- 가격 히스토리를 통합 히스토리 이벤트로 확장
-- event_type: price_change | cancelled | resumed | plan_change | memo

ALTER TABLE subscription_price_history
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'price_change';

CREATE INDEX IF NOT EXISTS idx_subscription_price_history_event_type
  ON subscription_price_history (event_type);
