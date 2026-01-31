# 통합 서비스 시스템

> 📖 **아키텍처 위치:**  
> → `architecture/overview.md § Core Layer § AI Abstraction` - 통합 서비스 추상화  
> → `modules/system-design.md § 외부 서비스 통합` - 모듈에서의 사용

**최종 업데이트:** 2025-01-30

---

## 개요

Core는 다양한 외부 서비스와의 통합을 위한 추상화 레이어를 제공합니다. 모듈은 이를 활용하여 쉽게 외부 서비스를 연동할 수 있습니다.

> 💡 **설계 철학:**  
> → `architecture/core-principles.md § 5. 최소한의 의존성` - Core는 필수만, 모듈은 자유

---

## 아키텍처

```
packages/core/integrations/
├── base.ts              # 통합 기본 클래스
├── security.ts          # 토큰 암호화
├── google/
│   ├── calendar.ts
│   ├── drive.ts
│   ├── sheets.ts
│   ├── gmail.ts
│   └── tasks.ts
├── notion/
│   └── index.ts
├── slack/
│   └── index.ts
├── github/
│   └── index.ts
└── webhook.ts           # 커스텀 Webhook
```

> 📖 **디렉터리 구조:**  
> → `architecture/directory-structure.md § packages/core/integrations`

---

## 기본 인터페이스

> 📌 **Provider 패턴:**  
> → `technical/database.md § DB 추상화` - 동일한 추상화 패턴 사용

```typescript
// packages/core/integrations/base.ts

export interface Integration {
  name: string;
  authenticate(credentials: any): Promise<void>;
  isAuthenticated(): boolean;
  disconnect(): Promise<void>;
}

export abstract class BaseIntegration implements Integration {
  protected credentials: any;
  
  abstract name: string;
  
  async authenticate(credentials: any) {
    this.credentials = await encrypt(credentials);
  }
  
  isAuthenticated(): boolean {
    return !!this.credentials;
  }
  
  async disconnect() {
    this.credentials = null;
  }
}
```

---

## Google 서비스 통합

### Google Calendar

> 📖 **실제 사용 예시:**  
> → `modules/default-modules.md § Subscription § Google Calendar 연동`  
> → `technical/scheduler.md § 작업 예시 § Google Drive 자동 백업`

```typescript
// packages/core/integrations/google/calendar.ts

import { google } from 'googleapis';
import { BaseIntegration } from '../base';

export class GoogleCalendar extends BaseIntegration {
  name = 'google-calendar';
  private calendar: any;
  
  async authenticate(credentials: { apiKey?: string, oauth?: any }) {
    await super.authenticate(credentials);
    
    const auth = new google.auth.OAuth2(
      credentials.oauth.clientId,
      credentials.oauth.clientSecret
    );
    
    auth.setCredentials(credentials.oauth.tokens);
    this.calendar = google.calendar({ version: 'v3', auth });
  }
  
  async createEvent(event: CalendarEvent) {
    return await this.calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.startTime },
        end: { dateTime: event.endTime },
        recurrence: event.recurrence
      }
    });
  }
  
  async listEvents(timeMin: Date, timeMax: Date) {
    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    return response.data.items;
  }
  
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>) {
    return await this.calendar.events.update({
      calendarId: 'primary',
      eventId,
      resource: updates
    });
  }
  
  async deleteEvent(eventId: string) {
    return await this.calendar.events.delete({
      calendarId: 'primary',
      eventId
    });
  }
}
```

### Google Drive

```typescript
// packages/core/integrations/google/drive.ts

export class GoogleDrive extends BaseIntegration {
  name = 'google-drive';
  private drive: any;
  
  async uploadFile(file: Buffer, fileName: string, mimeType: string) {
    const fileMetadata = {
      name: fileName
    };
    
    const media = {
      mimeType,
      body: file
    };
    
    const response = await this.drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, name, webViewLink'
    });
    
    return response.data;
  }
  
  async downloadFile(fileId: string) {
    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    
    return response.data;
  }
  
  async listFiles(query?: string) {
    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, createdTime)'
    });
    
    return response.data.files;
  }
  
  async shareFile(fileId: string, email: string, role: 'reader' | 'writer') {
    return await this.drive.permissions.create({
      fileId,
      resource: {
        type: 'user',
        role,
        emailAddress: email
      }
    });
  }
}
```

### Google Sheets

