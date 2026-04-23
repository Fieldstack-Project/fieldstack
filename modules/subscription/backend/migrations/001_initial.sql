-- ── 001_initial.sql ─────────────────────────────────────────────
-- Subscription 모듈 초기 스키마: 구독 서비스 · 가격 히스토리

-- ── 구독 서비스 ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_services (
  id                {{UUID_PRIMARY_KEY}},
  user_id           UUID           NOT NULL,
  service_name      TEXT           NOT NULL,
  current_amount    DECIMAL(15,2)  NOT NULL CHECK (current_amount >= 0),
  currency          TEXT           NOT NULL DEFAULT 'KRW',
  billing_cycle     TEXT           NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  billing_day       INTEGER        NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
  started_at        DATE           NOT NULL DEFAULT CURRENT_DATE,
  next_payment_date DATE           NOT NULL,
  is_active         BOOLEAN        NOT NULL DEFAULT {{BOOLEAN_FALSE}},
  cancelled_at      DATE,
  category          TEXT,
  description       TEXT,
  url               TEXT,
  tags              TEXT,            -- JSON 배열 문자열
  total_paid        DECIMAL(15,2)  NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT {{NOW}},
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT {{NOW}}
);

CREATE INDEX IF NOT EXISTS idx_subscription_services_user_id
  ON subscription_services (user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_services_next_payment
  ON subscription_services (next_payment_date);

-- ── 가격 히스토리 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_price_history (
  id               {{UUID_PRIMARY_KEY}},
  subscription_id  UUID           NOT NULL REFERENCES subscription_services(id) ON DELETE CASCADE,
  effective_date   DATE           NOT NULL,
  amount           DECIMAL(15,2)  NOT NULL CHECK (amount >= 0),
  currency         TEXT           NOT NULL DEFAULT 'KRW',
  reason           TEXT,
  note             TEXT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT {{NOW}}
);

CREATE INDEX IF NOT EXISTS idx_subscription_price_history_subscription_id
  ON subscription_price_history (subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_price_history_effective_date
  ON subscription_price_history (effective_date);
