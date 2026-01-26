# 자동 업데이트 시스템

## 개요

사용자가 설정한 시간대에 자동으로 시스템을 최신 버전으로 업데이트합니다.

## 업데이트 설정

### 웹 UI

```
설정 → 시스템 → 자동 업데이트

[✓] 자동 업데이트 활성화

업데이트 주기: [매일 ▼]
  - 매일
  - 매주 (요일 선택)
  - 매월

업데이트 시간: [03:00]

[ ] 업데이트 전 확인 받기
[✓] 유지보수 모드 사용

[저장]
```

### 설정 예시

**개인 사용자:**
```json
{
  "enabled": true,
  "schedule": "daily",
  "time": "03:00",
  "confirmBefore": false,
  "maintenanceMode": true
}
```

**팀 사용 (회사):**
```json
{
  "enabled": true,
  "schedule": "weekly",
  "day": "sunday",
  "time": "02:00",
  "confirmBefore": true,
  "maintenanceMode": true
}
```

**파워유저:**
```json
{
  "enabled": false
}
```

## 자동 업데이트 프로세스

```
1. 설정된 시간에 업데이트 체크
   ↓
2. 새 버전 발견?
   - 없으면 → 종료
   - 있으면 → 계속
   ↓
3. 활성 사용자 확인
   - 있으면 → 1시간 후 재시도
   - 없으면 → 계속
   ↓
4. 업데이트 전 확인 설정?
   - Yes → 관리자에게 알림 → 승인 대기
   - No → 바로 진행
   ↓
5. 유지보수 모드 활성화 (선택)
   ↓
6. 백업 생성
   - DB 백업
   - 코드 백업 (Git tag)
   - 설정 파일 백업
   ↓
7. 업데이트 실행
   - git pull (또는 Docker image pull)
   - npm install (의존성 업데이트)
   - DB 마이그레이션
   - 빌드
   ↓
8. 검증
   - Health check
   - 기본 API 테스트
   ↓
9. 서버 재시작
   ↓
10. 유지보수 모드 해제
    ↓
11. 완료 알림
```

## Backend 구현

### 업데이트 체커 (Scheduler)

```typescript
// apps/api/src/services/update-checker.ts

import { scheduler } from '@core/scheduler';

export function initUpdateChecker() {
  const config = getUpdateConfig();
  
  if (!config.enabled) {
    return;
  }
  
  // Cron 표현식 생성
  const cronExpression = buildCronExpression(config);
  
  scheduler.register({
    name: 'auto-update',
    schedule: cronExpression,
    handler: async () => {
      try {
        await runAutoUpdate();
      } catch (error) {
        await notifyAdmin({
          subject: '자동 업데이트 실패',
          message: error.message
        });
      }
    }
  });
}

function buildCronExpression(config: UpdateConfig): string {
  const [hour, minute] = config.time.split(':');
  
  switch (config.schedule) {
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      const dayMap = { sunday: 0, monday: 1, /* ... */ };
      return `${minute} ${hour} * * ${dayMap[config.day]}`;
    case 'monthly':
      return `${minute} ${hour} 1 * *`;
  }
}
```

### 업데이트 실행

```typescript
// apps/api/src/services/updater.ts

export async function runAutoUpdate() {
  logger.info('Starting auto update...');
  
  // 1. 새 버전 확인
  const latestVersion = await checkLatestVersion();
  const currentVersion = await getCurrentVersion();
  
  if (latestVersion === currentVersion) {
    logger.info('Already up to date');
    return { upToDate: true };
  }
  
  logger.info(`Update available: ${currentVersion} → ${latestVersion}`);
  
  // 2. 활성 사용자 확인
  const activeUsers = await getActiveUsers();
  
  if (activeUsers.length > 0) {
    logger.info(`Active users detected (${activeUsers.length}), postponing update`);
    return { postponed: true, reason: 'active_users' };
  }
  
  // 3. 승인 대기 (설정에 따라)
  const config = getUpdateConfig();
  
  if (config.confirmBefore) {
    await requestUpdateApproval(latestVersion);
    return { pending: true, reason: 'awaiting_approval' };
  }
  
  // 4. 유지보수 모드 활성화
  if (config.maintenanceMode) {
    await enableMaintenanceMode();
  }
  
  try {
    // 5. 백업
    logger.info('Creating backup...');
    await createBackup();
    
    // 6. 업데이트 실행
    logger.info('Pulling latest code...');
    await gitPull();
    
    logger.info('Installing dependencies...');
    await installDependencies();
    
    logger.info('Running migrations...');
    await runMigrations();
    
    logger.info('Building...');
    await build();
    
    // 7. 검증
    logger.info('Validating...');
    await validateUpdate();
    
    // 8. 재시작
    logger.info('Restarting server...');
    await gracefulRestart();
    
  } catch (error) {
    // 실패 시 롤백
    logger.error('Update failed, rolling back...', error);
    await rollback();
    throw error;
    
  } finally {
    // 유지보수 모드 해제
    if (config.maintenanceMode) {
      await disableMaintenanceMode();
    }
  }
}

async function checkLatestVersion(): Promise<string> {
  // GitHub API로 최신 릴리스 확인
  const response = await fetch(
    'https://api.github.com/repos/your-org/finance-system/releases/latest'
  );
  const data = await response.json();
  return data.tag_name.replace('v', '');
}

async function gitPull() {
  const { stdout, stderr } = await execAsync('git pull origin main');
  logger.info(stdout);
  if (stderr) logger.warn(stderr);
}

async function installDependencies() {
  await execAsync('pnpm install');
}

async function runMigrations() {
  // DB 마이그레이션 실행
  const modules = await getModules();
  for (const module of modules) {
    await runModuleMigrations(module);
  }
}

async function build() {
  await execAsync('pnpm build');
}

async function validateUpdate(): Promise<void> {
  // Health check
  const health = await fetch('http://localhost:3000/health');
  if (!health.ok) {
    throw new Error('Health check failed');
  }
  
  // 기본 API 테스트
  const api = await fetch('http://localhost:3000/api/ping');
  if (!api.ok) {
    throw new Error('API test failed');
  }
}
```