```typescript
// packages/core/integrations/google/sheets.ts

export class GoogleSheets extends BaseIntegration {
  name = 'google-sheets';
  private sheets: any;
  
  async createSpreadsheet(title: string) {
    const response = await this.sheets.spreadsheets.create({
      resource: { properties: { title } }
    });
    
    return response.data;
  }
  
  async appendData(spreadsheetId: string, range: string, values: any[][]) {
    return await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
  }
  
  async readData(spreadsheetId: string, range: string) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });
    
    return response.data.values;
  }
  
  async updateData(spreadsheetId: string, range: string, values: any[][]) {
    return await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
  }
}
```

### Gmail

```typescript
// packages/core/integrations/google/gmail.ts

export class Gmail extends BaseIntegration {
  name = 'gmail';
  private gmail: any;
  
  async sendEmail(to: string, subject: string, body: string) {
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');
    
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return await this.gmail.users.messages.send({
      userId: 'me',
      resource: { raw: encodedMessage }
    });
  }
  
  async listEmails(query?: string, maxResults: number = 10) {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults
    });
    
    return response.data.messages;
  }
}
```

---

## Notion 통합

```typescript
// packages/core/integrations/notion/index.ts

import { Client } from '@notionhq/client';
import { BaseIntegration } from '../base';

export class Notion extends BaseIntegration {
  name = 'notion';
  private client: Client;
  
  async authenticate(credentials: { apiKey: string }) {
    await super.authenticate(credentials);
    this.client = new Client({ auth: credentials.apiKey });
  }
  
  async createPage(databaseId: string, properties: any) {
    return await this.client.pages.create({
      parent: { database_id: databaseId },
      properties
    });
  }
  
  async updatePage(pageId: string, properties: any) {
    return await this.client.pages.update({
      page_id: pageId,
      properties
    });
  }
  
  async queryDatabase(databaseId: string, filter?: any) {
    return await this.client.databases.query({
      database_id: databaseId,
      filter
    });
  }
  
  async appendBlock(pageId: string, children: any[]) {
    return await this.client.blocks.children.append({
      block_id: pageId,
      children
    });
  }
}
```

---

## Slack 통합

```typescript
// packages/core/integrations/slack/index.ts

import { WebClient } from '@slack/web-api';
import { BaseIntegration } from '../base';

export class Slack extends BaseIntegration {
  name = 'slack';
  private client: WebClient;
  
  async authenticate(credentials: { token: string }) {
    await super.authenticate(credentials);
    this.client = new WebClient(credentials.token);
  }
  
  async sendMessage(channel: string, text: string, blocks?: any[]) {
    return await this.client.chat.postMessage({
      channel,
      text,
      blocks
    });
  }
  
  async uploadFile(channel: string, file: Buffer, filename: string) {
    return await this.client.files.upload({
      channels: channel,
      file,
      filename
    });
  }
  
  async listChannels() {
    const response = await this.client.conversations.list();
    return response.channels;
  }
}
```

---

## GitHub 통합

```typescript
// packages/core/integrations/github/index.ts

import { Octokit } from '@octokit/rest';
import { BaseIntegration } from '../base';

export class GitHub extends BaseIntegration {
  name = 'github';
  private client: Octokit;
  
  async authenticate(credentials: { token: string }) {
    await super.authenticate(credentials);
    this.client = new Octokit({ auth: credentials.token });
  }
  
  async createIssue(owner: string, repo: string, title: string, body: string) {
    return await this.client.issues.create({
      owner,
      repo,
      title,
      body
    });
  }
  
  async listIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
    const response = await this.client.issues.listForRepo({
      owner,
      repo,
      state
    });
    
    return response.data;
  }
  
  async createGist(description: string, files: Record<string, { content: string }>) {
    return await this.client.gists.create({
      description,
      files,
      public: false
    });
  }
}
```

---

## 커스텀 Webhook

```typescript
// packages/core/integrations/webhook.ts

import { BaseIntegration } from './base';

export class Webhook extends BaseIntegration {
  name = 'webhook';
  private url: string;
  
  async authenticate(credentials: { url: string, headers?: Record<string, string> }) {
    await super.authenticate(credentials);
    this.url = credentials.url;
  }
  
  async send(data: any, method: 'POST' | 'PUT' = 'POST') {
    const response = await fetch(this.url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.credentials.headers
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
```

---

## 통합 서비스 팩토리

> 📌 **Factory 패턴:**  
> → `technical/database.md § Provider 팩토리` - 동일한 패턴 사용

