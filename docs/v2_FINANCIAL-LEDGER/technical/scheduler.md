# Scheduler 설계

> 📖 **관련 아키텍처:**  
> → `architecture/overview.md § Plugin Layer` - Scheduler는 Backend Plugin으로 구현  
> → `modules/system-design.md § 모듈 생명주기` - initialize() Hook에서 작업 등록

**최종 업데이트:** 2025-01-29

---

## 개요

Scheduler는 **Backend Plugin**으로 구현되며, 모듈이 주기적인 작업을 등록하고 실행할 수 있도록 지원합니다.

---

## 아키텍처

```
apps/api/src/plugins/scheduler/
├── index.ts              # Scheduler 엔진
├── registry.ts           # 작업 등록 레지스트리
├── executor.ts           # 작업 실행기
└── types.ts              # 타입 정의
```

---

## 작업 등록 방식

> 📖 **모듈 초기화:**  
> → `modules/development-guide.md § Backend 개발 § index.ts`  
> → `modules/system-design.md § 모듈 생명주기`

모듈은 **초기화 시 작업을 등록**:

```typescript
// modules/ledger/backend/index.ts
import { scheduler } from '@core/plugins/scheduler';

export function initialize() {
  // 월간 요약 작업 등록
  scheduler.register({
    name: 'ledger-monthly-summary',
    schedule: '0 0 1 * *',  // 매월 1일 자정
    handler: async () => {
      const summary = await generateMonthlySummary();
      await sendNotification(summary);
    }
  });
}
```

---

## 스케줄 표현식

**Cron 표현식 사용:**

```
┌───────────── 분 (0 - 59)
│ ┌───────────── 시 (0 - 23)
│ │ ┌───────────── 일 (1 - 31)
│ │ │ ┌───────────── 월 (1 - 12)
│ │ │ │ ┌───────────── 요일 (0 - 7, 0과 7은 일요일)
│ │ │ │ │
* * * * *
```

### 예시

- `* * * * *` - 매분
- `0 * * * *` - 매시간 정각
- `0 0 * * *` - 매일 자정
- `0 0 1 * *` - 매월 1일 자정
- `0 0 * * 0` - 매주 일요일 자정
- `0 9 * * 1-5` - 평일 오전 9시
- `*/15 * * * *` - 15분마다
- `0 */6 * * *` - 6시간마다

---

## 작업 예시

### 1. 월간 가계부 요약

```typescript
scheduler.register({
  name: 'ledger-monthly-summary',
  schedule: '0 9 1 * *',  // 매월 1일 오전 9시
  handler: async () => {
    const lastMonth = getLastMonth();
    const entries = await db.query(
      'SELECT * FROM ledger_entries WHERE month = ?', 
      [lastMonth]
    );
    
    const summary = calculateSummary(entries);
    await notifyUser(summary);
  }
});
```

### 2. 구독 결제일 체크

> 📖 **기본 모듈:**  
> → `modules/default-modules.md § Subscription`

```typescript
scheduler.register({
  name: 'subscription-payment-check',
  schedule: '0 9 * * *',  // 매일 오전 9시
  handler: async () => {
    const today = new Date();
    const dueSubscriptions = await db.query(
      'SELECT * FROM subscriptions WHERE payment_day = ?',
      [today.getDate()]
    );
    
    for (const sub of dueSubscriptions) {
      await sendPaymentReminder(sub);
    }
  }
});
```

### 3. 외주 정산 알림

```typescript
scheduler.register({
  name: 'project-settlement-reminder',
  schedule: '0 10 * * 1',  // 매주 월요일 오전 10시
  handler: async () => {
    const pendingProjects = await db.query(
      'SELECT * FROM projects WHERE status = "pending_settlement"'
    );
    
    await sendSettlementReminder(pendingProjects);
  }
});
```

### 4. Google Drive 자동 백업

> 📖 **통합 서비스:**  
> → `modules/integrations.md § Google Drive`

```typescript
scheduler.register({
  name: 'backup-to-drive',
  schedule: '0 2 * * *',  // 매일 새벽 2시
  handler: async () => {
    const backup = await createDatabaseBackup();
    await uploadToGoogleDrive(backup);
  }
});
```

