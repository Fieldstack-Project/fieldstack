-- ── 004_add_user_modules.sql ────────────────────────────────────
-- 유저별 모듈 활성화 설정 테이블.
--
-- 서버 레지스트리(ModuleRegistry, 전역)와 유저 설정(개인)을 분리한다:
-- - 모듈 설치: 일반 유저도 가능 (마켓플레이스 → 서버 레지스트리 등록)
-- - 모듈 제거: 관리자 전용 (레지스트리 해제 + 전체 유저 레코드 삭제)
-- - 모듈 활성화/비활성화: 각 유저 본인

CREATE TABLE IF NOT EXISTS user_modules (
  id           {{UUID_PRIMARY_KEY}},
  user_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_name  TEXT        NOT NULL,
  enabled      BOOLEAN     NOT NULL DEFAULT {{BOOLEAN_TRUE}},
  installed_at TEXT        NOT NULL DEFAULT ({{NOW}}),
  UNIQUE (user_id, module_name)
);
