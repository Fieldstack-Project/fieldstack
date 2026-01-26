# 설정 관리

## 웹 UI를 통한 설정

모든 설정은 웹 UI에서 변경 가능하며, 환경 변수를 직접 수정할 필요가 없습니다.

## 설정 페이지 구조

```
설정
├── 일반 설정
│   ├── 프로필
│   ├── 언어
│   └── 테마
├── AI 설정
│   ├── Provider 변경
│   ├── API Key 관리
│   └── 연결 테스트
├── 데이터베이스
│   ├── 연결 정보
│   └── 연결 테스트
├── 통합 서비스
│   ├── Google (OAuth)
│   ├── Notion, Slack, GitHub
│   └── 커스텀 Webhook
├── 모듈 관리
│   ├── 설치된 모듈
│   ├── 마켓플레이스
│   └── 업데이트
├── 시스템
│   ├── 자동 업데이트
│   ├── 백업
│   └── 로그
└── 개발자 도구
    ├── API Keys
    ├── Webhooks
    └── 로그 뷰어
```

## 1. 일반 설정

### 프로필

```typescript
// apps/web/src/pages/Settings/Profile.tsx

<Form onSubmit={handleUpdateProfile}>
  <Input
    label="이름"
    value={profile.name}
    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
  />
  
  <Input
    label="이메일"
    type="email"
    value={profile.email}
    disabled
    help="이메일은 변경할 수 없습니다"
  />
  
  <Button type="submit">저장</Button>
</Form>
```

### 언어 설정

```typescript
<Select
  label="언어"
  options={[
    { value: 'ko', label: '한국어' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' }
  ]}
  value={language}
  onChange={setLanguage}
/>
```

### 테마 설정

```typescript
<RadioGroup
  label="테마"
  options={[
    { value: 'light', label: '라이트' },
    { value: 'dark', label: '다크' },
    { value: 'auto', label: '시스템 설정 따르기' }
  ]}
  value={theme}
  onChange={setTheme}
/>
```

## 2. AI 설정

```typescript
// apps/web/src/pages/Settings/AI.tsx

export default function AISettings() {
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  
  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/settings/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });
      
      if (response.ok) {
        notify.success('연결 성공!');
      } else {
        notify.error('연결 실패');
      }
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <Card title="AI 설정">
      <Select
        label="Provider"
        options={[
          { value: 'gemini', label: 'Google Gemini' },
          { value: 'openai', label: 'OpenAI' },
          { value: 'claude', label: 'Anthropic Claude' },
          { value: 'ollama', label: 'Ollama (로컬)' }
        ]}
        value={provider}
        onChange={setProvider}
      />
      
      {provider !== 'ollama' && (
        <Input
          label="API Key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          help={
            <a href={getAPIKeyLink(provider)} target="_blank">
              API Key 발급 방법 →
            </a>
          }
        />
      )}
      
      <div className="actions">
        <Button onClick={handleTest} loading={testing}>
          연결 테스트
        </Button>
        <Button variant="primary" onClick={handleSave}>
          저장
        </Button>
      </div>
    </Card>
  );
}
```

### Backend - 설정 저장

```typescript
// apps/api/src/routes/settings.ts

router.post('/ai', authMiddleware, async (req, res) => {
  const { provider, apiKey } = req.body;
  
  // API Key 암호화
  const encryptedKey = encrypt(apiKey);
  
  // DB에 저장
  await db.userSettings.upsert({
    where: { 
      user_id: req.user.id,
      key: 'ai'
    },
    update: {
      value: JSON.stringify({
        provider,
        apiKey: encryptedKey
      })
    },
    create: {
      user_id: req.user.id,
      key: 'ai',
      value: JSON.stringify({
        provider,
        apiKey: encryptedKey
      })
    }
  });
  
  res.json({ success: true });
});

// AI 연결 테스트
router.post('/ai/test', authMiddleware, async (req, res) => {
  const { provider, apiKey } = req.body;
  
  try {
    const ai = createAIProvider(provider, apiKey);
    const result = await ai.generate('Hello, test');
    
    res.json({ success: true, response: result });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

## 3. 데이터베이스 설정

```typescript
// apps/web/src/pages/Settings/Database.tsx

