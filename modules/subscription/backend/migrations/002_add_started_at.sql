-- ── 002_add_started_at.sql ───────────────────────────────────────
-- subscription_services 테이블에 구독 시작일 컬럼 추가

ALTER TABLE subscription_services
  ADD COLUMN IF NOT EXISTS started_at DATE NOT NULL DEFAULT CURRENT_DATE;
