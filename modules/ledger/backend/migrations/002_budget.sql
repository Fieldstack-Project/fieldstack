-- Migration 002: 카테고리별 예산 한도 추가
ALTER TABLE ledger_categories ADD COLUMN budget_limit DECIMAL(15,2);
