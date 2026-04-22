// ── Core Scheduler 타입 정의 ──────────────────────────────────────

export interface TaskDefinition {
  /** 고유 작업 이름 (중복 등록 불가) */
  name: string;
  /** Cron 표현식 (5-field: 분 시 일 월 요일) */
  cronExpr: string;
  /** 실행할 핸들러 */
  handler: () => Promise<void> | void;
  /** 활성화 여부 (기본: true) */
  enabled?: boolean;
  /** 타임존 (기본: Asia/Seoul) */
  timezone?: string;
  /** 실패 시 최대 재시도 횟수 (기본: 0) */
  retries?: number;
  /** 재시도 간 대기 시간 ms (기본: 5000) */
  retryDelay?: number;
  /** 모든 재시도 실패 후 호출되는 콜백 */
  onError?: (error: Error) => void;
}

export interface TaskRecord {
  name: string;
  cronExpr: string;
  handler: () => Promise<void> | void;
  enabled: boolean;
  timezone: string;
  retries: number;
  retryDelay: number;
  onError?: (error: Error) => void;
  registeredAt: string;
}

export interface SchedulerLogEntry {
  taskName: string;
  executedAt: string;
  success: boolean;
  durationMs: number;
  error: string | null;
}

export interface TaskInfo {
  name: string;
  cronExpr: string;
  enabled: boolean;
  timezone: string;
  registeredAt: string;
}
