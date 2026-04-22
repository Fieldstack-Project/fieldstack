import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';

import type { DbProvider } from '@fieldstack/core' with { 'resolution-mode': 'import' };

import { log } from '../../middleware/logger';
import type { TaskDefinition, TaskInfo, TaskRecord } from './types';

const DEFAULT_TIMEZONE = 'Asia/Seoul';

// ── Scheduler 싱글턴 ──────────────────────────────────────────────
//
// 모듈이 주기적 작업을 등록하고 실행할 수 있는 코어 인프라.
// AppServices를 통해 주입되므로 모듈은 @fieldstack/core를 직접 import하지 않아도 된다.
//
// 사용 예:
//   // 모듈 초기화 시
//   services.scheduler.register({
//     name: 'subscription-payment-check',
//     cronExpr: '0 0 * * *',
//     handler: async () => { ... },
//   });
//
//   // 모듈 종료 시
//   services.scheduler.unregister('subscription-payment-check');

export class Scheduler {
  private static _instance: Scheduler | null = null;

  private readonly tasks = new Map<string, TaskRecord>();
  private readonly cronJobs = new Map<string, ScheduledTask>();
  private readonly runningTasks = new Set<string>();

  private db: DbProvider | null = null;

  private constructor() {}

  public static getInstance(): Scheduler {
    if (!Scheduler._instance) {
      Scheduler._instance = new Scheduler();
    }
    return Scheduler._instance;
  }

  /** DB 프로바이더 주입 (initServices에서 호출) */
  public setDb(db: DbProvider): void {
    this.db = db;
  }

  // ── 등록 / 해제 ────────────────────────────────────────────────

  public register(def: TaskDefinition): void {
    if (this.tasks.has(def.name)) {
      log.warn('scheduler', `task "${def.name}" already registered — skipping`);
      return;
    }

    if (!cron.validate(def.cronExpr)) {
      log.error('scheduler', `task "${def.name}" has invalid cron expression: "${def.cronExpr}"`);
      return;
    }

    const record: TaskRecord = {
      name: def.name,
      cronExpr: def.cronExpr,
      handler: def.handler,
      enabled: def.enabled ?? true,
      timezone: def.timezone ?? DEFAULT_TIMEZONE,
      retries: def.retries ?? 0,
      retryDelay: def.retryDelay ?? 5000,
      onError: def.onError,
      registeredAt: new Date().toISOString(),
    };

    this.tasks.set(def.name, record);

    if (record.enabled) {
      this.startJob(record);
    }

    log.success('scheduler', `task "${def.name}" registered (${def.cronExpr})`);
  }

  public unregister(name: string): boolean {
    const job = this.cronJobs.get(name);
    if (job) {
      job.stop();
      this.cronJobs.delete(name);
    }

    const existed = this.tasks.delete(name);
    if (existed) {
      log.info('scheduler', `task "${name}" unregistered`);
    }
    return existed;
  }

  // ── 제어 ───────────────────────────────────────────────────────

  /** 스케줄과 무관하게 즉시 실행 */
  public async runNow(name: string): Promise<void> {
    const record = this.tasks.get(name);
    if (!record) {
      throw new Error(`scheduler: task "${name}" not found`);
    }
    await this.execute(record);
  }

  /** 활성화/비활성화 토글 */
  public toggle(name: string, enabled: boolean): boolean {
    const record = this.tasks.get(name);
    if (!record) return false;

    record.enabled = enabled;

    if (enabled) {
      if (!this.cronJobs.has(name)) {
        this.startJob(record);
      }
      log.info('scheduler', `task "${name}" enabled`);
    } else {
      const job = this.cronJobs.get(name);
      if (job) {
        job.stop();
        this.cronJobs.delete(name);
      }
      log.info('scheduler', `task "${name}" disabled`);
    }

    return true;
  }

  /** graceful shutdown — 모든 cron 작업 중지 */
  public stopAll(): void {
    for (const [name, job] of this.cronJobs) {
      job.stop();
      log.info('scheduler', `task "${name}" stopped`);
    }
    this.cronJobs.clear();
    log.info('scheduler', `all tasks stopped`);
  }

  // ── 조회 ───────────────────────────────────────────────────────

  public list(): TaskInfo[] {
    return Array.from(this.tasks.values()).map((r) => ({
      name: r.name,
      cronExpr: r.cronExpr,
      enabled: r.enabled,
      timezone: r.timezone,
      registeredAt: r.registeredAt,
    }));
  }

  public getTask(name: string): TaskInfo | undefined {
    const r = this.tasks.get(name);
    if (!r) return undefined;
    return {
      name: r.name,
      cronExpr: r.cronExpr,
      enabled: r.enabled,
      timezone: r.timezone,
      registeredAt: r.registeredAt,
    };
  }

  /** 특정 작업의 최근 실행 로그 조회 */
  public async getLogs(name: string, limit = 100): Promise<unknown[]> {
    if (!this.db) return [];
    try {
      const rows = await this.db.query(
        `SELECT task_name, executed_at, success, duration_ms, error
         FROM scheduler_logs
         WHERE task_name = $1
         ORDER BY executed_at DESC
         LIMIT $2`,
        [name, limit],
      );
      return rows;
    } catch {
      return [];
    }
  }

  // ── 내부 ───────────────────────────────────────────────────────

  private startJob(record: TaskRecord): void {
    const job = cron.schedule(
      record.cronExpr,
      async () => {
        await this.execute(record);
      },
      {
        timezone: record.timezone,
        runOnInit: false,
      },
    );
    this.cronJobs.set(record.name, job);
  }

  private async execute(record: TaskRecord): Promise<void> {
    if (this.runningTasks.has(record.name)) {
      log.warn('scheduler', `task "${record.name}" already running — skipping`);
      return;
    }

    this.runningTasks.add(record.name);
    const startedAt = Date.now();
    let success = false;
    let errorMessage: string | null = null;

    try {
      await this.executeWithRetry(record);
      success = true;
      log.success('scheduler', `task "${record.name}" completed (${Date.now() - startedAt}ms)`);
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      log.error('scheduler', `task "${record.name}" failed: ${errorMessage}`);
      record.onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      this.runningTasks.delete(record.name);
      await this.writeLog(record.name, startedAt, success, errorMessage);
    }
  }

  private async executeWithRetry(record: TaskRecord): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= record.retries; attempt++) {
      try {
        await record.handler();
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < record.retries) {
          log.warn(
            'scheduler',
            `task "${record.name}" attempt ${attempt + 1}/${record.retries + 1} failed — retrying in ${record.retryDelay}ms`,
          );
          await delay(record.retryDelay);
        }
      }
    }

    throw lastError;
  }

  private async writeLog(
    taskName: string,
    startedAt: number,
    success: boolean,
    error: string | null,
  ): Promise<void> {
    if (!this.db) return;
    try {
      const durationMs = Date.now() - startedAt;
      await this.db.query(
        `INSERT INTO scheduler_logs (task_name, success, duration_ms, error)
         VALUES ($1, $2, $3, $4)`,
        [taskName, success, durationMs, error],
      );
    } catch (err) {
      log.warn('scheduler', `failed to write log for task "${taskName}": ${String(err)}`);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
