-- ── 008_user_status.sql ─────────────────────────────────────────
-- users.is_active: 비활성 계정은 로그인 차단.
-- 기본값 TRUE로 시작해 기존 사용자는 자동 활성 상태 유지.

ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT {{BOOLEAN_TRUE}};
