-- ── 006_exchange_rates.sql ───────────────────────────────────────
-- 환율 캐시 테이블.
--
-- 외부 API(Frankfurter 등)에서 조회한 환율을 날짜·통화 쌍 기준으로 저장한다.
-- 동일 날짜·통화 쌍이 이미 존재하면 덮어쓰지 않고 재사용한다 (UNIQUE 제약).
-- Subscription 결제일 당일 환율 적용, 수동 수정 등에 사용된다.

CREATE TABLE IF NOT EXISTS exchange_rates (
  id          {{UUID_PRIMARY_KEY}},
  rate_date   DATE        NOT NULL,
  base        TEXT        NOT NULL,
  target      TEXT        NOT NULL,
  rate        NUMERIC(18, 6) NOT NULL,
  source      TEXT        NOT NULL DEFAULT 'frankfurter',
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT {{NOW}},
  UNIQUE (rate_date, base, target)
);

CREATE INDEX IF NOT EXISTS exchange_rates_date_pair_idx
  ON exchange_rates (rate_date, base, target);