### 백업 & 롤백

```typescript
// apps/api/src/services/backup.ts

export async function createBackup(): Promise<string> {
  const timestamp = Date.now();
  const backupDir = `./backups/${timestamp}`;
  
  await fs.ensureDir(backupDir);
  
  // 1. DB 백업
  logger.info('Backing up database...');
  await backupDatabase(path.join(backupDir, 'database.sql.gz'));
  
  // 2. Git tag 생성 (코드 백업)
  const currentVersion = await getCurrentVersion();
  await execAsync(`git tag backup-${timestamp}-v${currentVersion}`);
  
  // 3. 설정 파일 백업
  await fs.copy('.env', path.join(backupDir, '.env'));
  await fs.copy('modules', path.join(backupDir, 'modules'));
  
  logger.info(`Backup created: ${backupDir}`);
  return backupDir;
}

export async function rollback() {
  logger.info('Rolling back to previous version...');
  
  // 최신 백업 찾기
  const backups = await fs.readdir('./backups');
  const latest = backups.sort().pop();
  const backupDir = `./backups/${latest}`;
  
  // Git 롤백
  const tag = `backup-${latest.split('-')[1]}`;
  await execAsync(`git checkout ${tag}`);
  
  // DB 복원
  await restoreDatabase(path.join(backupDir, 'database.sql.gz'));
  
  // 의존성 재설치
  await execAsync('pnpm install');
  
  // 빌드
  await execAsync('pnpm build');
  
  // 재시작
  await gracefulRestart();
}
```

### 유지보수 모드

```typescript
// apps/api/src/services/maintenance.ts

let maintenanceMode = false;

export function enableMaintenanceMode() {
  maintenanceMode = true;
  logger.info('Maintenance mode enabled');
}

export function disableMaintenanceMode() {
  maintenanceMode = false;
  logger.info('Maintenance mode disabled');
}

export function isMaintenanceMode(): boolean {
  return maintenanceMode;
}

// Middleware
export function maintenanceMiddleware(req, res, next) {
  if (maintenanceMode) {
    // 관리자는 접근 가능
    if (req.user?.role === 'admin') {
      return next();
    }
    
    // 일반 사용자 차단
    return res.status(503).json({
      error: 'System is under maintenance',
      message: '시스템 업데이트 중입니다. 잠시 후 다시 시도해주세요.',
      retryAfter: 300 // 5분
    });
  }
  
  next();
}
```

## Frontend 구현

### 업데이트 알림

```typescript
// apps/web/src/components/UpdateNotification.tsx

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  
  useEffect(() => {
    // 주기적으로 업데이트 확인
    const interval = setInterval(async () => {
      const response = await fetch('/api/system/update/check');
      const data = await response.json();
      
      if (data.available) {
        setUpdateAvailable(true);
        setNewVersion(data.version);
      }
    }, 60 * 60 * 1000); // 1시간마다
    
    return () => clearInterval(interval);
  }, []);
  
  if (!updateAvailable) return null;
  
  return (
    <Alert type="info" dismissible>
      <strong>새 버전 사용 가능!</strong>
      <p>
        버전 {newVersion}으로 업데이트할 수 있습니다.
      </p>
      <Button onClick={handleUpdateNow}>
        지금 업데이트
      </Button>
      <Button variant="secondary" onClick={handleDismiss}>
        나중에
      </Button>
    </Alert>
  );
}
```

