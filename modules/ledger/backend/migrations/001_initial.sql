-- ── 001_initial.sql ───────────────────────────────────────────
-- Ledger 모듈 초기 스키마: 카테고리, 결제 수단, 가계부 항목

-- ── 카테고리 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_categories (
  id          {{UUID_PRIMARY_KEY}},
  user_id     UUID        NOT NULL,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  color       TEXT,
  icon        TEXT,
  is_default  BOOLEAN     NOT NULL DEFAULT {{BOOLEAN_FALSE}},
  created_at  TIMESTAMPTZ NOT NULL DEFAULT {{NOW}}
);

CREATE INDEX IF NOT EXISTS idx_ledger_categories_user_id ON ledger_categories(user_id);

-- ── 결제 수단 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_payment_methods (
  id          {{UUID_PRIMARY_KEY}},
  user_id     UUID        NOT NULL,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('cash', 'credit_card', 'debit_card', 'transfer', 'other')),
  is_default  BOOLEAN     NOT NULL DEFAULT {{BOOLEAN_FALSE}},
  created_at  TIMESTAMPTZ NOT NULL DEFAULT {{NOW}}
);

CREATE INDEX IF NOT EXISTS idx_ledger_payment_methods_user_id ON ledger_payment_methods(user_id);

-- ── 가계부 항목 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_entries (
  id                  {{UUID_PRIMARY_KEY}},
  user_id             UUID           NOT NULL,
  date                DATE           NOT NULL,
  amount              DECIMAL(15,2)  NOT NULL CHECK (amount > 0),
  type                TEXT           NOT NULL CHECK (type IN ('income', 'expense')),
  category_id         UUID,
  description         TEXT           NOT NULL DEFAULT '',
  payment_method_id   UUID,
  notes               TEXT,
  tags                TEXT,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT {{NOW}},
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT {{NOW}}
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_id ON ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date    ON ledger_entries(date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type    ON ledger_entries(type);
