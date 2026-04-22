-- ── 005_add_user_language.sql ────────────────────────────────────
-- users 테이블에 언어 설정 컬럼 추가.
-- i18n 언어 코드 (예: 'ko', 'en') 를 서버에 저장해
-- 기기를 바꿔도 동일한 언어 설정이 유지되도록 한다.

ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