### 유지보수 모드 화면

```typescript
// apps/web/src/pages/Maintenance.tsx

export default function Maintenance() {
  return (
    <div className="maintenance-screen">
      <div className="maintenance-content">
        <div className="icon">🔧</div>
        <h1>시스템 업데이트 중</h1>
        <p>
          Finance System을 더 나은 버전으로 업데이트하고 있습니다.
        </p>
        <Progress indeterminate />
        <p className="estimate">
          예상 완료 시간: 약 5분
        </p>
        <p className="note">
          💡 이 페이지는 자동으로 새로고침됩니다.
        </p>
      </div>
    </div>
  );
}
```

## 수동 업데이트

### UI

```typescript
// apps/web/src/pages/Settings/System/Updates.tsx

<Card title="업데이트">
  <div className="version-info">
    <div>
      <strong>현재 버전:</strong> v2.1.0
    </div>
    <div>
      <strong>최신 버전:</strong> v2.2.0
    </div>
  </div>
  
  <Button 
    variant="primary"
    onClick={handleCheckUpdate}
    loading={checking}
  >
    업데이트 확인
  </Button>
  
  {updateAvailable && (
    <>
      <Alert type="info">
        새 버전(v{latestVersion})이 사용 가능합니다!
      </Alert>
      
      <div className="changelog">
        <h4>변경 사항:</h4>
        <ul>
          {changelog.map((change, i) => (
            <li key={i}>{change}</li>
          ))}
        </ul>
      </div>
      
      <Button 
        variant="primary"
        onClick={handleUpdateNow}
        loading={updating}
      >
        지금 업데이트
      </Button>
    </>
  )}
</Card>
```

### API

```typescript
// apps/api/src/routes/system.ts

// 업데이트 확인
router.get('/update/check', requireAdmin, async (req, res) => {
  const latest = await checkLatestVersion();
  const current = await getCurrentVersion();
  
  res.json({
    available: latest !== current,
    current,
    latest,
    changelog: await getChangelog(latest)
  });
});

// 수동 업데이트 시작
router.post('/update/start', requireAdmin, async (req, res) => {
  // 백그라운드에서 업데이트 실행
  runAutoUpdate().catch(error => {
    logger.error('Update failed:', error);
  });
  
  res.json({ 
    success: true,
    message: 'Update started in background' 
  });
});
```

## Docker 환경

### Watchtower 통합

```yaml
# docker-compose.yml

services:
  app:
    image: your-org/finance-system:latest
    # ...
  
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_SCHEDULE=0 0 3 * * *  # 매일 새벽 3시
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_INCLUDE_STOPPED=true
      - WATCHTOWER_NOTIFICATION_URL=${WEBHOOK_URL}
    restart: unless-stopped
```

## 알림 시스템

### 업데이트 알림

```typescript
// apps/api/src/services/notifications.ts

export async function sendUpdateNotifications(version: string) {
  // 24시간 전 알림
  await scheduler.schedule({
    name: 'update-notification-24h',
    runAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    handler: async () => {
      await notifyAdmins({
        subject: '자동 업데이트 예정',
        message: `내일 새벽 3시에 v${version}으로 자동 업데이트됩니다.`
      });
    }
  });
  
  // 1시간 전 경고
  await scheduler.schedule({
    name: 'update-warning-1h',
    runAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
    handler: async () => {
      await notifyAdmins({
        subject: '자동 업데이트 1시간 전',
        message: `1시간 후 자동 업데이트가 시작됩니다. 작업 중인 내용을 저장하세요.`,
        priority: 'high'
      });
    }
  });
}

// 업데이트 완료 알림
export async function notifyUpdateComplete(version: string) {
  await notifyAdmins({
    subject: '자동 업데이트 완료',
    message: `v${version}으로 업데이트가 완료되었습니다.`,
    priority: 'normal'
  });
}

// 업데이트 실패 알림
export async function notifyUpdateFailed(error: Error) {
  await notifyAdmins({
    subject: '자동 업데이트 실패',
    message: `업데이트 중 오류가 발생했습니다:\n${error.message}`,
    priority: 'critical'
  });
}
```

## 롤백

### UI

```typescript
<Card title="롤백">
  <Alert type="warning">
    ⚠️ 이전 버전으로 되돌립니다. 최신 데이터가 손실될 수 있습니다.
  </Alert>
  
  <Select
    label="복원 지점"
    options={backups.map(b => ({
      value: b.id,
      label: `${b.version} - ${b.date}`
    }))}
  />
  
  <Button 
    variant="danger"
    onClick={handleRollback}
  >
    롤백 실행
  </Button>
</Card>
```