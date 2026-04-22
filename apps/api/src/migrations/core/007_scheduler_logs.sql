-- ── 007_scheduler_logs.sql ───────────────────────────────────────
-- Core Scheduler 실행 로그 테이블.
-- 모든 스케줄 작업의 실행 결과(성공·실패·소요 시간·에러)를 기록한다.

CREATE TABLE IF NOT EXISTS scheduler_logs (
  id           {{UUID_PRIMARY_KEY}},
  task_name    TEXT           NOT NULL,
  executed_at  TIMESTAMPTZ    NOT NULL DEFAULT {{NOW}},
  success      BOOLEAN        NOT NULL DEFAULT {{BOOLEAN_FALSE}},
  duration_ms  INTEGER        NOT NULL,
  error        TEXT,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT {{NOW}}
);

CREATE INDEX IF NOT EXISTS scheduler_logs_task_name_idx
  ON scheduler_logs (task_name);

CREATE INDEX IF NOT EXISTS scheduler_logs_executed_at_idx
  ON scheduler_logs (executed_at DESC);