```typescript
// packages/core/integrations/factory.ts

export class IntegrationFactory {
  private integrations = new Map<string, Integration>();
  
  register(integration: Integration) {
    this.integrations.set(integration.name, integration);
  }
  
  get(name: string): Integration | undefined {
    return this.integrations.get(name);
  }
  
  async authenticate(name: string, credentials: any) {
    const integration = this.get(name);
    if (!integration) {
      throw new Error(`Integration not found: ${name}`);
    }
    
    await integration.authenticate(credentials);
  }
}

// 전역 인스턴스
export const integrations = new IntegrationFactory();

// 기본 통합 등록
integrations.register(new GoogleCalendar());
integrations.register(new GoogleDrive());
integrations.register(new GoogleSheets());
integrations.register(new Gmail());
integrations.register(new Notion());
integrations.register(new Slack());
integrations.register(new GitHub());
```

---

## 모듈에서 사용

> 📖 **모듈 개발 가이드:**  
> → `modules/development-guide.md § Backend 개발`

```typescript
// modules/subscription/backend/index.ts

import { integrations } from '@core/integrations';

export async function syncToCalendar(subscription: Subscription) {
  const calendar = integrations.get('google-calendar') as GoogleCalendar;
  
  if (!calendar.isAuthenticated()) {
    throw new Error('Google Calendar not authenticated');
  }
  
  await calendar.createEvent({
    title: `💳 ${subscription.serviceName} 결제일`,
    description: `금액: ${subscription.amount}원`,
    startTime: subscription.nextPaymentDate,
    endTime: subscription.nextPaymentDate,
    recurrence: subscription.billingCycle === 'monthly' 
      ? ['RRULE:FREQ=MONTHLY']
      : ['RRULE:FREQ=YEARLY']
  });
}
```

---

## 보안

> 📖 **보안 정책:**  
> → `technical/authentication.md § 보안 고려사항`

### API Key 암호화

> 📌 **암호화 구현:**  
> → `technical/database.md § 보안 § 암호화`

```typescript
// packages/core/integrations/security.ts

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || generateKey();
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 저장

API Key는 암호화하여 데이터베이스에 저장:

```typescript
await db.userIntegrations.create({
  userId: user.id,
  integration: 'google-calendar',
  credentials: encrypt(JSON.stringify(credentials))
});
```

---

## 에러 처리

```typescript
try {
  await calendar.createEvent(event);
} catch (error) {
  if (error.code === 401) {
    // 인증 만료
    throw new Error('Please re-authenticate with Google Calendar');
  } else if (error.code === 429) {
    // Rate limit
    throw new Error('Too many requests. Please try again later.');
  } else {
    throw error;
  }
}
```

---

## Scheduler 연계

> 📖 **Scheduler 활용:**  
> → `technical/scheduler.md § 통합 서비스 연계`

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

## 설정 관리

> 📖 **설정 UI:**  
> → `deployment/configuration.md § 통합 서비스 설정`

### 웹 UI에서 설정

```
설정 → 통합 서비스

┌─────────────────────────────────────┐
│ Google 서비스                        │
│                                     │
│ OAuth Client ID:                    │
│ [                       ]           │
│                                     │
│ OAuth Client Secret:                │
│ [                       ]           │
│                                     │
│ 연동 서비스:                         │
│ [✓] Google Calendar                │
│ [✓] Google Drive                   │
│ [ ] Gmail                          │
│ [ ] Google Sheets                  │
│                                     │
│ [연결 테스트]  [저장]               │
└─────────────────────────────────────┘
```

### Backend API

```typescript
// apps/api/src/routes/integrations.ts

router.post('/google/setup', authMiddleware, async (req, res) => {
  const { clientId, clientSecret, services } = req.body;
  
  // 1. OAuth 설정 저장
  await db.userSettings.upsert({
    where: { 
      user_id: req.user.id,
      key: 'google_oauth'
    },
    update: {
      value: JSON.stringify({ clientId, clientSecret, services })
    },
    create: {
      user_id: req.user.id,
      key: 'google_oauth',
      value: JSON.stringify({ clientId, clientSecret, services })
    }
  });
  
  res.json({ success: true });
});

