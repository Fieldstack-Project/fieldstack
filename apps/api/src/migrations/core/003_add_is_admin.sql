-- ── 003_add_is_admin.sql ────────────────────────────────────────
-- users 테이블에 is_admin 컬럼 추가.
-- Setup 마법사에서 생성되는 첫 번째 계정은 관리자로 표시된다.

ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT {{BOOLEAN_FALSE}};