export default function DatabaseSettings() {
  const [config, setConfig] = useState({
    provider: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'finance',
    username: 'finance',
    password: ''
  });
  
  return (
    <Card title="데이터베이스">
      <Alert type="warning">
        ⚠️ 데이터베이스 설정 변경 시 시스템이 재시작됩니다.
      </Alert>
      
      <Select
        label="Provider"
        options={[
          { value: 'postgres', label: 'PostgreSQL' },
          { value: 'sqlite', label: 'SQLite' },
          { value: 'supabase', label: 'Supabase' }
        ]}
        value={config.provider}
        onChange={(v) => setConfig({ ...config, provider: v })}
      />
      
      {config.provider === 'postgres' && (
        <>
          <Input label="호스트" value={config.host} />
          <Input label="포트" value={config.port} />
          <Input label="데이터베이스" value={config.database} />
          <Input label="사용자" value={config.username} />
          <Input 
            label="비밀번호" 
            type="password" 
            value={config.password} 
          />
        </>
      )}
      
      <div className="actions">
        <Button onClick={handleTestConnection}>
          연결 테스트
        </Button>
        <Button variant="primary" onClick={handleSave}>
          저장 및 재시작
        </Button>
      </div>
    </Card>
  );
}
```

## 4. 통합 서비스 설정

### Google OAuth

```typescript
// apps/web/src/pages/Settings/Integrations/Google.tsx

export default function GoogleIntegration() {
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: ''
  });
  
  return (
    <Card title="Google 연동">
      <Input
        label="OAuth Client ID"
        value={config.clientId}
        onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
      />
      
      <Input
        label="OAuth Client Secret"
        type="password"
        value={config.clientSecret}
        onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
      />
      
      <Alert type="info">
        <h4>OAuth 설정 방법:</h4>
        <ol>
          <li>Google Cloud Console 접속</li>
          <li>OAuth 2.0 클라이언트 ID 생성</li>
          <li>승인된 리디렉션 URI 등록:
            <code>{window.location.origin}/auth/google/callback</code>
          </li>
        </ol>
        <a href="https://docs.google.com/..." target="_blank">
          자세한 가이드 보기 →
        </a>
      </Alert>
      
      <h3>연동할 서비스 선택</h3>
      <Checkbox label="Google Calendar" checked={true} />
      <Checkbox label="Google Drive" checked={true} />
      <Checkbox label="Gmail" checked={false} />
      <Checkbox label="Google Sheets" checked={false} />
      
      <Button variant="primary" onClick={handleSave}>
        저장
      </Button>
    </Card>
  );
}
```

### Slack, Notion 등

```typescript
<Card title="Slack">
  <Input
    label="Bot Token"
    type="password"
    placeholder="xoxb-..."
  />
  <Button onClick={handleTestSlack}>연결 테스트</Button>
</Card>

<Card title="Notion">
  <Input
    label="Integration Token"
    type="password"
  />
  <Button onClick={handleTestNotion}>연결 테스트</Button>
</Card>
```

## 5. 시스템 설정

### 자동 업데이트

```typescript
// apps/web/src/pages/Settings/System/Updates.tsx