// 연결 테스트
router.post('/google/test', authMiddleware, async (req, res) => {
  try {
    const calendar = integrations.get('google-calendar') as GoogleCalendar;
    
    // 간단한 API 호출로 테스트
    await calendar.listEvents(new Date(), new Date());
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});
```

---

## 사용 사례

### 1. 구독 → Google Calendar 동기화

> 📖 **실제 구현:**  
> → `modules/default-modules.md § Subscription § Google Calendar 연동`

```typescript
// modules/subscription/backend/calendar-sync.ts

export async function syncSubscriptionToCalendar(subscription: Subscription) {
  const calendar = integrations.get('google-calendar') as GoogleCalendar;
  
  if (!calendar.isAuthenticated()) {
    console.warn('Google Calendar not configured');
    return;
  }
  
  const event = {
    title: `💳 ${subscription.serviceName}`,
    description: `금액: ${subscription.amount}원`,
    startTime: subscription.nextPaymentDate,
    endTime: subscription.nextPaymentDate,
    recurrence: subscription.billingCycle === 'monthly'
      ? ['RRULE:FREQ=MONTHLY']
      : ['RRULE:FREQ=YEARLY']
  };
  
  const calendarEvent = await calendar.createEvent(event);
  
  // Calendar Event ID 저장
  await db.subscriptions.update({
    where: { id: subscription.id },
    data: { calendar_event_id: calendarEvent.id }
  });
}
```

### 2. 백업 → Google Drive 업로드

> 📖 **백업 전략:**  
> → `deployment/installation.md § 백업 전략`

```typescript
// apps/api/src/plugins/backup/drive-backup.ts

import { scheduler } from '@core/scheduler';
import { integrations } from '@core/integrations';

scheduler.register({
  name: 'backup-to-drive',
  schedule: '0 3 * * *',  // 매일 새벽 3시
  handler: async () => {
    // 1. DB 백업 생성
    const backupFile = await createDatabaseBackup();
    
    // 2. Google Drive 통합
    const drive = integrations.get('google-drive') as GoogleDrive;
    
    if (!drive.isAuthenticated()) {
      console.warn('Google Drive not configured - backup saved locally only');
      return;
    }
    
    // 3. 업로드
    const fileBuffer = await fs.readFile(backupFile);
    const uploaded = await drive.uploadFile(
      fileBuffer,
      `backup_${Date.now()}.sql.gz`,
      'application/gzip'
    );
    
    console.log(`✓ Backup uploaded to Google Drive: ${uploaded.webViewLink}`);
    
    // 4. 로컬 백업 파일 삭제 (선택)
    await fs.unlink(backupFile);
  }
});
```

### 3. 리포트 → Slack 알림

```typescript
// modules/ledger/backend/report.ts

export async function sendMonthlyReport(userId: string) {
  // 1. 월간 리포트 생성
  const report = await generateMonthlyReport(userId);
  
  // 2. Slack 통합
  const slack = integrations.get('slack') as Slack;
  
  if (!slack.isAuthenticated()) {
    console.warn('Slack not configured');
    return;
  }
  
  // 3. 메시지 전송
  await slack.sendMessage(
    '#finance-reports',
    '📊 월간 가계부 리포트',
    [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${report.month}월 요약*\n총 수입: ${report.income}원\n총 지출: ${report.expense}원`
        }
      }
    ]
  );
}
```

### 4. 이슈 → GitHub 자동 생성

```typescript
// apps/api/src/services/error-reporter.ts

export async function reportCriticalError(error: Error, context: any) {
  const github = integrations.get('github') as GitHub;
  
  if (!github.isAuthenticated()) {
    console.error('GitHub not configured - error not reported');
    return;
  }
  
  await github.createIssue(
    'your-org',
    'finance-system',
    `[AUTO] ${error.message}`,
    `
## Error Details

\`\`\`
${error.stack}
\`\`\`

## Context

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`
    `
  );
}
```

---

## 📚 관련 문서

### 아키텍처
- 📖 `architecture/overview.md § Core Layer` - 통합 서비스 위치
- 📖 `modules/system-design.md § 외부 서비스 통합` - 모듈 사용법

### 기술
- 📖 `technical/database.md § Provider 패턴` - 유사한 추상화 패턴
- 📖 `technical/database.md § 암호화` - API Key 암호화
- 📖 `technical/authentication.md § 보안` - 보안 정책
- 📖 `technical/scheduler.md § 통합 서비스 연계` - 자동화 워크플로우

### 모듈 개발
- 📖 `modules/development-guide.md § Backend 개발` - 통합 서비스 사용
- 📖 `modules/default-modules.md § Subscription` - 실제 사용 예시

### 배포
- 📖 `deployment/configuration.md § 통합 서비스` - 설정 관리
- 📖 `deployment/installation.md § 백업` - Google Drive 백업

---

## 🚀 다음 단계

통합 서비스를 이해했다면:

1. **설정** → `deployment/configuration.md`
2. **모듈 개발** → `modules/development-guide.md`
3. **자동화** → `technical/scheduler.md`

> 💬 **도움이 필요하신가요?**  
> → Discord: https://discord.gg/...  
> → GitHub Discussions: https://github.com/.../discussions