### 5. Slack 리포트 전송

> 📖 **통합 서비스:**  
> → `modules/integrations.md § Slack`

```typescript
scheduler.register({
  name: 'weekly-slack-report',
  schedule: '0 9 * * 1',  // 매주 월요일 오전 9시
  handler: async () => {
    const weeklyStats = await generateWeeklyStats();
    await sendToSlack(weeklyStats);
  }
});
```

---

## 실행 로그

모든 작업 실행은 로그로 기록:

```typescript
interface ExecutionLog {
  taskName: string;
  executedAt: string;      // ISO 8601
  status: 'success' | 'failed';
  duration: number;        // ms
  error?: string;
}
```

### 로그 저장

```typescript
// apps/api/src/plugins/scheduler/executor.ts

async function executeTask(task: ScheduledTask) {
  const startTime = Date.now();
  let status: 'success' | 'failed' = 'success';
  let error: string | undefined;
  
  try {
    await task.handler();
  } catch (err) {
    status = 'failed';
    error = err.message;
    console.error(`❌ Task failed: ${task.name}`, err);
  }
  
  const duration = Date.now() - startTime;
  
  // 로그 저장
  await db.query(
    'INSERT INTO scheduler_logs (task_name, executed_at, status, duration, error) VALUES (?, ?, ?, ?, ?)',
    [task.name, new Date().toISOString(), status, duration, error]
  );
  
  console.log(`✓ Task executed: ${task.name} (${duration}ms)`);
}
```

---

## 관리 UI

설정 페이지에서 스케줄된 작업 관리:

### 기능

- ✅ 등록된 작업 목록 조회
- ✅ 작업 활성화/비활성화
- ✅ 다음 실행 시간 확인
- ✅ 실행 히스토리 조회
- ✅ 수동 실행 트리거

### UI 예시

```typescript
// apps/web/src/pages/Settings/Scheduler.tsx

import { Card, Table, Button, Switch } from '@core/ui';

export default function SchedulerSettings() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  
  useEffect(() => {
    fetchTasks();
  }, []);
  
  const fetchTasks = async () => {
    const response = await fetch('/api/scheduler/tasks');
    setTasks(await response.json());
  };
  
  const handleToggle = async (taskName: string, enabled: boolean) => {
    await fetch(`/api/scheduler/tasks/${taskName}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
    
    fetchTasks();
  };
  
  const handleRunNow = async (taskName: string) => {
    await fetch(`/api/scheduler/tasks/${taskName}/run`, {
      method: 'POST'
    });
    
    notify.success('작업이 실행되었습니다');
  };
  
  return (
    <Card title="스케줄된 작업">
      <Table
        columns={[
          { key: 'name', label: '작업명' },
          { key: 'schedule', label: '스케줄' },
          { key: 'nextRun', label: '다음 실행' },
          { 
            key: 'enabled', 
            label: '활성화',
            render: (task) => (
              <Switch
                checked={task.enabled}
                onChange={(enabled) => handleToggle(task.name, enabled)}
              />
            )
          },
          {
            key: 'actions',
            label: '작업',
            render: (task) => (
              <Button 
                size="sm"
                onClick={() => handleRunNow(task.name)}
              >
                지금 실행
              </Button>
            )
          }
        ]}
        data={tasks}
      />
    </Card>
  );
}
```

---

## 통합 서비스 연계

> 📖 **외부 서비스 통합:**  
> → `modules/integrations.md`

Scheduler는 통합 서비스와 함께 사용하여 강력한 자동화 구현:

```typescript
scheduler.register({
  name: 'automated-workflow',
  schedule: '0 18 * * 5',  // 매주 금요일 오후 6시
  handler: async () => {
    // 1. 주간 데이터 수집
    const weeklyData = await collectWeeklyData();
    
    // 2. AI로 분석
    const analysis = await ai.analyze(weeklyData);
    
    // 3. 리포트 생성
    const report = generateReport(analysis);
    
    // 4. Google Drive에 저장
    await googleDrive.upload(report);
    
    // 5. Slack으로 알림
    await slack.notify('주간 리포트가 생성되었습니다');
    
    // 6. 이메일 발송
    await email.send(report);
  }
});
```

---

## 에러 처리

### 재시도 정책

```typescript
scheduler.register({
  name: 'critical-task',
  schedule: '0 * * * *',
  retries: 3,              // 최대 3회 재시도
  retryDelay: 300000,      // 5분 후 재시도
  onError: async (error) => {
    // 실패 알림
    await notifyAdmin({
      task: 'critical-task',
      error: error.message
    });
  }
});
```

### 구현

```typescript
// apps/api/src/plugins/scheduler/executor.ts

