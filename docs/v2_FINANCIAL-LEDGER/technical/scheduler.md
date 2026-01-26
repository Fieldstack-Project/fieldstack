# Scheduler 설계

## 개요

Scheduler는 Backend Plugin으로 구현되며, 모듈이 주기적인 작업을 등록하고 실행할 수 있도록 지원합니다.

## 아키텍처

```
apps/api/src/plugins/scheduler/
├── index.ts              # Scheduler 엔진
├── registry.ts           # 작업 등록 레지스트리
├── executor.ts           # 작업 실행기
└── types.ts              # 타입 정의
```

## 작업 등록 방식

모듈은 초기화 시 작업을 등록:

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

## 스케줄 표현식

Cron 표현식 사용:

- `* * * * *` - 매분
- `0 * * * *` - 매시간
- `0 0 * * *` - 매일 자정
- `0 0 1 * *` - 매월 1일
- `0 0 * * 0` - 매주 일요일

## 작업 예시

### 1. 월간 가계부 요약
```typescript
scheduler.register({
  name: 'ledger-monthly-summary',
  schedule: '0 9 1 * *',  // 매월 1일 오전 9시
  handler: async () => {
    const lastMonth = getLastMonth();
    const entries = await db.query('SELECT * FROM ledger_entries WHERE month = ?', [lastMonth]);
    const summary = calculateSummary(entries);
    await notifyUser(summary);
  }
});
```

### 2. 구독 결제일 체크
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

## 실행 로그

모든 작업 실행은 로그로 기록:

```typescript
{
  taskName: 'ledger-monthly-summary',
  executedAt: '2025-01-01T09:00:00Z',
  status: 'success',
  duration: 1234,  // ms
  error: null
}
```

## 관리 UI

설정 페이지에서 스케줄된 작업 관리:

- 등록된 작업 목록 조회
- 작업 활성화/비활성화
- 다음 실행 시간 확인
- 실행 히스토리 조회
- 수동 실행 트리거

## 통합 서비스 연계

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

## 에러 처리

작업 실패 시 재시도 정책:

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