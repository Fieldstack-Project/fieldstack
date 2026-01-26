# 기본 제공 Modules (MVP)

## Ledger (가계부)

### 기능 개요
수입과 지출을 기록하고 관리하는 기본 가계부 모듈

### 데이터 구조

```typescript
interface LedgerEntry {
  id: string;
  userId: string;
  date: Date;
  amount: number;        // 양수: 수입, 음수: 지출
  category: string;      // 식비, 교통비, 월급 등
  description: string;
  paymentMethod: string; // 현금, 카드, 계좌이체 등
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 주요 기능

#### 1. 수입/지출 기록
- 날짜, 금액, 카테고리 입력
- 메모 및 태그 추가
- 영수증 사진 첨부 (선택)

#### 2. 카테고리 관리
- 기본 카테고리: 식비, 교통비, 쇼핑, 의료, 문화생활 등
- 사용자 정의 카테고리 추가/수정
- 카테고리별 예산 설정

#### 3. 결제 수단
- 현금
- 신용카드
- 체크카드
- 계좌이체
- 사용자 정의 결제 수단

#### 4. 통계 및 분석
- 월별/연도별 수입/지출 요약
- 카테고리별 지출 분석
- 차트 시각화 (파이 차트, 막대 그래프)
- AI 기반 지출 패턴 분석 (선택)

### API 엔드포인트

```
GET    /api/ledger/entries         # 목록 조회
GET    /api/ledger/entries/:id     # 상세 조회
POST   /api/ledger/entries         # 신규 생성
PUT    /api/ledger/entries/:id     # 수정
DELETE /api/ledger/entries/:id     # 삭제
GET    /api/ledger/summary          # 요약 통계
GET    /api/ledger/categories       # 카테고리 목록
```

---

## Subscription (정기 구독)

### 기능 개요
Netflix, Spotify 등 정기 구독 서비스를 관리하고 결제일을 추적

### 데이터 구조

```typescript
interface Subscription {
  id: string;
  userId: string;
  serviceName: string;     // Netflix, Spotify 등
  amount: number;
  currency: string;        // KRW, USD 등
  billingCycle: 'monthly' | 'yearly';
  billingDay: number;      // 1-31
  nextPaymentDate: Date;
  isActive: boolean;
  category: string;        // 스트리밍, 클라우드, 게임 등
  description: string;
  url: string;             // 구독 관리 페이지 링크
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 주요 기능

#### 1. 구독 관리
- 구독 서비스 등록
- 금액, 결제 주기, 결제일 입력
- 구독 활성화/비활성화
- 구독 해지일 기록

#### 2. 결제 알림
- 결제일 D-7, D-3, D-1 알림
- 이메일/푸시 알림 지원
- Slack 알림 연동 (선택)

#### 3. Google Calendar 연동
- 결제일을 자동으로 Google Calendar에 등록
- 캘린더에서 바로 확인 가능
- 결제일 변경 시 자동 동기화

#### 4. 통계
- 월간/연간 총 구독료 계산
- 카테고리별 구독료 분석
- 구독 서비스 수 추적
- 가장 비싼 구독 서비스 표시

### API 엔드포인트

```
GET    /api/subscription/services         # 목록 조회
GET    /api/subscription/services/:id     # 상세 조회
POST   /api/subscription/services         # 신규 생성
PUT    /api/subscription/services/:id     # 수정
DELETE /api/subscription/services/:id     # 삭제
GET    /api/subscription/summary           # 요약 통계
POST   /api/subscription/sync-calendar     # Calendar 동기화
```

### Google Calendar 연동 구현

```typescript
// modules/subscription/backend/calendar.ts
import { google } from 'googleapis';

export async function syncToGoogleCalendar(subscription: Subscription) {
  const calendar = google.calendar('v3');
  
  // 결제일 이벤트 생성
  await calendar.events.insert({
    calendarId: 'primary',
    resource: {
      summary: `💳 ${subscription.serviceName} 결제일`,
      description: `금액: ${subscription.amount}원`,
      start: {
        date: subscription.nextPaymentDate
      },
      end: {
        date: subscription.nextPaymentDate
      },
      recurrence: [
        subscription.billingCycle === 'monthly' 
          ? 'RRULE:FREQ=MONTHLY'
          : 'RRULE:FREQ=YEARLY'
      ]
    }
  });
}
```

---

## 두 모듈의 연동

### Subscription → Ledger 자동 기록

구독 결제일에 자동으로 가계부에 지출 기록:

```typescript
// modules/subscription/backend/index.ts
import { eventBus } from '@core/events';

scheduler.register({
  name: 'subscription-auto-record',
  schedule: '0 0 * * *',  // 매일 자정
  handler: async () => {
    const today = new Date();
    const dueSubscriptions = await getDueSubscriptions(today);
    
    for (const sub of dueSubscriptions) {
      // Ledger 모듈에 이벤트 발행
      eventBus.emit('subscription:payment', {
        amount: -sub.amount,
        category: 'subscription',
        description: `${sub.serviceName} 구독료`,
        date: today
      });
    }
  }
});
```

```typescript
// modules/ledger/backend/index.ts
export function initialize() {
  eventBus.on('subscription:payment', async (data) => {
    await createLedgerEntry(data);
    console.log(`✅ 구독료 자동 기록: ${data.description}`);
  });
}
```

---

## UI 예시

### Ledger 목록 화면

```typescript
import { PageLayout, DataTable, Button } from '@core/ui';

export default function LedgerList() {
  return (
    <PageLayout
      title="가계부"
      actions={
        <Button variant="primary" onClick={handleCreate}>
          + 추가
        </Button>
      }
    >
      <DataTable
        columns={[
          { key: 'date', label: '날짜', sortable: true },
          { key: 'category', label: '카테고리' },
          { key: 'description', label: '내용' },
          { key: 'amount', label: '금액', sortable: true }
        ]}
        data={entries}
        searchable
        filterable
        pagination
      />
    </PageLayout>
  );
}
```

### Subscription 대시보드

```typescript
import { PageLayout, Card, StatCard } from '@core/ui';

export default function SubscriptionDashboard() {
  return (
    <PageLayout title="구독 관리">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="월간 구독료"
          value={`${monthlyTotal.toLocaleString()}원`}
          icon="💰"
        />
        <StatCard
          title="활성 구독"
          value={`${activeCount}개`}
          icon="📱"
        />
        <StatCard
          title="다음 결제일"
          value={nextPaymentDate}
          icon="📅"
        />
      </div>
      
      <Card title="구독 목록">
        {subscriptions.map(sub => (
          <SubscriptionCard key={sub.id} subscription={sub} />
        ))}
      </Card>
    </PageLayout>
  );
}
```