async function executeWithRetry(task: ScheduledTask) {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= (task.retries || 0); attempt++) {
    try {
      await task.handler();
      return; // 성공
      
    } catch (error) {
      lastError = error;
      
      if (attempt < (task.retries || 0)) {
        console.log(`⚠️ Retry ${attempt + 1}/${task.retries}: ${task.name}`);
        await sleep(task.retryDelay || 60000);
      }
    }
  }
  
  // 모든 재시도 실패
  if (task.onError) {
    await task.onError(lastError);
  }
  
  throw lastError;
}
```

---

## Scheduler 엔진 구현

```typescript
// apps/api/src/plugins/scheduler/index.ts

import cron from 'node-cron';

interface ScheduledTask {
  name: string;
  schedule: string;        // Cron 표현식
  handler: () => Promise<void>;
  enabled?: boolean;
  retries?: number;
  retryDelay?: number;
  onError?: (error: Error) => Promise<void>;
}

class Scheduler {
  private tasks = new Map<string, ScheduledTask>();
  private jobs = new Map<string, cron.ScheduledTask>();
  
  register(task: ScheduledTask) {
    // 기본값 설정
    task.enabled = task.enabled !== false;
    
    // 등록
    this.tasks.set(task.name, task);
    
    // Cron 작업 시작
    if (task.enabled) {
      this.startJob(task);
    }
    
    console.log(`✓ Task registered: ${task.name} (${task.schedule})`);
  }
  
  private startJob(task: ScheduledTask) {
    const job = cron.schedule(task.schedule, async () => {
      console.log(`▶ Running task: ${task.name}`);
      await executeTask(task);
    });
    
    this.jobs.set(task.name, job);
  }
  
  unregister(name: string) {
    const job = this.jobs.get(name);
    
    if (job) {
      job.stop();
      this.jobs.delete(name);
    }
    
    this.tasks.delete(name);
    console.log(`✓ Task unregistered: ${name}`);
  }
  
  async runNow(name: string) {
    const task = this.tasks.get(name);
    
    if (!task) {
      throw new Error(`Task not found: ${name}`);
    }
    
    console.log(`▶ Manual run: ${name}`);
    await executeTask(task);
  }
  
  getTask(name: string): ScheduledTask | undefined {
    return this.tasks.get(name);
  }
  
  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }
  
  toggle(name: string, enabled: boolean) {
    const task = this.tasks.get(name);
    
    if (!task) {
      throw new Error(`Task not found: ${name}`);
    }
    
    task.enabled = enabled;
    
    if (enabled) {
      this.startJob(task);
    } else {
      const job = this.jobs.get(name);
      if (job) {
        job.stop();
        this.jobs.delete(name);
      }
    }
    
    console.log(`✓ Task ${enabled ? 'enabled' : 'disabled'}: ${name}`);
  }
}

// 전역 인스턴스
export const scheduler = new Scheduler();
```

---

## API 엔드포인트

```typescript
// apps/api/src/routes/scheduler.ts

import { Router } from 'express';
import { scheduler } from '../plugins/scheduler';

const router = Router();

// 작업 목록 조회
router.get('/tasks', async (req, res) => {
  const tasks = scheduler.getAllTasks();
  
  res.json(tasks.map(task => ({
    name: task.name,
    schedule: task.schedule,
    enabled: task.enabled,
    nextRun: getNextRunTime(task.schedule)
  })));
});