export default function UpdateSettings() {
  const [config, setConfig] = useState({
    enabled: true,
    schedule: 'daily',
    time: '03:00',
    confirmBefore: true,
    maintenanceMode: true
  });
  
  return (
    <Card title="자동 업데이트">
      <Switch
        label="자동 업데이트 활성화"
        checked={config.enabled}
        onChange={(v) => setConfig({ ...config, enabled: v })}
      />
      
      {config.enabled && (
        <>
          <Select
            label="업데이트 주기"
            options={[
              { value: 'daily', label: '매일' },
              { value: 'weekly', label: '매주' },
              { value: 'monthly', label: '매월' }
            ]}
            value={config.schedule}
            onChange={(v) => setConfig({ ...config, schedule: v })}
          />
          
          <Input
            label="업데이트 시간"
            type="time"
            value={config.time}
            onChange={(e) => setConfig({ ...config, time: e.target.value })}
          />
          
          <Checkbox
            label="업데이트 전 확인 받기"
            checked={config.confirmBefore}
            onChange={(v) => setConfig({ ...config, confirmBefore: v })}
          />
          
          <Checkbox
            label="유지보수 모드 사용"
            checked={config.maintenanceMode}
            onChange={(v) => setConfig({ ...config, maintenanceMode: v })}
            help="업데이트 중 일반 사용자 접근 차단"
          />
        </>
      )}
      
      <Button variant="primary" onClick={handleSave}>
        저장
      </Button>
    </Card>
  );
}
```

### 백업 설정

```typescript
<Card title="백업">
  <Switch
    label="자동 백업 활성화"
    checked={backupEnabled}
  />
  
  <Select
    label="백업 주기"
    options={[
      { value: 'daily', label: '매일' },
      { value: 'weekly', label: '매주' }
    ]}
  />
  
  <Input
    label="백업 시간"
    type="time"
  />
  
  <Select
    label="백업 위치"
    options={[
      { value: 'local', label: '로컬 (./backups)' },
      { value: 'gdrive', label: 'Google Drive' },
      { value: 'custom', label: '커스텀 경로' }
    ]}
  />
  
  <div className="actions">
    <Button onClick={handleBackupNow}>
      지금 백업하기
    </Button>
    <Button onClick={handleRestore}>
      복원하기
    </Button>
  </div>
</Card>
```

## 설정 저장 위치

### 1. 데이터베이스 (user_settings 테이블)

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, key)
);
```

### 2. .env 파일 (시스템 설정)

```typescript
// apps/api/src/services/env-manager.ts

export async function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.join(process.cwd(), '.env');
  const content = await fs.readFile(envPath, 'utf-8');
  
  let newContent = content;
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, `${key}=${value}`);
    } else {
      newContent += `\n${key}=${value}`;
    }
  }
  
  await fs.writeFile(envPath, newContent);
  
  // 환경 변수 리로드
  process.env = { ...process.env, ...updates };
}
```

## 설정 변경 시 재시작

```typescript
// apps/api/src/services/restart.ts

export async function gracefulRestart() {
  console.log('Restarting server...');
  
  // 1. 새 요청 거부
  server.close();
  
  // 2. 진행 중인 요청 완료 대기
  await new Promise(resolve => {
    setTimeout(resolve, 5000);
  });
  
  // 3. 연결 종료
  await closeConnections();
  
  // 4. 프로세스 종료 (PM2가 재시작)
  process.exit(0);
}
```

## 설정 내보내기/가져오기

```typescript
// 설정 내보내기
router.get('/export', authMiddleware, async (req, res) => {
  const settings = await db.userSettings.findMany({
    where: { user_id: req.user.id }
  });
  
  const config = settings.reduce((acc, s) => {
    acc[s.key] = JSON.parse(s.value);
    return acc;
  }, {});
  
  res.json(config);
});

// 설정 가져오기
router.post('/import', authMiddleware, async (req, res) => {
  const config = req.body;
  
  for (const [key, value] of Object.entries(config)) {
    await db.userSettings.upsert({
      where: { 
        user_id: req.user.id,
        key 
      },
      update: { value: JSON.stringify(value) },
      create: {
        user_id: req.user.id,
        key,
        value: JSON.stringify(value)
      }
    });
  }
  
  res.json({ success: true });
});
```

## 설정 초기화

```typescript
<Button 
  variant="danger"
  onClick={handleReset}
>
  설정 초기화
</Button>

const handleReset = async () => {
  if (confirm('모든 설정을 초기값으로 되돌리시겠습니까?')) {
    await fetch('/api/settings/reset', { method: 'POST' });
    window.location.reload();
  }
};
```