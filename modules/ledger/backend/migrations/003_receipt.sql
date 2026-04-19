-- Migration 003: 가계부 항목 영수증 경로 추가
ALTER TABLE ledger_entries ADD COLUMN receipt_path TEXT;