// 작업 활성화/비활성화
router.post('/tasks/:name/toggle', async (req, res) => {
  const { enabled } = req.body;
  
  scheduler.toggle(req.params.name, enabled);
  
  res.json({ success: true });
});

// 수동 실행
router.post('/tasks/:name/run', async (req, res) => {
  try {
    await scheduler.runNow(req.params.name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 실행 히스토리
router.get('/tasks/:name/history', async (req, res) => {
  const logs = await db.query(
    'SELECT * FROM scheduler_logs WHERE task_name = ? ORDER BY executed_at DESC LIMIT 100',
    [req.params.name]
  );
  
  res.json(logs);
});

export default router;
```

---

## 모듈 종료 시 정리

> 📖 **모듈 생명주기:**  
> → `modules/system-design.md § 모듈 생명주기 § shutdown()`

```typescript
// modules/ledger/backend/index.ts

export function shutdown() {
  // Scheduler 작업 제거
  scheduler.unregister('ledger-monthly-summary');
  
  console.log('Ledger module shutdown complete');
}
```

---

## 다음 실행 시간 계산

```typescript
import parser from 'cron-parser';

function getNextRunTime(cronExpression: string): Date {
  const interval = parser.parseExpression(cronExpression);
  return interval.next().toDate();
}

// 사용
const nextRun = getNextRunTime('0 9 * * *');
console.log(`Next run: ${nextRun.toISOString()}`);
```

---

## 타임존 처리

```typescript
import parser from 'cron-parser';

const options = {
  currentDate: new Date(),
  tz: 'Asia/Seoul'  // 타임존 설정
};

const interval = parser.parseExpression('0 9 * * *', options);
const nextRun = interval.next().toDate();
```

---

## 모니터링

### 대시보드

```typescript
// apps/web/src/pages/Scheduler/Dashboard.tsx

export default function SchedulerDashboard() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    successRate: 0,
    lastExecution: null
  });
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="전체 작업" value={stats.totalTasks} />
      <StatCard title="활성 작업" value={stats.activeTasks} />
      <StatCard title="성공률" value={`${stats.successRate}%`} />
      <StatCard title="마지막 실행" value={stats.lastExecution} />
    </div>
  );
}
```

### 알림

```typescript
// 작업 실패 시 알림
scheduler.register({
  name: 'important-task',
  schedule: '0 0 * * *',
  onError: async (error) => {
    await sendEmail({
      to: 'admin@example.com',
      subject: '작업 실패 알림',
      body: `작업이 실패했습니다: ${error.message}`
    });
  }
});
```

---

## 성능 최적화

### 병렬 실행 제한

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // 최대 5개 동시 실행

async function executeAllPendingTasks() {
  const tasks = getPendingTasks();
  
  await Promise.all(
    tasks.map(task => limit(() => executeTask(task)))
  );
}
```

### 중복 실행 방지

```typescript
const runningTasks = new Set<string>();

async function executeTask(task: ScheduledTask) {
  if (runningTasks.has(task.name)) {
    console.log(`⚠️ Task already running: ${task.name}`);
    return;
  }
  
  runningTasks.add(task.name);
  
  try {
    await task.handler();
  } finally {
    runningTasks.delete(task.name);
  }
}
```

---

## 📚 관련 문서

### 아키텍처
- 📖 `architecture/overview.md § Plugin Layer` - Scheduler의 위치
- 📖 `modules/system-design.md § 모듈 생명주기` - 작업 등록 시점

### 모듈 개발
- 📖 `modules/development-guide.md § Backend § index.ts` - 초기화 Hook
- 📖 `modules/default-modules.md § Subscription` - Scheduler 사용 예시

### 통합 서비스
- 📖 `modules/integrations.md` - 자동화 워크플로우

### 배포
- 📖 `deployment/updates.md § 자동 업데이트` - Scheduler 활용

---

## 🚀 다음 단계

Scheduler를 이해했다면:

1. **모듈 개발** → `modules/development-guide.md`
2. **통합 서비스** → `modules/integrations.md`
3. **자동화 구축** → 워크플로우 설계